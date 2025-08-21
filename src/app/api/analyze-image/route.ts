import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CATEGORY_PIPE_STRING } from '@/lib/categories';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  let imageName = 'unknown-file';
  
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const userComment = formData.get('comment') as string | null;
    
    // Store image name for potential use in error handling
    if (image?.name) {
      imageName = image.name;
    }
    
    console.log('Received image analysis request:', {
      hasImage: !!image,
      imageName: image?.name,
      imageType: image?.type,
      imageSize: image?.size,
      hasComment: !!userComment,
      commentLength: userComment?.length || 0
    });
    
    if (!image) {
      console.error('No image provided in form data');
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate image type (including HEIC support)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(image.type.toLowerCase())) {
      console.error('Unsupported image format:', image.type, 'for file:', image.name);
      return NextResponse.json({ 
        error: `Unsupported image format: ${image.type}. Please use JPG, PNG, WEBP, or HEIC.`,
        receivedType: image.type,
        fileName: image.name 
      }, { status: 400 });
    }
    
    console.log('Image validation passed, proceeding with analysis');

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Initialize Gemini Pro Vision
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
    Analyze this image of a household item and extract the following information in JSON format:
    
    {
      "name": "specific item name",
      "category": "${CATEGORY_PIPE_STRING}",
      "brand": "brand name if visible",
      "model": "model number if visible", 
      "serial": "serial number if visible",
      "condition": "excellent|good|fair|poor",
      "estimatedValue": {
        "amount": number,
        "currency": "USD"
      },
      "description": "detailed description of the item",
      "confidence": number between 0-1,
      "room": "likely room location (living room, bedroom, kitchen, etc.)"
    }
    ${userComment ? `
    IMPORTANT: The user has provided additional context about this item: "${userComment}"
    Use this information to improve your analysis accuracy, especially for unique, rare, or collectible items.
    Consider this context when determining the name, category, estimated value, and description.
    ` : ''}
    Be as accurate as possible. If information is not clearly visible, use null for that field.
    For estimated value, provide a single realistic replacement cost based on the item's apparent condition and type.
    Choose the most likely replacement value with highest confidence rather than a range.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64,
          mimeType: image.type
        }
      }
    ]);

    const response = await result.response;
    const text = response.text();
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.warn('Invalid JSON response from AI, returning boilerplate data');
      return NextResponse.json(createBoilerplateAnalysis(imageName));
    }
    
    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
      
      // Validate that we have at least basic required fields
      if (!analysis.name && !analysis.category) {
        console.warn('AI analysis missing critical fields, returning boilerplate data');
        return NextResponse.json(createBoilerplateAnalysis(imageName));
      }
      
      return NextResponse.json(analysis);
    } catch (parseError) {
      console.warn('Failed to parse AI response JSON, returning boilerplate data:', parseError);
      return NextResponse.json(createBoilerplateAnalysis(imageName));
    }
    
  } catch (error) {
    console.error('Image analysis error, returning boilerplate data:', error);
    return NextResponse.json(createBoilerplateAnalysis(imageName));
  }
}

// Helper function to create boilerplate analysis for unrecognized images
function createBoilerplateAnalysis(fileName: string) {
  return {
    name: "Unrecognized Item",
    category: "other",
    brand: null,
    model: null,
    serial: null,
    condition: "good",
    estimatedValue: {
      amount: 0,
      currency: "USD"
    },
    description: "This item could not be automatically identified. Please review and update the details manually. Consider uploading additional images from different angles or with better lighting to help with identification.",
    confidence: 0.1,
    room: null,
    isUnrecognized: true,
    originalFileName: fileName,
    userGuidance: "To improve recognition: 1) Upload clearer images with good lighting, 2) Include multiple angles of the item, 3) Ensure the item fills most of the frame, 4) Add context in the comment field for unique items"
  };
}
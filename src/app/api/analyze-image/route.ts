import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    console.log('Received image analysis request:', {
      hasImage: !!image,
      imageName: image?.name,
      imageType: image?.type,
      imageSize: image?.size
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
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
    Analyze this image of a household item and extract the following information in JSON format:
    
    {
      "name": "specific item name",
      "category": "electronics|jewelry|furniture|appliances|clothing|art|books|tools|sports|other",
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
      throw new Error('Invalid JSON response from AI');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Image analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze image',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
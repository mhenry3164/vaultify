import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CATEGORY_PIPE_STRING } from '@/lib/categories';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userComment = formData.get('comment') as string | null;
    
    // Get all images from form data
    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        images.push(value);
      }
    }
    
    console.log('Received multi-image analysis request:', {
      imageCount: images.length,
      imageNames: images.map(img => img.name),
      imageTypes: images.map(img => img.type),
      imageSizes: images.map(img => img.size),
      hasComment: !!userComment,
      commentLength: userComment?.length || 0
    });
    
    if (images.length === 0) {
      console.error('No images provided in form data');
      return NextResponse.json({ error: 'No images provided' }, { status: 400 });
    }

    // Validate image types (including HEIC support)
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    for (const image of images) {
      if (!validTypes.includes(image.type.toLowerCase())) {
        console.error('Unsupported image format:', image.type, 'for file:', image.name);
        return NextResponse.json({ 
          error: `Unsupported image format: ${image.type}. Please use JPG, PNG, WEBP, or HEIC.`,
          receivedType: image.type,
          fileName: image.name 
        }, { status: 400 });
      }
    }
    
    console.log('All images validation passed, proceeding with multi-image analysis');

    // Convert all images to base64 and prepare content array
    const contentParts = [];
    
    // Add the prompt first
    const prompt = `
    Analyze these multiple images of a SINGLE household item and extract the following information in JSON format.
    
    IMPORTANT: These images show the SAME ITEM from different angles or include supporting documentation (like receipts/invoices).
    - Some images may show the item itself from different perspectives
    - Some images may show receipts, invoices, or purchase documentation
    - Use ALL images together to get the most complete and accurate analysis
    - If you see purchase information in receipts/invoices, use that for more accurate pricing and details
    
    Return this JSON format:
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
      "description": "detailed description combining information from all images",
      "confidence": number between 0-1,
      "room": "likely room location (living room, bedroom, kitchen, etc.)",
      "purchaseInfo": {
        "retailer": "store name if visible in receipt",
        "purchaseDate": "date if visible in receipt",
        "originalPrice": number if visible in receipt
      }
    }
    ${userComment ? `
    IMPORTANT: The user has provided additional context about this item: "${userComment}"
    Use this information to improve your analysis accuracy, especially for unique, rare, or collectible items.
    Consider this context when determining the name, category, estimated value, and description.
    ` : ''}
    Be as accurate as possible. If information is not clearly visible, use null for that field.
    For estimated value, provide a single realistic replacement cost based on the item's apparent condition and type.
    If you can see purchase information in receipts, factor that into your valuation.
    Choose the most likely replacement value with highest confidence rather than a range.
    `;
    
    contentParts.push(prompt);
    
    // Add all images to the content array
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      const bytes = await image.arrayBuffer();
      const base64 = Buffer.from(bytes).toString('base64');
      
      contentParts.push({
        inlineData: {
          data: base64,
          mimeType: image.type
        }
      });
    }

    // Initialize Gemini Pro Vision
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    console.log('Sending multi-image request to Gemini with', images.length, 'images');
    const result = await model.generateContent(contentParts);

    const response = await result.response;
    const text = response.text();
    
    console.log('Received response from Gemini:', text.substring(0, 200) + '...');
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    // Add metadata about the multi-image analysis
    analysis.multiImage = true;
    analysis.imageCount = images.length;
    analysis.imageNames = images.map(img => img.name);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Multi-image analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze images',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

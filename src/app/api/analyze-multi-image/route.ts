import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CATEGORY_PIPE_STRING } from '@/lib/categories';
import sharp from 'sharp';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  let imageNames: string[] = [];
  
  try {
    const formData = await request.formData();
    const userComment = formData.get('comment') as string | null;
    
    // Get all images from form data
    const images: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('image') && value instanceof File) {
        images.push(value);
        imageNames.push(value.name);
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

    // Check total payload size and compress if needed
    const MAX_TOTAL_SIZE_MB = 3.5; // Conservative limit for multi-image requests
    const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;
    const totalOriginalSize = images.reduce((sum, img) => sum + img.size, 0);
    
    console.log(`Total images size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB for ${images.length} images`);
    
    // Process and potentially compress images
    const processedImages: { buffer: Buffer; mimeType: string }[] = [];
    let totalProcessedSize = 0;
    
    for (let i = 0; i < images.length; i++) {
      const image = images[i];
      let imageBytes = await image.arrayBuffer();
      let buffer = Buffer.from(imageBytes);
      let mimeType = image.type;
      
      // If total size is too large, compress more aggressively
      if (totalOriginalSize > MAX_TOTAL_SIZE_BYTES) {
        try {
          // More aggressive compression for multi-image uploads
          const maxSizePerImage = MAX_TOTAL_SIZE_BYTES / images.length * 0.8; // Use 80% of average allowance
          
          if (buffer.length > maxSizePerImage) {
            console.log(`Compressing image ${i + 1} (${image.name}) from ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
            
            const compressedBuffer = await sharp(buffer)
              .jpeg({ quality: 60, progressive: true })
              .resize(1200, 1200, { 
                fit: 'inside',
                withoutEnlargement: true 
              })
              .toBuffer();
            
            buffer = compressedBuffer;
            mimeType = 'image/jpeg';
            
            console.log(`Compressed image ${i + 1} to ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
          }
        } catch (compressionError) {
          console.error(`Failed to compress image ${i + 1}:`, compressionError);
          // Continue with original image if compression fails
        }
      }
      
      processedImages.push({ buffer, mimeType });
      totalProcessedSize += buffer.length;
    }
    
    console.log(`Final total size: ${(totalProcessedSize / 1024 / 1024).toFixed(2)}MB`);
    
    // Final check - if still too large, reject
    if (totalProcessedSize > MAX_TOTAL_SIZE_BYTES * 1.1) { // Allow 10% buffer
      return NextResponse.json({ 
        error: 'Combined image size too large for multi-image processing. Please upload fewer images or smaller images.',
        totalSize: `${(totalProcessedSize / 1024 / 1024).toFixed(2)}MB`,
        maxSize: `${MAX_TOTAL_SIZE_MB}MB`,
        suggestion: 'Try uploading 1-2 images at a time, or compress images before upload'
      }, { status: 413 });
    }

    // Convert processed images to base64 and prepare content array
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
    
    // Add all processed images to the content array
    for (let i = 0; i < processedImages.length; i++) {
      const { buffer, mimeType } = processedImages[i];
      const base64 = buffer.toString('base64');
      
      contentParts.push({
        inlineData: {
          data: base64,
          mimeType: mimeType
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
      console.warn('Invalid JSON response from AI, returning boilerplate data for multi-image');
      return NextResponse.json(createMultiImageBoilerplateAnalysis(imageNames));
    }
    
    let analysis;
    try {
      analysis = JSON.parse(jsonMatch[0]);
      
      // Validate that we have at least basic required fields
      if (!analysis.name && !analysis.category) {
        console.warn('AI analysis missing critical fields, returning boilerplate data for multi-image');
        return NextResponse.json(createMultiImageBoilerplateAnalysis(imageNames));
      }
      
      // Add metadata about the multi-image analysis
      analysis.multiImage = true;
      analysis.imageCount = images.length;
      analysis.imageNames = images.map(img => img.name);
      
      return NextResponse.json(analysis);
    } catch (parseError) {
      console.warn('Failed to parse AI response JSON, returning boilerplate data for multi-image:', parseError);
      return NextResponse.json(createMultiImageBoilerplateAnalysis(imageNames));
    }
    
  } catch (error) {
    console.error('Multi-image analysis error, returning boilerplate data:', error);
    return NextResponse.json(createMultiImageBoilerplateAnalysis(imageNames));
  }
}

// Helper function to create boilerplate analysis for unrecognized multi-image uploads
function createMultiImageBoilerplateAnalysis(fileNames: string[]) {
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
    description: "This item could not be automatically identified from the uploaded images. This may be due to image size limits or processing constraints. Please review and update the details manually. Consider uploading smaller or fewer images at once for better processing.",
    confidence: 0.1,
    room: null,
    isUnrecognized: true,
    multiImage: true,
    imageCount: fileNames.length,
    imageNames: fileNames,
    originalFileNames: fileNames,
    userGuidance: "For better recognition with multiple images: 1) Try uploading fewer images at once, 2) Ensure images are under 2MB each, 3) Use clear, well-lit photos, 4) Include the most important angles first"
  };
}

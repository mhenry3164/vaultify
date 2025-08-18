import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CATEGORY_PIPE_STRING } from '@/lib/categories';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const userComment = formData.get('comment') as string | null;
    
    // Get current asset data
    const currentAssetData = formData.get('currentAsset') as string;
    if (!currentAssetData) {
      return NextResponse.json({ error: 'Current asset data is required' }, { status: 400 });
    }
    
    const currentAsset = JSON.parse(currentAssetData);
    
    // Get existing images from current asset
    const existingImages = [
      ...(currentAsset.imageUrl ? [currentAsset.imageUrl] : []),
      ...(currentAsset.additionalImages || [])
    ];
    
    // Get new images from form data
    const newImages: File[] = [];
    for (const [key, value] of formData.entries()) {
      if (key.startsWith('newImage') && value instanceof File) {
        newImages.push(value);
      }
    }
    
    console.log('Received asset enhancement request:', {
      assetId: currentAsset.id,
      assetName: currentAsset.name,
      existingImageCount: existingImages.length,
      newImageCount: newImages.length,
      hasComment: !!userComment,
      commentLength: userComment?.length || 0
    });
    
    if (newImages.length === 0) {
      console.error('No new images provided for enhancement');
      return NextResponse.json({ error: 'At least one new image is required for enhancement' }, { status: 400 });
    }

    // Validate new image types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    for (const image of newImages) {
      if (!validTypes.includes(image.type.toLowerCase())) {
        console.error('Unsupported image format:', image.type, 'for file:', image.name);
        return NextResponse.json({ 
          error: `Unsupported image format: ${image.type}. Please use JPG, PNG, WEBP, or HEIC.`,
          receivedType: image.type,
          fileName: image.name 
        }, { status: 400 });
      }
    }
    
    console.log('All new images validation passed, proceeding with asset enhancement');

    // Prepare content array for Gemini
    const contentParts = [];
    
    // Enhanced prompt for asset updating
    const prompt = `
    You are enhancing an existing household asset with new images. Here is the CURRENT asset information:
    
    **CURRENT ASSET DATA:**
    - Name: ${currentAsset.name}
    - Category: ${currentAsset.category}
    - Brand: ${currentAsset.brand || 'Unknown'}
    - Model: ${currentAsset.model || 'Unknown'}
    - Serial: ${currentAsset.serial || 'Unknown'}
    - Condition: ${currentAsset.condition}
    - Current Value: $${currentAsset.estimatedValue?.amount || 0}
    - Description: ${currentAsset.description || 'No description'}
    - Room: ${currentAsset.room || 'Unknown'}
    ${currentAsset.purchaseInfo ? `
    - Store: ${currentAsset.purchaseInfo.retailer || 'Unknown'}
    - Purchase Date: ${currentAsset.purchaseInfo.purchaseDate || 'Unknown'}
    - Original Price: $${currentAsset.purchaseInfo.originalPrice || 'Unknown'}` : ''}
    
    **TASK:** Analyze the new images provided and enhance/update the existing asset information. The new images may contain:
    - Serial numbers, model numbers, or ID cards/labels
    - Receipts or purchase documentation
    - Better views of the item showing condition or features
    - Additional details not visible in original images
    
    **INSTRUCTIONS:**
    1. Keep existing information that is accurate and well-established
    2. Update fields where new images provide better/more accurate information
    3. Add missing information found in new images (especially serial numbers, model info)
    4. If receipts are found, update purchase info and potentially estimated value
    5. Improve description with any new details discovered
    6. Only change condition if new images clearly show different condition
    
    Return this JSON format with enhanced information:
    {
      "name": "enhanced item name (keep current if accurate)",
      "category": "${CATEGORY_PIPE_STRING}",
      "brand": "enhanced brand (keep current if accurate)",
      "model": "enhanced model (keep current if accurate)", 
      "serial": "serial number (UPDATE if found in new images)",
      "condition": "excellent|good|fair|poor",
      "estimatedValue": {
        "amount": number,
        "currency": "USD"
      },
      "description": "enhanced description combining old and new information",
      "confidence": number between 0-1,
      "room": "room location (keep current if accurate)",
      "purchaseInfo": {
        "retailer": "store name if found in new receipts",
        "purchaseDate": "date if found in new receipts",
        "originalPrice": number if found in new receipts
      },
      "enhancementSummary": "brief summary of what was updated/enhanced from the new images"
    }
    ${userComment ? `
    ADDITIONAL CONTEXT: The user provided this context about the new images: "${userComment}"
    Use this information to better understand what they're trying to enhance.
    ` : ''}
    
    Focus on enhancing accuracy and completeness. If new images don't provide better information for a field, keep the existing value.
    `;
    
    contentParts.push(prompt);
    
    // Add existing images first (if we have URLs, we'd need to fetch them, but for now we'll focus on new images)
    // Note: In a production system, you might want to fetch existing images and include them
    // For now, we'll work with just the new images and existing data
    
    // Add new images to content array
    for (let i = 0; i < newImages.length; i++) {
      const image = newImages[i];
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

    console.log('Sending asset enhancement request to Gemini with', newImages.length, 'new images');
    const result = await model.generateContent(contentParts);

    const response = await result.response;
    const text = response.text();
    
    console.log('Received enhancement response from Gemini:', text.substring(0, 200) + '...');
    
    // Parse JSON response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    const enhancedAnalysis = JSON.parse(jsonMatch[0]);
    
    // Add metadata about the enhancement
    enhancedAnalysis.isEnhancement = true;
    enhancedAnalysis.newImageCount = newImages.length;
    enhancedAnalysis.newImageNames = newImages.map(img => img.name);
    enhancedAnalysis.originalAssetId = currentAsset.id;
    
    return NextResponse.json(enhancedAnalysis);
    
  } catch (error) {
    console.error('Asset enhancement error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to enhance asset',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}

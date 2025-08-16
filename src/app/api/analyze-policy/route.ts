import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { getUserAssetsAdmin } from '@/lib/assets-admin';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('policy') as File;
    const userId = formData.get('userId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No policy file provided' }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get user's assets for coverage analysis
    const userAssets = await getUserAssetsAdmin(userId);
    const totalInventoryValue = userAssets.reduce((sum, asset) => sum + asset.estimatedValue.amount, 0);
    
    // Convert file to appropriate format for analysis
    let fileData: string;
    let mimeType: string;
    
    if (file.type === 'application/pdf') {
      // For PDFs, we'll need to extract text first
      const buffer = await file.arrayBuffer();
      fileData = Buffer.from(buffer).toString('base64');
      mimeType = 'application/pdf';
    } else if (file.type.startsWith('image/')) {
      // For images, convert to base64
      const buffer = await file.arrayBuffer();
      fileData = Buffer.from(buffer).toString('base64');
      mimeType = file.type;
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Create inventory summary for context
    const inventorySummary = userAssets.map(asset => ({
      name: asset.name,
      category: asset.category,
      value: asset.estimatedValue.amount,
      brand: asset.brand,
      model: asset.model
    }));

    const prompt = `
Analyze this insurance policy document and compare it against the user's current inventory to identify coverage gaps and provide recommendations.

USER'S CURRENT INVENTORY:
Total Value: $${totalInventoryValue.toLocaleString()}
Items: ${JSON.stringify(inventorySummary, null, 2)}

ANALYSIS REQUIREMENTS:
1. Extract key policy details (coverage limits, deductibles, exclusions, policy type)
2. Identify specific coverage gaps between policy and inventory
3. Calculate under-insurance amounts for each category
4. Provide actionable recommendations

Return your analysis as a JSON object with this exact structure:
{
  "policyDetails": {
    "policyType": "homeowners|renters|auto|other",
    "carrier": "insurance company name",
    "policyNumber": "policy number if visible",
    "coverageLimit": {
      "dwelling": number,
      "personalProperty": number,
      "liability": number
    },
    "deductible": number,
    "effectiveDate": "YYYY-MM-DD",
    "expirationDate": "YYYY-MM-DD"
  },
  "coverageAnalysis": {
    "totalCovered": number,
    "totalUncovered": number,
    "gapPercentage": number,
    "adequacyRating": "excellent|good|fair|poor"
  },
  "gapsByCategory": [
    {
      "category": "electronics|jewelry|furniture|etc",
      "inventoryValue": number,
      "coveredAmount": number,
      "gap": number,
      "riskLevel": "high|medium|low"
    }
  ],
  "recommendations": [
    {
      "type": "increase_coverage|add_rider|schedule_items|lower_deductible",
      "priority": "high|medium|low",
      "description": "detailed recommendation",
      "estimatedCost": number,
      "potentialSavings": number
    }
  ],
  "exclusions": [
    "list of notable exclusions that affect user's inventory"
  ],
  "confidence": number
}

Be thorough in identifying coverage gaps, especially for high-value items like jewelry, electronics, and art that often require special coverage.
    `;

    let result;
    if (mimeType === 'application/pdf') {
      // For PDF files, we'll analyze them as documents
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: fileData
          }
        }
      ]);
    } else {
      // For image files
      result = await model.generateContent([
        prompt,
        {
          inlineData: {
            mimeType: mimeType,
            data: fileData
          }
        }
      ]);
    }

    const responseText = result.response.text();
    
    // Extract JSON from the response
    const jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) || 
                     responseText.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error('No JSON found in response:', responseText);
      return NextResponse.json({ 
        error: 'Failed to parse policy analysis',
        rawResponse: responseText 
      }, { status: 500 });
    }

    const analysisData = JSON.parse(jsonMatch[0].replace(/```json\n?|\n?```/g, ''));
    
    return NextResponse.json({
      success: true,
      analysis: analysisData,
      inventoryCount: userAssets.length,
      inventoryValue: totalInventoryValue
    });

  } catch (error) {
    console.error('Policy analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze policy document' },
      { status: 500 }
    );
  }
}
# API Integration Guide

## AI Processing with Gemini

### Image Analysis Endpoint

**File:** `src/app/api/analyze-image/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    
    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

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
        "low": number,
        "high": number,
        "currency": "USD"
      },
      "description": "detailed description of the item",
      "confidence": number between 0-1,
      "room": "likely room location (living room, bedroom, kitchen, etc.)"
    }
    
    Be as accurate as possible. If information is not clearly visible, use null for that field.
    For estimated value, provide a realistic replacement cost range based on the item's apparent condition and type.
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
      { error: 'Failed to analyze image' }, 
      { status: 500 }
    );
  }
}
```

### Policy Analysis Endpoint

**File:** `src/app/api/analyze-policy/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(request: NextRequest) {
  try {
    const { policyContent, userInventory } = await request.json();
    
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

    const prompt = `
    Analyze this insurance policy document and user's inventory to identify coverage gaps.
    
    POLICY DOCUMENT:
    ${policyContent}
    
    USER INVENTORY:
    ${JSON.stringify(userInventory, null, 2)}
    
    Provide analysis in this JSON format:
    {
      "policySummary": {
        "policyType": "homeowners|renters|condo",
        "personalPropertyLimit": number,
        "deductible": number,
        "specialLimits": {
          "jewelry": number,
          "electronics": number,
          "art": number,
          "collectibles": number
        }
      },
      "coverageGaps": [
        {
          "category": "category name",
          "inventoryValue": number,
          "currentCoverage": number,
          "gap": number,
          "recommendation": "specific recommendation",
          "priority": "high|medium|low"
        }
      ],
      "recommendations": [
        {
          "type": "endorsement|rider|increase",
          "description": "what to add/change",
          "estimatedCost": "cost estimate per year",
          "benefit": "coverage improvement"
        }
      ],
      "totalInventoryValue": number,
      "totalCurrentCoverage": number,
      "totalGap": number
    }
    
    Focus on identifying where the user's inventory value exceeds policy limits.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from AI');
    }
    
    const analysis = JSON.parse(jsonMatch[0]);
    
    return NextResponse.json(analysis);
    
  } catch (error) {
    console.error('Policy analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze policy' }, 
      { status: 500 }
    );
  }
}
```

## Firebase Integration

### Firebase Configuration

**File:** `src/lib/firebase.ts`

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### Asset Data Model

**File:** `src/types/asset.ts`

```typescript
export interface Asset {
  id: string;
  userId: string;
  name: string;
  category: 'electronics' | 'jewelry' | 'furniture' | 'appliances' | 'clothing' | 'art' | 'books' | 'tools' | 'sports' | 'other';
  brand?: string;
  model?: string;
  serial?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedValue: {
    low: number;
    high: number;
    currency: string;
  };
  description: string;
  confidence: number;
  room?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyAnalysis {
  policySummary: {
    policyType: 'homeowners' | 'renters' | 'condo';
    personalPropertyLimit: number;
    deductible: number;
    specialLimits: {
      jewelry: number;
      electronics: number;
      art: number;
      collectibles: number;
    };
  };
  coverageGaps: CoverageGap[];
  recommendations: Recommendation[];
  totalInventoryValue: number;
  totalCurrentCoverage: number;
  totalGap: number;
}

export interface CoverageGap {
  category: string;
  inventoryValue: number;
  currentCoverage: number;
  gap: number;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Recommendation {
  type: 'endorsement' | 'rider' | 'increase';
  description: string;
  estimatedCost: string;
  benefit: string;
}
```

### Asset Management Utilities

**File:** `src/lib/assets.ts`

```typescript
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where, 
  orderBy 
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Asset } from '@/types/asset';

export async function saveAsset(userId: string, assetData: Omit<Asset, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) {
  try {
    const docRef = await addDoc(collection(db, 'users', userId, 'assets'), {
      ...assetData,
      userId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    return docRef.id;
  } catch (error) {
    console.error('Error saving asset:', error);
    throw error;
  }
}

export async function uploadAssetImage(userId: string, assetId: string, imageFile: File) {
  try {
    const imageRef = ref(storage, `users/${userId}/assets/images/${assetId}-${Date.now()}`);
    const snapshot = await uploadBytes(imageRef, imageFile);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

export async function getUserAssets(userId: string): Promise<Asset[]> {
  try {
    const q = query(
      collection(db, 'users', userId, 'assets'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
    })) as Asset[];
  } catch (error) {
    console.error('Error getting user assets:', error);
    throw error;
  }
}

export async function updateAsset(userId: string, assetId: string, updates: Partial<Asset>) {
  try {
    const assetRef = doc(db, 'users', userId, 'assets', assetId);
    await updateDoc(assetRef, {
      ...updates,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error('Error updating asset:', error);
    throw error;
  }
}

export async function deleteAsset(userId: string, assetId: string) {
  try {
    await deleteDoc(doc(db, 'users', userId, 'assets', assetId));
  } catch (error) {
    console.error('Error deleting asset:', error);
    throw error;
  }
}
```

## Error Handling

### API Error Responses

All API endpoints return standardized error responses:

```typescript
interface ApiError {
  error: string;
  details?: string;
  code?: string;
}
```

### Common Error Codes

- `INVALID_FILE_TYPE` - Unsupported file format
- `FILE_TOO_LARGE` - File exceeds size limit
- `AI_PROCESSING_FAILED` - AI analysis failed
- `FIREBASE_ERROR` - Database operation failed
- `UNAUTHORIZED` - Authentication required
- `RATE_LIMITED` - Too many requests

### Client-Side Error Handling

```typescript
async function analyzeImage(imageFile: File) {
  try {
    const formData = new FormData();
    formData.append('image', imageFile);
    
    const response = await fetch('/api/analyze-image', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Analysis failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Image analysis error:', error);
    // Handle error in UI
    throw error;
  }
}
```

## Performance Considerations

### Image Processing
- Maximum file size: 10MB
- Supported formats: JPG, PNG, WEBP
- Images are resized client-side before upload
- Processing timeout: 30 seconds

### Gemini API Limits
- Rate limiting: 60 requests per minute
- Token limits: Consider prompt length
- Error retry logic with exponential backoff

### Firebase Optimization
- Use pagination for asset lists
- Implement offline support with Firebase cache
- Optimize Firestore queries with proper indexing

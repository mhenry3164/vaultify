# Development Strategy & Architecture

## Project Overview

Building a mobile-first demo of Asset Snap by Vaultify - an AI-powered household inventory system that identifies insurance coverage gaps. This is a functional demo, not static mockups.

## User Journey & Page Flow

### 1. Public Landing Page (`/`)
**Purpose:** Convert visitors to demo users  
**Design:** Match provided Asset Snap landing page exactly
- Header with logo "Asset Snap by Vaultify" + navigation
- Hero section: "Cover Your Assets. Automatically."
- Three-step process explanation
- Feature cards (Photo → Value, Policy Gap Alerts, Carrier-First)
- "Get early access" CTA button
- Mobile-responsive, dark theme with gold accents

**Technical:**
- Static Next.js page with Tailwind CSS
- No authentication required
- CTA button redirects to `/login`

### 2. Authentication Flow (`/login`)
**Purpose:** Demo account access only (no signup)  
**Design:** Clean, centered login card
- Asset Snap logo and branding
- Email/password form
- Demo account credentials displayed prominently
- Error handling for invalid credentials

**Technical:**
- Firebase Authentication
- 15 pre-seeded demo accounts (demo1-15@snapmyassets.com)
- Redirect to `/dashboard` on success
- AuthGuard protection for all subsequent pages

### 3. Dashboard/Home (`/dashboard`)
**Purpose:** Main navigation hub and progress overview
**Design:** Mobile-first dashboard
- Welcome message with user's progress
- Quick stats (items cataloged, estimated value, gaps found)
- Three main action cards:
  1. "Add Assets" → `/upload`
  2. "View Inventory" → `/inventory` 
  3. "Analyze Policy" → `/policy`
- Progress indicators for incomplete steps

**Technical:**
- Protected route (requires auth)
- Real-time data from Firestore
- Navigation to main app sections

### 4. Asset Upload Flow (`/upload`)
**Purpose:** Capture and process household items
**Design:** Mobile-optimized upload interface

#### 4a. Upload Screen (`/upload`)
- Step indicator (Step 1 of 4)
- Large upload zone with camera/gallery options
- Support single or multiple image upload
- Live preview of selected images
- "Process Images" button

#### 4b. Processing Screen (`/upload/processing`)
- Loading animation with progress steps:
  1. "Uploading images..."
  2. "AI analyzing items..."
  3. "Extracting details..."
  4. "Generating valuations..."
- Real-time status updates

#### 4c. Review Screen (`/upload/review`)
- Display AI analysis results one item at a time
- Editable fields: name, category, brand, model, value range
- User can approve, edit, or reject each item
- "Save to Inventory" for each approved item

**Technical:**
- File upload to Firebase Storage (`users/{uid}/assets/images/`)
- Real-time AI processing with Gemini Vision API
- Structured data extraction (name, category, brand, model, value, condition)
- Save approved items to Firestore (`users/{uid}/assets/`)

### 5. Inventory Management (`/inventory`)
**Purpose:** View and manage cataloged assets
**Design:** Mobile-friendly inventory list
- Search and filter by category/room
- Card-based layout showing item photos, names, values
- Total inventory value at top
- Edit/delete actions for each item
- "Add More Items" floating button

**Technical:**
- Real-time Firestore queries
- Optimistic updates for edits
- Image lazy loading for performance
- Category-based filtering

### 6. Policy Analysis Flow (`/policy`)
**Purpose:** Upload insurance documents and identify gaps

#### 6a. Policy Upload (`/policy`)
- Step indicator (Step 3 of 4)
- Upload zone for PDF or photos of policy documents
- Supported policy types (Homeowners, Renters, Condo, Business)
- Instructions for best results (declarations page, etc.)

#### 6b. Analysis Screen (`/policy/analysis`)
- Processing status for policy document
- AI extraction of coverage limits, deductibles, special limits
- Cross-reference with user's inventory
- Generate coverage gap analysis

#### 6c. Results Screen (`/policy/results`)
- Coverage gap summary with visual indicators
- Specific recommendations by category
- Demo upgrade CTAs (non-functional)
- "Download Report" option (PDF export)

**Technical:**
- PDF text extraction or image OCR
- AI analysis combining policy + inventory data
- Gap calculation algorithms
- Mock upgrade flow (demo only)

## Technical Architecture

### Frontend Stack
```
Next.js 15 (App Router)
├── TypeScript for type safety
├── Tailwind CSS v4 for styling
├── Framer Motion for animations
├── Lucide React for icons
└── React Hook Form for form handling
```

### Backend Services
```
Firebase
├── Authentication (Email/Password)
├── Firestore Database (user data, assets)
├── Storage (asset images)
└── Security Rules (user isolation)

Google AI
└── Gemini Vision API (image analysis)
```

### Data Models

**User Assets:**
```typescript
interface Asset {
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
    currency: 'USD';
  };
  description: string;
  confidence: number; // AI confidence 0-1
  room?: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

**Policy Analysis:**
```typescript
interface PolicyAnalysis {
  id: string;
  userId: string;
  policyType: 'homeowners' | 'renters' | 'condo' | 'business';
  coverageLimits: {
    personalProperty: number;
    deductible: number;
    specialLimits: {
      jewelry: number;
      electronics: number;
      art: number;
      collectibles: number;
    };
  };
  gaps: CoverageGap[];
  recommendations: string[];
  totalInventoryValue: number;
  totalCoverageGap: number;
  createdAt: Date;
}
```

### File Structure
```
src/
├── app/                           # Next.js App Router
│   ├── (public)/                 # Public routes (no auth)
│   │   ├── page.tsx              # Landing page
│   │   └── login/page.tsx        # Login page
│   ├── (protected)/              # Protected routes (auth required)
│   │   ├── dashboard/page.tsx    # Main dashboard
│   │   ├── upload/               # Asset upload flow
│   │   │   ├── page.tsx          # Upload screen
│   │   │   ├── processing/page.tsx
│   │   │   └── review/page.tsx
│   │   ├── inventory/page.tsx    # Asset inventory
│   │   └── policy/               # Policy analysis flow
│   │       ├── page.tsx
│   │       ├── analysis/page.tsx
│   │       └── results/page.tsx
│   ├── api/                      # API routes
│   │   ├── analyze-image/route.ts
│   │   ├── analyze-policy/route.ts
│   │   └── assets/route.ts
│   ├── layout.tsx                # Root layout
│   └── globals.css               # Global styles
├── components/                    # Reusable components
│   ├── ui/                       # Base UI components
│   ├── layout/                   # Layout components
│   ├── upload/                   # Upload-specific
│   ├── inventory/                # Inventory-specific
│   ├── policy/                   # Policy-specific
│   └── auth/                     # Authentication
├── lib/                          # Utilities
│   ├── firebase.ts               # Firebase config
│   ├── gemini.ts                 # AI processing
│   ├── auth.ts                   # Auth utilities
│   └── utils.ts                  # General utilities
├── hooks/                        # Custom React hooks
│   ├── useAuth.ts                # Authentication
│   ├── useAssets.ts              # Asset management
│   └── useUpload.ts              # Upload handling
└── types/                        # TypeScript definitions
    ├── asset.ts
    ├── user.ts
    └── policy.ts
```

## Mobile-First Design Principles

### Responsive Strategy
- **Primary:** 375px (iPhone SE) to 430px (iPhone Pro Max)
- **Secondary:** 768px+ (tablet/desktop support)
- **Touch targets:** Minimum 44px for all interactive elements
- **Typography:** Readable at all sizes (16px+ base)

### Navigation Pattern
- **Bottom tab bar** for main sections (Dashboard, Upload, Inventory, Policy)
- **Header with back button** for sub-pages
- **Swipe gestures** for image galleries and step flows
- **Pull-to-refresh** on inventory lists

### Performance Optimizations
- **Image lazy loading** with placeholder blur
- **Optimistic UI updates** for better perceived performance
- **Progressive loading** for asset lists
- **Offline support** with Firebase cache

## AI Processing Strategy

### Image Analysis Pipeline
1. **Client Upload** → Firebase Storage
2. **Trigger API** → `/api/analyze-image`
3. **Gemini Processing** → Extract metadata
4. **Response Format** → Structured JSON
5. **User Review** → Approve/edit results
6. **Save to Database** → Firestore

### Prompt Engineering
```
System: You are an expert appraiser analyzing household items.

Task: Analyze this image and extract:
- Item name (specific, not generic)
- Category (electronics, jewelry, furniture, appliances, clothing, art, books, tools, sports, other)
- Brand (if visible)
- Model (if visible)
- Serial number (if visible)
- Condition assessment
- Estimated replacement value range
- Room likely location

Format: Return JSON only, be conservative with values, mark confidence level.
```

### Error Handling
- **Retry logic** for failed AI requests
- **Fallback prompts** for unclear images
- **User feedback** for incorrect AI results
- **Manual entry option** when AI fails

## Security & Privacy

### Firebase Security Rules
```javascript
// Firestore Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      match /assets/{assetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}

// Storage Rules  
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Data Protection
- **User isolation:** All data scoped to authenticated user ID
- **No PII storage:** Policy documents processed but not permanently stored
- **Image cleanup:** Temporary processing images deleted after analysis
- **API rate limiting:** Prevent abuse of AI services

## Development Phases

### Phase 1: Foundation (Hours 1-6)
- [ ] Set up Next.js project with proper structure
- [ ] Configure Firebase (Auth, Firestore, Storage)
- [ ] Create base UI components (Button, Card, Input, etc.)
- [ ] Implement authentication flow
- [ ] Build landing page matching provided design

### Phase 2: Core Features (Hours 7-18)
- [ ] Asset upload and image processing
- [ ] AI integration with Gemini Vision API
- [ ] Asset review and approval workflow
- [ ] Inventory list and management
- [ ] Dashboard with progress tracking

### Phase 3: Policy Analysis (Hours 19-22)
- [ ] Policy document upload
- [ ] AI analysis combining policy + inventory
- [ ] Coverage gap calculation
- [ ] Results display and recommendations

### Phase 4: Polish & Testing (Hours 23-24)
- [ ] Mobile responsiveness refinement
- [ ] Error handling and edge cases
- [ ] Performance optimization
- [ ] Demo account setup and testing

## Success Metrics

### Functional Requirements
- [ ] Complete user flow from landing → login → upload → analysis
- [ ] Real AI processing with accurate results
- [ ] Mobile-responsive design matching provided mockups
- [ ] Demo accounts working with persistent data
- [ ] Policy analysis generating realistic gap recommendations

### Technical Requirements
- [ ] Sub-3 second page load times
- [ ] Smooth animations and transitions
- [ ] Proper error handling and loading states
- [ ] Clean, maintainable code structure
- [ ] Complete documentation

## Deployment Strategy

### Demo Environment
- **Platform:** Vercel (automatic from GitHub)
- **Domain:** Custom subdomain provided by client
- **Environment:** Production-ready but demo-scoped
- **Monitoring:** Basic error tracking and performance metrics

### Handoff Deliverables
- [ ] Deployed demo application with working URL
- [ ] Complete source code repository
- [ ] Environment setup documentation
- [ ] Demo account credentials
- [ ] Video walkthrough of functionality

This strategy document provides the complete roadmap for building a professional, functional demo that showcases the real technology behind Asset Snap while maintaining the mobile-first user experience that insurance carriers and policyholders expect.

# Setup Guide

## Required Dependencies

First, install the additional packages we need:

```bash
npm install firebase @google/generative-ai framer-motion lucide-react @headlessui/react class-variance-authority clsx tailwind-merge
```

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Google Gemini AI
GOOGLE_AI_API_KEY=your_gemini_api_key

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Firebase Setup

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project: "vaultify-demo"
3. Enable Google Analytics (optional)

### 2. Enable Authentication
1. Go to Authentication > Sign-in method
2. Enable Email/Password authentication
3. Add demo accounts (see Demo Accounts section)

### 3. Create Firestore Database
1. Go to Firestore Database
2. Create database in production mode
3. Set up security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to user's assets
      match /assets/{assetId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

### 4. Set up Storage
1. Go to Storage
2. Get started with default settings
3. Set up storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can upload to their own folder
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Google AI (Gemini) Setup

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. Create a new API key
3. Add the key to your `.env.local` file
4. Enable the Gemini Pro Vision model

## Demo Accounts Setup

Create these test accounts in Firebase Authentication:

```bash
# Email/Password pairs for demo
demo1@snapmyassets.com / DemoAccount1!
demo2@snapmyassets.com / DemoAccount2!
demo3@snapmyassets.com / DemoAccount3!
demo4@snapmyassets.com / DemoAccount4!
demo5@snapmyassets.com / DemoAccount5!
demo6@snapmyassets.com / DemoAccount6!
demo7@snapmyassets.com / DemoAccount7!
demo8@snapmyassets.com / DemoAccount8!
demo9@snapmyassets.com / DemoAccount9!
demo10@snapmyassets.com / DemoAccount10!
demo11@snapmyassets.com / DemoAccount11!
demo12@snapmyassets.com / DemoAccount12!
demo13@snapmyassets.com / DemoAccount13!
demo14@snapmyassets.com / DemoAccount14!
demo15@snapmyassets.com / DemoAccount15!
```

### Automated Account Creation Script

Create a script to add demo accounts:

```javascript
// scripts/create-demo-accounts.js
const { getAuth } = require('firebase-admin/auth');
const { initializeApp, cert } = require('firebase-admin/app');

// Initialize Firebase Admin
const serviceAccount = require('./firebase-admin-key.json');
initializeApp({
  credential: cert(serviceAccount)
});

async function createDemoAccounts() {
  const auth = getAuth();
  
  for (let i = 1; i <= 15; i++) {
    try {
      const user = await auth.createUser({
        email: `demo${i}@snapmyassets.com`,
        password: `DemoAccount${i}!`,
        displayName: `Demo User ${i}`
      });
      console.log(`Created user: demo${i}@snapmyassets.com`);
    } catch (error) {
      console.error(`Error creating demo${i}:`, error.message);
    }
  }
}

createDemoAccounts();
```

## Tailwind Configuration

Update `tailwind.config.ts` for the Asset Snap design:

```typescript
import type { Config } from "tailwindcss";

export default {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#f4c430', // Main gold color
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        dark: {
          50: '#f8f8f8',
          100: '#f0f0f0',
          200: '#e4e4e4',
          300: '#d1d1d1',
          400: '#b4b4b4',
          500: '#9a9a9a',
          600: '#818181',
          700: '#6a6a6a',
          800: '#2a2a2a',
          900: '#1a1a1a',
          950: '#0a0a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
```

## Development Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## Deployment

The app will be deployed to Vercel for the demo. See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

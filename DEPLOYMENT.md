# Vaultify - Vercel Deployment Guide

## Prerequisites
- GitHub repository with your code (✅ Already done)
- Vercel account (free tier available)
- Firebase project with credentials

## Deployment Steps

### 1. Connect to Vercel
1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "New Project"
3. Import your GitHub repository: `mhenry3164/vaultify`
4. Vercel will automatically detect this as a Next.js project

### 2. Environment Variables
You'll need to set these environment variables in Vercel:

**Firebase Configuration:**
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

**Firebase Admin (Server-side):**
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

**Google AI (for image analysis):**
- `GOOGLE_AI_API_KEY`

### 3. Configure Environment Variables in Vercel
1. In your Vercel project dashboard, go to "Settings" → "Environment Variables"
2. Add each variable with its corresponding value
3. Make sure to set them for "Production", "Preview", and "Development" environments

### 4. Deploy
1. Click "Deploy" - Vercel will automatically build and deploy your app
2. Your app will be available at: `https://your-project-name.vercel.app`

## Build Configuration
- ✅ `vercel.json` configuration file created
- ✅ Next.js build scripts configured in `package.json`
- ✅ TypeScript compilation successful
- ✅ All dependencies properly listed

## Mobile App Feel
Your app is configured with:
- Gold and black theme (#f4c430, #0a0a0a, #1a1a1a, #2a2a2a)
- Mobile-first responsive design
- Touch-optimized interactions
- App-like container with shadows

## Post-Deployment
1. Test all functionality on the deployed URL
2. Verify Firebase authentication works
3. Test image upload and AI analysis features
4. Check mobile responsiveness

## Troubleshooting
- If build fails, check the Vercel build logs
- Ensure all environment variables are set correctly
- Verify Firebase security rules allow your domain
- Check that Google AI API key has proper permissions

## Security Notes
- ✅ Sensitive files removed from git history
- ✅ Proper `.gitignore` configuration
- Environment variables are securely stored in Vercel
- Firebase service account credentials should be rotated if previously exposed

# Vaultify Demo - Project Documentation

## Overview
Asset Snap by Vaultify - AI-powered household inventory and insurance gap analysis demo application.

## Quick Start
```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure
```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Main dashboard pages
│   ├── upload/           # Asset upload pages
│   ├── inventory/        # Inventory management
│   ├── policy/           # Policy upload & analysis
│   └── globals.css       # Global styles
├── components/            # Reusable components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── upload/           # Upload-specific components
│   └── layout/           # Layout components
├── lib/                   # Utility libraries
│   ├── firebase.ts       # Firebase configuration
│   ├── ai.ts            # AI processing utilities
│   └── utils.ts         # General utilities
└── types/                # TypeScript type definitions
```

## Demo Features

### Page 1: Asset Upload & Processing
- Single/multi-item photo upload
- Real-time AI processing with Gemini Vision API
- Item classification, valuation, and metadata extraction
- User review and edit capabilities

### Page 2: Inventory List
- Mobile-friendly asset inventory display
- Organized by categories and rooms
- Edit and manage captured items

### Page 3: Policy Analysis
- Policy document upload (PDF/images)
- AI-powered coverage gap analysis
- Recommendations based on inventory vs policy limits

## Tech Stack
- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Firebase Firestore
- **Storage:** Firebase Storage
- **AI Processing:** Google Gemini Vision API
- **Authentication:** Firebase Auth

## Demo Accounts
Pre-seeded test accounts for demonstration:
- demo1@snapmyassets.com / DemoAccount1!
- demo2@snapmyassets.com / DemoAccount2!
- ... (through demo15@snapmyassets.com)

## Documentation
- [Setup Guide](./SETUP.md) - Environment and Firebase configuration
- [Components](./COMPONENTS.md) - Component documentation
- [API Integration](./API.md) - AI processing and Firebase integration
- [Deployment](./DEPLOYMENT.md) - Deployment instructions

## Development Timeline
- **Estimated Delivery:** Friday, August 15, 2025
- **Development Time:** 24 hours post-approval
- **Revision Rounds:** 2 included

## Contact
Matthew Henry - Development & Implementation

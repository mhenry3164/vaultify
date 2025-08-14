# Components Documentation

## Component Structure

```
src/components/
├── ui/                    # Base UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   ├── Card.tsx
│   ├── Modal.tsx
│   ├── ProgressBar.tsx
│   └── LoadingSpinner.tsx
├── layout/                # Layout components
│   ├── Header.tsx
│   ├── Navigation.tsx
│   └── Container.tsx
├── upload/                # Upload-specific components
│   ├── ImageUpload.tsx
│   ├── ProcessingStatus.tsx
│   ├── AssetReview.tsx
│   └── MultiUpload.tsx
├── inventory/             # Inventory components
│   ├── AssetCard.tsx
│   ├── AssetList.tsx
│   ├── CategoryFilter.tsx
│   └── AssetDetails.tsx
├── policy/                # Policy analysis components
│   ├── PolicyUpload.tsx
│   ├── GapAnalysis.tsx
│   ├── Recommendations.tsx
│   └── CoverageChart.tsx
└── auth/                  # Authentication components
    ├── LoginForm.tsx
    └── AuthGuard.tsx
```

## Base UI Components

### Button Component

**File:** `src/components/ui/Button.tsx`

```tsx
import { forwardRef } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-2xl text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-gradient-to-r from-primary-400 to-primary-300 text-black hover:shadow-lg hover:-translate-y-0.5',
        secondary: 'border-2 border-gray-600 bg-transparent text-white hover:border-primary-400 hover:text-primary-400',
        ghost: 'hover:bg-gray-800 text-gray-300 hover:text-white',
      },
      size: {
        sm: 'h-10 px-4 text-sm',
        md: 'h-12 px-6',
        lg: 'h-14 px-8 text-lg',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
```

### Card Component

**File:** `src/components/ui/Card.tsx`

```tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

const Card = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl bg-dark-800 border border-gray-700 shadow-lg',
        className
      )}
      {...props}
    />
  )
);

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);

const CardTitle = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-2xl font-semibold leading-none tracking-tight text-white', className)}
      {...props}
    />
  )
);

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

Card.displayName = 'Card';
CardHeader.displayName = 'CardHeader';
CardTitle.displayName = 'CardTitle';
CardContent.displayName = 'CardContent';

export { Card, CardHeader, CardTitle, CardContent };
```

### Input Component

**File:** `src/components/ui/Input.tsx`

```tsx
import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-12 w-full rounded-xl border border-gray-600 bg-dark-800 px-4 py-2 text-white placeholder:text-gray-400 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };
```

### Progress Bar Component

**File:** `src/components/ui/ProgressBar.tsx`

```tsx
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max?: number;
  className?: string;
  showLabel?: boolean;
  label?: string;
}

export function ProgressBar({ 
  value, 
  max = 100, 
  className, 
  showLabel = false, 
  label 
}: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100);

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-300">{label}</span>
          <span className="text-sm text-gray-300">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-primary-400 to-primary-300 transition-all duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
```

## Upload Components

### Image Upload Component

**File:** `src/components/upload/ImageUpload.tsx`

```tsx
'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({ 
  onImagesSelected, 
  maxFiles = 5, 
  className 
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles);
  }, [selectedFiles, maxFiles, onImagesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: maxFiles - selectedFiles.length,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-primary-400 hover:bg-dark-800/50',
          isDragActive && 'border-primary-400 bg-primary-400/10'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary-400 to-primary-300 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-black" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isDragActive ? 'Drop images here' : 'Upload asset photos'}
            </h3>
            <p className="text-gray-400">
              Drag & drop images or click to browse<br />
              JPG, PNG, WEBP up to 10MB each
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button size="sm" className="bg-transparent border border-gray-600">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <Button size="sm" variant="secondary">
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative">
              <div className="aspect-square bg-dark-800 rounded-xl overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Processing Status Component

**File:** `src/components/upload/ProcessingStatus.tsx`

```tsx
'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface ProcessingStatusProps {
  steps: ProcessingStep[];
  className?: string;
}

export function ProcessingStatus({ steps, className }: ProcessingStatusProps) {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const processingStepIndex = steps.findIndex(step => step.status === 'processing');
    if (processingStepIndex !== -1) {
      setCurrentStep(processingStepIndex);
    }
  }, [steps]);

  const getStepIcon = (status: ProcessingStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Clock className="w-5 h-5 text-primary-400 animate-spin" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-gray-600" />;
    }
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div className="text-center">
        <h3 className="text-xl font-semibold text-white mb-2">Processing Your Assets</h3>
        <p className="text-gray-400">AI is analyzing your photos...</p>
      </div>

      <div className="space-y-3">
        {steps.map((step, index) => (
          <div key={step.id} className="flex items-center space-x-3">
            {getStepIcon(step.status)}
            <span className={cn(
              'text-sm',
              step.status === 'completed' ? 'text-green-400' :
              step.status === 'processing' ? 'text-primary-400' :
              step.status === 'error' ? 'text-red-400' :
              'text-gray-400'
            )}>
              {step.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Layout Components

### Header Component

**File:** `src/components/layout/Header.tsx`

```tsx
'use client';

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { LogOut, Shield } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="bg-dark-900 border-b border-gray-800">
      <div className="max-w-md mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-primary-400 to-primary-300 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Asset Snap</h1>
              <p className="text-xs text-gray-400">by Vaultify</p>
            </div>
          </div>

          {user && (
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-gray-400 hover:text-white"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
```

### Container Component

**File:** `src/components/layout/Container.tsx`

```tsx
import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function Container({ children, className }: ContainerProps) {
  return (
    <div className={cn('max-w-md mx-auto px-6 py-8', className)}>
      {children}
    </div>
  );
}
```

## Inventory Components

### Asset Card Component

**File:** `src/components/inventory/AssetCard.tsx`

```tsx
import { Asset } from '@/types/asset';
import { Card, CardContent } from '@/components/ui/Card';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}

export function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  const formatValue = (value: { low: number; high: number; currency: string }) => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: value.currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    
    if (value.low === value.high) {
      return formatter.format(value.low);
    }
    
    return `${formatter.format(value.low)} - ${formatter.format(value.high)}`;
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {asset.imageUrl && (
          <div className="aspect-square bg-dark-700">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{asset.name}</h3>
            {asset.brand && (
              <p className="text-sm text-gray-400">{asset.brand} {asset.model}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-primary-400">
                {formatValue(asset.estimatedValue)}
              </p>
              <p className="text-xs text-gray-400 capitalize">
                {asset.condition} condition
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(asset)}
                className="p-2"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(asset.id)}
                className="p-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="capitalize">{asset.category}</span>
            {asset.room && <span>{asset.room}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

## Authentication Components

### Login Form Component

**File:** `src/components/auth/LoginForm.tsx`

```tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield } from 'lucide-react';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
    } catch (err) {
      setError('Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 to-dark-900 flex items-center justify-center p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-400 to-primary-300 rounded-2xl flex items-center justify-center">
            <Shield className="w-8 h-8 text-black" />
          </div>
          <CardTitle className="text-2xl">Asset Snap</CardTitle>
          <p className="text-gray-400">by Vaultify</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}
            
            <div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div>
              <Input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          
          <div className="mt-6 p-4 bg-dark-700 rounded-lg">
            <h4 className="text-sm font-medium text-white mb-2">Demo Accounts</h4>
            <div className="text-xs text-gray-400 space-y-1">
              <p>demo1@snapmyassets.com</p>
              <p>Password: DemoAccount1!</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Utility Functions

### Utils Library

**File:** `src/lib/utils.ts`

```typescript
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    electronics: '📱',
    jewelry: '💎',
    furniture: '🪑',
    appliances: '🏠',
    clothing: '👕',
    art: '🖼️',
    books: '📚',
    tools: '🔧',
    sports: '⚽',
    other: '📦',
  };
  
  return icons[category] || icons.other;
}
```

This comprehensive component documentation provides the foundation for building all the UI elements needed for the Vaultify demo. Each component follows the Asset Snap design aesthetic with the dark theme and gold accents.

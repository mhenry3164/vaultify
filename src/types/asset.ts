import { AssetCategory } from '@/lib/categories';

export interface Asset {
  id: string;
  userId: string;
  name: string;
  category: AssetCategory;
  brand?: string;
  model?: string;
  serial?: string;
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  estimatedValue: {
    amount: number;
    currency: string;
  };
  description: string;
  confidence: number;
  room?: string;
  imageUrl?: string;
  // Multi-image support
  additionalImages?: string[];
  // Purchase information from receipts/invoices
  purchaseInfo?: {
    retailer?: string;
    purchaseDate?: string;
    originalPrice?: number;
  };
  // Price justification fields for audit trail
  priceJustification?: string;
  priceChangeDate?: Date;
  originalPrice?: number;
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
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

export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

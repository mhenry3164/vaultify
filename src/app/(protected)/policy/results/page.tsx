'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, AlertTriangle, CheckCircle, DollarSign, TrendingUp, Shield } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

interface PolicyDetails {
  policyType: string;
  carrier: string;
  policyNumber?: string;
  coverageLimit: {
    dwelling?: number;
    personalProperty: number;
    liability: number;
  };
  deductible: number;
  effectiveDate?: string;
  expirationDate?: string;
}

interface CoverageAnalysis {
  totalCovered: number;
  totalUncovered: number;
  gapPercentage: number;
  adequacyRating: 'excellent' | 'good' | 'fair' | 'poor';
}

interface CategoryGap {
  category: string;
  inventoryValue: number;
  coveredAmount: number;
  gap: number;
  riskLevel: 'high' | 'medium' | 'low';
}

interface Recommendation {
  type: 'increase_coverage' | 'add_rider' | 'schedule_items' | 'lower_deductible';
  priority: 'high' | 'medium' | 'low';
  description: string;
  estimatedCost: number;
  potentialSavings: number;
}

interface PolicyAnalysis {
  policyDetails: PolicyDetails;
  coverageAnalysis: CoverageAnalysis;
  gapsByCategory: CategoryGap[];
  recommendations: Recommendation[];
  exclusions: string[];
  confidence: number;
}

interface AnalysisResult {
  success: boolean;
  analysis: PolicyAnalysis;
  inventoryCount: number;
  inventoryValue: number;
}

export default function PolicyResultsPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load analysis results from session storage
    const resultsData = sessionStorage.getItem('policyAnalysisResults');
    if (!resultsData) {
      router.push('/policy');
      return;
    }

    try {
      const results: AnalysisResult = JSON.parse(resultsData);
      setAnalysisResult(results);
    } catch (error) {
      console.error('Error loading analysis results:', error);
      router.push('/policy');
    } finally {
      setLoading(false);
    }
  }, [user, router]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/50';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  const getAdequacyColor = (rating: string) => {
    switch (rating) {
      case 'excellent': return 'text-green-400';
      case 'good': return 'text-yellow-400';
      case 'fair': return 'text-orange-400';
      case 'poor': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <p className="text-white">Loading analysis results...</p>
      </div>
    );
  }

  if (!analysisResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <p className="text-white">No analysis results found.</p>
      </div>
    );
  }

  const { analysis } = analysisResult;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/policy" className="flex items-center space-x-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white">Coverage Analysis</h1>
              <p className="text-xs text-gray-400">
                {analysis.policyDetails.carrier || 'Policy Review'}
              </p>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Overall Rating */}
          <Card>
            <CardContent className="p-6 text-center">
              <div className={`text-3xl font-bold mb-2 ${getAdequacyColor(analysis.coverageAnalysis.adequacyRating)}`}>
                {analysis.coverageAnalysis.adequacyRating.toUpperCase()}
              </div>
              <div className="text-sm text-gray-400 mb-4">Coverage Adequacy</div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-green-400 font-bold">
                    {formatCurrency(analysis.coverageAnalysis.totalCovered)}
                  </div>
                  <div className="text-gray-400">Covered</div>
                </div>
                <div>
                  <div className="text-red-400 font-bold">
                    {formatCurrency(analysis.coverageAnalysis.totalUncovered)}
                  </div>
                  <div className="text-gray-400">Gap</div>
                </div>
              </div>

              {analysis.coverageAnalysis.gapPercentage > 0 && (
                <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center justify-center space-x-2 text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">
                      {analysis.coverageAnalysis.gapPercentage.toFixed(1)}% of inventory uncovered
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Policy Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-400" />
                <span>Policy Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-400">Type</div>
                  <div className="text-white capitalize">{analysis.policyDetails.policyType}</div>
                </div>
                <div>
                  <div className="text-gray-400">Carrier</div>
                  <div className="text-white">{analysis.policyDetails.carrier}</div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-gray-400 text-sm">Coverage Limits</div>
                <div className="space-y-1 text-sm">
                  {analysis.policyDetails.coverageLimit.dwelling && (
                    <div className="flex justify-between">
                      <span className="text-gray-300">Dwelling</span>
                      <span className="text-white">
                        {formatCurrency(analysis.policyDetails.coverageLimit.dwelling)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-300">Personal Property</span>
                    <span className="text-white">
                      {formatCurrency(analysis.policyDetails.coverageLimit.personalProperty)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Liability</span>
                    <span className="text-white">
                      {formatCurrency(analysis.policyDetails.coverageLimit.liability)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-between text-sm pt-2 border-t border-gray-700">
                <span className="text-gray-400">Deductible</span>
                <span className="text-white">
                  {formatCurrency(analysis.policyDetails.deductible)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Gaps by Category */}
          {analysis.gapsByCategory.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-400" />
                  <span>Coverage Gaps</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.gapsByCategory.map((gap, index) => (
                  <div key={index} className="p-3 bg-gray-800/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <div className="text-white font-medium capitalize">{gap.category}</div>
                        <div className={`text-xs ${getRiskColor(gap.riskLevel)}`}>
                          {gap.riskLevel} risk
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-red-400 font-bold">
                          {formatCurrency(gap.gap)} gap
                        </div>
                        <div className="text-xs text-gray-400">
                          {formatCurrency(gap.coveredAmount)} of {formatCurrency(gap.inventoryValue)}
                        </div>
                      </div>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-400 h-2 rounded-full"
                        style={{ 
                          width: `${Math.max(5, (gap.coveredAmount / gap.inventoryValue) * 100)}%` 
                        }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span>Recommendations</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.recommendations.map((rec, index) => (
                <div key={index} className="p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div className={`px-2 py-1 rounded-md text-xs font-medium border ${getPriorityColor(rec.priority)}`}>
                      {rec.priority.toUpperCase()}
                    </div>
                    {rec.estimatedCost > 0 && (
                      <div className="text-right">
                        <div className="text-xs text-gray-400">Est. Cost</div>
                        <div className="text-white font-medium">
                          {formatCurrency(rec.estimatedCost)}/yr
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <p className="text-gray-300 text-sm mb-3">{rec.description}</p>
                  
                  {rec.potentialSavings > 0 && (
                    <div className="flex items-center space-x-2 text-green-400 text-xs">
                      <DollarSign className="w-3 h-3" />
                      <span>Protects up to {formatCurrency(rec.potentialSavings)}</span>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Exclusions */}
          {analysis.exclusions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-red-400" />
                  <span>Notable Exclusions</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {analysis.exclusions.map((exclusion, index) => (
                    <li key={index} className="text-sm text-gray-300 flex items-start space-x-2">
                      <span className="text-red-400 mt-1">•</span>
                      <span>{exclusion}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="space-y-3">
            <Button 
              className="w-full"
              onClick={() => {
                // TODO: Implement contact agent feature
                alert('Contact agent feature coming soon!');
              }}
            >
              Contact Insurance Agent
            </Button>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/policy">
                <Button variant="secondary" className="w-full">
                  Analyze Another Policy
                </Button>
              </Link>
              <Link href="/inventory">
                <Button variant="ghost" className="w-full">
                  View Inventory
                </Button>
              </Link>
            </div>
          </div>

          {/* Analysis Confidence */}
          <div className="text-center text-xs text-gray-400">
            Analysis confidence: {Math.round(analysis.confidence * 100)}%
          </div>
        </div>
      </main>
    </div>
  );
}
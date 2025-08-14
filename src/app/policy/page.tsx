'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Upload, FileText, AlertTriangle } from 'lucide-react';

export default function PolicyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsAnalyzing(true);
    
    // Simulate policy analysis
    setTimeout(() => {
      setIsAnalyzing(false);
    }, 3000);
  };

  if (!user) {
    return <div>Please log in to analyze your policy.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 to-dark-900">
      {/* Header */}
      <header className="bg-dark-900 border-b border-gray-800">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="p-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-xl font-bold text-white">Policy Analysis</h1>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Upload Insurance Policy</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-400 text-sm">
                Upload your homeowners, renters, or condo insurance policy document to analyze coverage gaps.
              </p>
              
              <div className="border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-primary-400 to-primary-300 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-black" />
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-2">
                  Upload Policy Document
                </h3>
                <p className="text-gray-400 mb-4">
                  PDF, JPG, PNG up to 10MB
                </p>
                
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="policy-upload"
                />
                <label htmlFor="policy-upload">
                  <Button className="cursor-pointer">
                    Choose File
                  </Button>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Analysis Status */}
          {isAnalyzing && (
            <Card>
              <CardContent className="py-8 text-center">
                <div className="animate-spin w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full mx-auto mb-4"></div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Analyzing Your Policy
                </h3>
                <p className="text-gray-400">
                  AI is reviewing your coverage and comparing with your inventory...
                </p>
              </CardContent>
            </Card>
          )}

          {/* Demo Notice */}
          <Card className="border-primary-400/20 bg-primary-400/5">
            <CardContent className="p-4">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-primary-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-primary-400 mb-1">
                    Demo Feature
                  </h4>
                  <p className="text-xs text-gray-300">
                    Policy analysis is a demo feature. In the full version, AI would analyze your policy documents and compare them with your inventory to identify coverage gaps and provide recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sample Analysis Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Sample Analysis Results</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-red-400">Electronics Coverage Gap</p>
                    <p className="text-xs text-gray-400">$15,000 inventory vs $5,000 limit</p>
                  </div>
                  <span className="text-red-400 font-bold">-$10,000</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-yellow-400">Jewelry Coverage</p>
                    <p className="text-xs text-gray-400">$8,000 inventory vs $2,500 limit</p>
                  </div>
                  <span className="text-yellow-400 font-bold">-$5,500</span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-green-400">Furniture Coverage</p>
                    <p className="text-xs text-gray-400">$12,000 inventory vs $25,000 limit</p>
                  </div>
                  <span className="text-green-400 font-bold">✓ Covered</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-700">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Coverage Gap</span>
                  <span className="text-xl font-bold text-red-400">$15,500</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-dark-700 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-1">
                  Electronics Rider
                </h4>
                <p className="text-xs text-gray-400 mb-2">
                  Add scheduled personal property coverage for high-value electronics
                </p>
                <p className="text-xs text-primary-400">
                  Estimated cost: $180/year
                </p>
              </div>

              <div className="p-3 bg-dark-700 rounded-lg">
                <h4 className="text-sm font-medium text-white mb-1">
                  Jewelry Appraisal
                </h4>
                <p className="text-xs text-gray-400 mb-2">
                  Get professional appraisals and add jewelry floater
                </p>
                <p className="text-xs text-primary-400">
                  Estimated cost: $120/year
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

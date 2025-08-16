'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Upload, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function PolicyPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const { user } = useAuth();
  const router = useRouter();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    // Check file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or image file (JPG, PNG, WEBP, HEIC)');
      return;
    }

    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setError(null);
  };

  // Drag and drop handlers
  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      validateAndSetFile(files[0]);
    }
  }, []);

  const handleAnalyze = async () => {
    if (!selectedFile || !user) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('policy', selectedFile);
      formData.append('userId', user.uid);
      
      const response = await fetch('/api/analyze-policy', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }
      
      const analysisResult = await response.json();
      
      // Store results in session storage
      sessionStorage.setItem('policyAnalysisResults', JSON.stringify(analysisResult));
      
      // Navigate to results page
      router.push('/policy/results');
      
    } catch (error) {
      console.error('Policy analysis error:', error);
      setError(error instanceof Error ? error.message : 'Analysis failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <p className="text-white">Please log in to analyze your policy.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2 text-gray-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white">Policy Analysis</h1>
              <p className="text-xs text-gray-400">Step 1 of 2</p>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-center">Upload Policy Document</CardTitle>
              <p className="text-gray-400 text-center text-sm">
                Upload your insurance policy to check for coverage gaps
              </p>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div 
                className={`
                  border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300
                  ${isDragActive 
                    ? 'border-gold-400 bg-gold-400/10 shadow-gold-glow/30' 
                    : selectedFile 
                    ? 'border-elegant-600 bg-elegant-800/30 hover:border-gold-400/50 hover:bg-elegant-700/30' 
                    : 'border-elegant-600 hover:border-gold-400/50 hover:bg-elegant-800/30'
                  }
                `}
                onDragOver={onDragOver}
                onDragLeave={onDragLeave}
                onDrop={onDrop}
                onClick={() => document.getElementById('policy-upload')?.click()}
              >
                <div className="space-y-4">
                  <div className={`
                    w-20 h-20 mx-auto rounded-full flex items-center justify-center transition-all duration-300
                    ${isDragActive ? 'bg-gradient-gold scale-110' : 'bg-gradient-gold'}
                    shadow-gold-glow/50
                  `}>
                    <FileText className="w-10 h-10 text-black" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
                      {isDragActive 
                        ? 'Drop policy document here' 
                        : selectedFile 
                        ? selectedFile.name 
                        : 'Upload Policy Document'
                      }
                    </h3>
                    <p className="text-elegant-400 leading-relaxed">
                      Drag & drop or click to browse<br />
                      <span className="text-elegant-500 text-sm">PDF or image files (JPG, PNG, WEBP, HEIC) • Max 10MB</span>
                    </p>
                  </div>
                  
                  <div className="flex gap-3 justify-center">
                    <input
                      type="file"
                      accept="application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="policy-upload"
                    />
                    <Button variant="outline" size="sm">
                      <Upload className="w-4 h-4 mr-2" />
                      {selectedFile ? 'Change File' : 'Browse Files'}
                    </Button>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              <div className="bg-elegant-800/30 border border-elegant-700/50 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-gold-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-medium text-white mb-1">Best Results Tips</h4>
                    <ul className="text-xs text-elegant-400 space-y-1">
                      <li>• Upload your declarations page for most accurate analysis</li>
                      <li>• Ensure coverage limits and deductibles are clearly visible</li>
                      <li>• Include special limits sections if available</li>
                    </ul>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center space-x-2 text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}

              {selectedFile && (
                <Button 
                  className="w-full" 
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                >
                  {isProcessing ? 'Analyzing Policy...' : 'Analyze Coverage'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="bg-blue-400/5 border-blue-400/20">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-400" />
                <div>
                  <p className="text-sm text-blue-100">
                    <strong>How it works:</strong> Upload your insurance policy document and our AI 
                    will analyze it against your current inventory to identify coverage gaps and 
                    provide personalized recommendations.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ProcessingStatus } from '@/components/upload/ProcessingStatus';
import { Button } from '@/components/ui/Button';
import { analyzeImage, saveAsset, uploadAssetImage, updateAsset } from '@/lib/assets';
import { ArrowLeft, Plus, Eye } from 'lucide-react';
import Link from 'next/link';

interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface ProcessedAsset {
  file: FileMetadata;
  analysis: any;
  assetId?: string;
  imageUrl?: string;
  error?: string;
}

export default function ProcessingPage() {
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: '1', label: 'Preparing images...', status: 'pending' },
    { id: '2', label: 'AI analyzing items...', status: 'pending' },
    { id: '3', label: 'Extracting details...', status: 'pending' },
    { id: '4', label: 'Saving to inventory...', status: 'pending' },
  ]);
  
  const [results, setResults] = useState<ProcessedAsset[]>([]);
  const [currentFileIndex, setCurrentFileIndex] = useState(0);
  const [totalFiles, setTotalFiles] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingComplete, setProcessingComplete] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Check if there's background processing happening
    const currentProcessing = (window as any).currentProcessing;
    
    if (currentProcessing) {
      // Monitor background processing
      monitorBackgroundProcessing(currentProcessing);
    } else {
      // Fallback to old processing method if no background processing
      if (!isProcessing) {
        processFiles();
      }
    }
  }, [user, isProcessing]);
  
  const monitorBackgroundProcessing = async (processingPromise: Promise<any>) => {
    setIsProcessing(true);
    
    // Set up progress monitoring
    (window as any).onProcessingProgress = (current: number, total: number, results: any[]) => {
      setCurrentFileIndex(current - 1);
      setTotalFiles(total);
      setResults(results);
      
      // Update step status based on progress
      if (current === 1) {
        updateStepStatus('1', 'completed');
        updateStepStatus('2', 'processing');
      }
      if (current > 1) {
        updateStepStatus('3', 'processing');
      }
      if (current === total) {
        updateStepStatus('2', 'completed');
        updateStepStatus('3', 'completed');
        updateStepStatus('4', 'completed');
      }
    };
    
    try {
      const finalResults = await processingPromise;
      setResults(finalResults);
      setProcessingComplete(true);
      setIsProcessing(false);
      
      // Clean up
      (window as any).onProcessingProgress = null;
      (window as any).currentProcessing = null;
      
    } catch (error) {
      console.error('Background processing failed:', error);
      setSteps(prev => prev.map(step => ({ ...step, status: 'error' })));
      setIsProcessing(false);
    }
  };

  const processFiles = async () => {
    // Prevent duplicate processing
    if (isProcessing) {
      console.log('Processing already in progress, skipping...');
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Get file metadata from sessionStorage and actual files from window
      const metadataStr = sessionStorage.getItem('uploadFileMetadata');
      const files = (window as any).uploadedFiles as File[];
      
      if (!metadataStr || !files || files.length === 0) {
        router.push('/upload');
        return;
      }

      const fileMetadata: FileMetadata[] = JSON.parse(metadataStr);
      const processedAssets: ProcessedAsset[] = [];

      // Step 1: Upload images
      updateStepStatus('1', 'processing');
      await delay(1000);
      updateStepStatus('1', 'completed');

      // Step 2: AI analyzing
      updateStepStatus('2', 'processing');

      for (let i = 0; i < files.length; i++) {
        setCurrentFileIndex(i);
        
        try {
          // Use the actual file directly (no conversion needed)
          const file = files[i];

          // Step 3: Extract details
          updateStepStatus('3', 'processing');
          
          // Analyze with AI
          const analysis = await analyzeImage(file);
          
          // Step 4: Generate valuations
          updateStepStatus('4', 'processing');
          await delay(500);

          // Save asset immediately after analysis
          let assetId: string | undefined;
          let imageUrl: string | undefined;
          
          try {
            // Save asset first to get ID
            assetId = await saveAsset(user!.uid, {
              name: analysis.name || 'Unknown Item',
              category: analysis.category || 'other',
              brand: analysis.brand,
              model: analysis.model,
              serial: analysis.serial,
              condition: analysis.condition || 'good',
              estimatedValue: analysis.estimatedValue || { amount: 0, currency: 'USD' },
              description: analysis.description || '',
              confidence: analysis.confidence || 0.5,
              room: analysis.room,
              imageUrl: '', // Will be updated after upload
            });
            
            // Upload image and update asset with image URL
            if (assetId) {
              imageUrl = await uploadAssetImage(user!.uid, assetId, file);
              
              if (imageUrl) {
                await updateAsset(user!.uid, assetId, { imageUrl });
              }
            }
          } catch (saveError) {
            console.error('Save error for file', fileMetadata[i].name, saveError);
          }

          processedAssets.push({
            file: fileMetadata[i],
            analysis,
            assetId,
            imageUrl
          });
          
        } catch (error) {
          console.error('Analysis error for file', fileMetadata[i].name, error);
          processedAssets.push({
            file: fileMetadata[i],
            analysis: null,
            error: error instanceof Error ? error.message : 'Analysis failed'
          });
        }
      }

      // Complete all steps
      updateStepStatus('2', 'completed');
      updateStepStatus('3', 'completed');
      updateStepStatus('4', 'completed');

      // Store processing summary (very compact)
      const processingSummary = {
        totalProcessed: processedAssets.length,
        successful: processedAssets.filter(asset => !asset.error && asset.assetId).length,
        failed: processedAssets.filter(asset => asset.error).length,
        assets: processedAssets.map(asset => ({
          name: asset.file.name,
          success: !asset.error && !!asset.assetId,
          error: asset.error
        }))
      };
      
      sessionStorage.setItem('processingSummary', JSON.stringify(processingSummary));
      
      // Clean up temporary storage
      delete (window as any).uploadedFiles;
      sessionStorage.removeItem('uploadFileMetadata');
      
      // Processing complete - show completion state but don't auto-redirect
      console.log('Processing completed for batch');
      
      // Store processing summary for potential review
      sessionStorage.setItem('lastProcessingSummary', JSON.stringify(processingSummary));

    } catch (error) {
      console.error('Processing error:', error);
      setSteps(prev => prev.map(step => ({ ...step, status: 'error' })));
    } finally {
      setIsProcessing(false);
    }
  };

  const updateStepStatus = (stepId: string, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, status } : step
    ));
  };

  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  return (
    <div className="min-h-screen bg-gradient-elegant">
      {/* Header */}
      <header className="bg-elegant-900/80 backdrop-blur-md border-b border-elegant-800/50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/upload" className="flex items-center space-x-2 text-elegant-400 hover:text-white transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white">Processing Assets</h1>
              <p className="text-xs text-elegant-400">AI Analysis & Storage</p>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-8">
          <ProcessingStatus steps={steps} />
          
          {(currentFileIndex > 0 || totalFiles > 0) && (
            <div className="text-center">
              <p className="text-elegant-400 text-sm">
                Processing image {currentFileIndex + 1} of {totalFiles || JSON.parse(sessionStorage.getItem('uploadFileMetadata') || '[]').length}
              </p>
            </div>
          )}
          
          {/* Action buttons - show after processing starts */}
          {(currentFileIndex > 0 || processingComplete) && (
            <div className="space-y-4">
              <div className="bg-elegant-800/30 border border-elegant-700/50 rounded-xl p-6 text-center">
                <h3 className="text-lg font-semibold text-white mb-2">Continue Working</h3>
                <p className="text-elegant-400 text-sm mb-4">
                  Processing continues in background. You can upload more items or view results.
                </p>
                
                <div className="flex gap-3 justify-center">
                  <Link href="/upload">
                    <Button variant="outline" className="flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add More Items
                    </Button>
                  </Link>
                  
                  <Link href="/inventory">
                    <Button className="flex items-center gap-2">
                      <Eye className="w-4 h-4" />
                      View Inventory
                    </Button>
                  </Link>
                </div>
              </div>
              
              {/* Processing summary when complete */}
              {(steps.every(step => step.status === 'completed') || processingComplete) && (
                <div className="bg-green-600/10 border border-green-600/20 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center mb-2">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                  <h4 className="text-green-400 font-medium mb-1">Batch Complete!</h4>
                  <p className="text-green-300 text-sm">
                    {results.filter(r => r.success && r.assetId).length} items saved to inventory
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ArrowLeft, Save, Upload, Camera } from 'lucide-react';
import { ProcessingStep, Asset } from '@/types/asset';
import { saveAsset, uploadAssetImage } from '@/lib/assets';
import { formatValueRange, cn } from '@/lib/utils';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { ProcessingStatus } from '@/components/upload/ProcessingStatus';

export default function UploadPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>([]);
  const [analyzedAssets, setAnalyzedAssets] = useState<any[]>([]);
  const [currentAssetIndex, setCurrentAssetIndex] = useState(0);

  const handleImagesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const analyzeImages = async () => {
    if (!selectedFiles.length || !user) return;

    setIsProcessing(true);
    const steps: ProcessingStep[] = [
      { id: '1', label: 'Uploading images...', status: 'processing' },
      { id: '2', label: 'Analyzing with AI...', status: 'pending' },
      { id: '3', label: 'Extracting metadata...', status: 'pending' },
      { id: '4', label: 'Estimating values...', status: 'pending' },
    ];
    setProcessingSteps(steps);

    try {
      const results = [];

      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        
        // Update step 1
        setProcessingSteps(prev => prev.map(step => 
          step.id === '1' ? { ...step, status: 'completed' } : step
        ));

        // Update step 2
        setProcessingSteps(prev => prev.map(step => 
          step.id === '2' ? { ...step, status: 'processing' } : step
        ));

        // Analyze image with AI
        const formData = new FormData();
        formData.append('image', file);

        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Failed to analyze image');
        }

        const analysis = await response.json();

        // Update step 3
        setProcessingSteps(prev => prev.map(step => 
          step.id === '2' ? { ...step, status: 'completed' } :
          step.id === '3' ? { ...step, status: 'processing' } : step
        ));

        // Simulate metadata extraction
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Update step 4
        setProcessingSteps(prev => prev.map(step => 
          step.id === '3' ? { ...step, status: 'completed' } :
          step.id === '4' ? { ...step, status: 'processing' } : step
        ));

        // Simulate value estimation
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Complete all steps
        setProcessingSteps(prev => prev.map(step => 
          ({ ...step, status: 'completed' })
        ));

        results.push({
          ...analysis,
          originalFile: file,
          imagePreview: URL.createObjectURL(file)
        });
      }

      setAnalyzedAssets(results);
    } catch (error) {
      console.error('Analysis error:', error);
      setProcessingSteps(prev => prev.map(step => 
        step.status === 'processing' ? { ...step, status: 'error' } : step
      ));
    } finally {
      setIsProcessing(false);
    }
  };

  const saveCurrentAsset = async () => {
    if (!user || !analyzedAssets[currentAssetIndex]) return;

    try {
      const asset = analyzedAssets[currentAssetIndex];
      
      // Upload image to Firebase Storage
      const imageUrl = await uploadAssetImage(
        user.uid, 
        `temp-${Date.now()}`, 
        asset.originalFile
      );

      // Save asset to Firestore
      const assetData = {
        name: asset.name,
        category: asset.category,
        brand: asset.brand,
        model: asset.model,
        serial: asset.serial,
        condition: asset.condition,
        estimatedValue: asset.estimatedValue,
        description: asset.description,
        confidence: asset.confidence,
        room: asset.room,
        imageUrl,
      };

      await saveAsset(user.uid, assetData);
      
      // Move to next asset or go to inventory
      if (currentAssetIndex < analyzedAssets.length - 1) {
        setCurrentAssetIndex(currentAssetIndex + 1);
      } else {
        router.push('/inventory');
      }
    } catch (error) {
      console.error('Save error:', error);
    }
  };

  const updateAssetField = (field: string, value: any) => {
    setAnalyzedAssets(prev => prev.map((asset, index) => 
      index === currentAssetIndex ? { ...asset, [field]: value } : asset
    ));
  };

  if (!user) {
    return <div>Please log in to upload assets.</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="bg-surface/80 backdrop-blur-sm border-b border-border/10 sticky top-0 z-50 safe-top">
        <div className="max-w-sm mx-auto px-6 py-5">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-surface-hover rounded-full transition-all active:scale-95"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">Upload Assets</h1>
              <p className="text-xs text-muted">AI-powered item analysis</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-sm mx-auto px-6 py-8 space-y-6">
        {!isProcessing && analyzedAssets.length === 0 && (
          <div className="bg-surface border border-border/10 rounded-3xl overflow-hidden shadow-sm animate-fade-in-up">
            <div className="p-6">
              <h2 className="text-xl font-bold text-center mb-2">Add Your Assets</h2>
              <p className="text-muted text-center text-sm mb-6">Upload photos and let AI analyze your items</p>
              
              <div className="space-y-6">
                <ImageUpload onImagesSelected={handleImagesSelected} />
                
                {selectedFiles.length > 0 && (
                  <button 
                    onClick={analyzeImages}
                    className="w-full h-14 text-lg font-bold bg-accent text-accent-foreground rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    <Upload className="w-5 h-5" />
                    Analyze {selectedFiles.length} Image{selectedFiles.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {isProcessing && (
          <div className="bg-surface border border-border/10 rounded-3xl overflow-hidden shadow-sm animate-fade-in-up">
            <div className="p-6">
              <h2 className="text-xl font-bold text-center mb-2">Processing Your Assets</h2>
              <p className="text-muted text-center text-sm mb-6">AI is analyzing your images...</p>
              
              <div className="p-2">
                <ProcessingStatus steps={processingSteps} />
              </div>
            </div>
          </div>
        )}

        {analyzedAssets.length > 0 && !isProcessing && (
          <div className="space-y-6 animate-fade-in-up">
            <div className="text-center">
              <div className="inline-flex items-center px-4 py-2 bg-accent/10 border border-accent/20 rounded-full">
                <span className="text-sm font-medium text-accent">
                  Asset {currentAssetIndex + 1} of {analyzedAssets.length}
                </span>
              </div>
            </div>

            <div className="bg-surface border border-border/10 rounded-3xl overflow-hidden shadow-sm">
              <div className="p-6 space-y-6">
                <div className="aspect-square bg-gradient-to-br from-surface-hover to-surface rounded-2xl overflow-hidden shadow-inner">
                  <img
                    src={analyzedAssets[currentAssetIndex].imagePreview}
                    alt="Asset"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={analyzedAssets[currentAssetIndex].name || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAssetField('name', e.target.value)}
                      className="w-full h-14 px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300"
                      placeholder="Enter item name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Brand
                    </label>
                    <input
                      type="text"
                      value={analyzedAssets[currentAssetIndex].brand || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateAssetField('brand', e.target.value)}
                      className="w-full h-14 px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all duration-300"
                      placeholder="Enter brand name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Estimated Value
                    </label>
                    <div className="bg-gradient-to-r from-accent/10 to-accent/5 border border-accent/20 rounded-2xl p-4">
                      <div className="text-2xl font-bold text-accent">
                        {formatValueRange(analyzedAssets[currentAssetIndex].estimatedValue)}
                      </div>
                      <p className="text-sm text-muted mt-1">AI-estimated replacement cost</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-muted-foreground mb-3">
                      Description
                    </label>
                    <textarea
                      className="w-full h-24 px-4 py-3 bg-background/50 backdrop-blur-sm border border-border/50 rounded-2xl text-foreground placeholder:text-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none transition-all duration-300"
                      value={analyzedAssets[currentAssetIndex].description || ''}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => updateAssetField('description', e.target.value)}
                      placeholder="Add any additional details..."
                    />
                  </div>
                </div>

                <button 
                  onClick={saveCurrentAsset} 
                  className="w-full h-14 text-lg font-bold bg-accent text-accent-foreground rounded-2xl flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                >
                  <Save className="w-5 h-5" />
                  Save Asset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

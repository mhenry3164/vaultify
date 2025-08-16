'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { saveAsset, uploadAssetImage, updateAsset } from '@/lib/assets';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const { user } = useAuth();

  const handleImagesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleProcessImages = async () => {
    if (selectedFiles.length === 0) return;
    
    setIsProcessing(true);
    
    try {
      // Start background processing immediately
      const processingPromise = startBackgroundProcessing(selectedFiles);
      
      // Store the processing promise globally so other pages can monitor it
      (window as any).currentProcessing = processingPromise;
      
      // Navigate to processing page to show progress
      router.push('/upload/processing');
      
    } catch (error) {
      console.error('Failed to start processing:', error);
      setIsProcessing(false);
    }
  };
  
  // Start processing in the background
  const startBackgroundProcessing = async (files: File[]) => {
    if (!user) throw new Error('User not authenticated');
    
    const results = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        // Analyze with AI
        const response = await fetch('/api/analyze-image', {
          method: 'POST',
          body: (() => {
            const formData = new FormData();
            formData.append('image', file);
            return formData;
          })()
        });
        
        if (!response.ok) {
          throw new Error(`Analysis failed: ${response.statusText}`);
        }
        
        const analysis = await response.json();
        
        // Save asset immediately
        const assetId = await saveAsset(user.uid, {
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
          imageUrl: '',
        });
        
        // Upload image
        let imageUrl;
        if (assetId) {
          imageUrl = await uploadAssetImage(user.uid, assetId, file);
          if (imageUrl) {
            await updateAsset(user.uid, assetId, { imageUrl });
          }
        }
        
        results.push({
          file: { name: file.name, size: file.size, type: file.type },
          analysis,
          assetId,
          imageUrl,
          success: true
        });
        
        // Notify progress (if processing page is listening)
        if ((window as any).onProcessingProgress) {
          (window as any).onProcessingProgress(i + 1, files.length, results);
        }
        
        // Notify global progress indicator
        if ((window as any).onGlobalProcessingUpdate) {
          (window as any).onGlobalProcessingUpdate(i + 1, files.length);
        }
        
      } catch (error) {
        console.error('Processing error for file:', file.name, error);
        results.push({
          file: { name: file.name, size: file.size, type: file.type },
          error: error instanceof Error ? error.message : 'Processing failed',
          success: false
        });
      }
    }
    
    return results;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-elegant flex items-center justify-center">
        <p className="text-white">Please log in to upload assets.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-elegant">
      {/* Header */}
      <header className="bg-elegant-900/80 backdrop-blur-md border-b border-elegant-800/50">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center space-x-2 text-elegant-400 hover:text-white transition-colors duration-200">
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </Link>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white">Add Assets</h1>
              <p className="text-xs text-elegant-400">Step 1 of 3</p>
            </div>
            <div className="w-16" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        <Card className="shadow-elegant-lg border-elegant-600/50">
          <CardHeader className="pb-6">
            <CardTitle className="text-center text-2xl mb-3">Upload Photos</CardTitle>
            <p className="text-elegant-400 text-center text-sm leading-relaxed">
              Take or upload photos of items you want to catalog
            </p>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <ImageUpload
              onImagesSelected={handleImagesSelected}
              maxFiles={5}
            />

            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-elegant-400 text-sm">
                    {selectedFiles.length} image{selectedFiles.length === 1 ? '' : 's'} selected
                  </p>
                </div>
                
                <Button
                  onClick={handleProcessImages}
                  disabled={isProcessing}
                  className="w-full"
                >
                  {isProcessing ? (
                    'Processing...'
                  ) : (
                    <>
                      Process Images
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { ImageUpload } from '@/components/upload/ImageUpload';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { saveAsset, uploadAssetImage, updateAsset } from '@/lib/assets';
import { ArrowLeft, ArrowRight, Plus, X } from 'lucide-react';
import Link from 'next/link';

// Helper function to create fallback analysis when uploads fail
function createFallbackAnalysis(fileName: string, reason: string) {
  return {
    name: "Unrecognized Item",
    category: "other",
    brand: null,
    model: null,
    serial: null,
    condition: "good",
    estimatedValue: {
      amount: 0,
      currency: "USD"
    },
    description: `This item could not be automatically identified. ${reason} Please review and update the details manually.`,
    confidence: 0.1,
    room: null,
    isUnrecognized: true,
    originalFileName: fileName,
    userGuidance: "To improve processing: 1) Try uploading smaller images (under 2MB each), 2) Upload one image at a time, 3) Use clear, well-lit photos, 4) Ensure good image quality"
  };
}

export default function UploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [userComment, setUserComment] = useState<string>('');
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [resetTrigger, setResetTrigger] = useState(0);
  const [isMultiImageMode, setIsMultiImageMode] = useState(false);
  const { user } = useAuth();

  const handleImagesSelected = (files: File[]) => {
    setSelectedFiles(files);
  };

  const handleProcessImages = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
      // Start background processing immediately
      const processingPromise = startBackgroundProcessing(selectedFiles);
      
      // Store the processing promise globally so notification system can monitor it
      (window as any).currentProcessing = processingPromise;
      
      // Clear selected files and reset ImageUpload component to blank slate
      setSelectedFiles([]);
      setResetTrigger(prev => prev + 1); // This will trigger ImageUpload to clear thumbnails
      
      // Keep user on upload page - processing continues in background
      // The BackgroundProcessingIndicator will show progress
      
    } catch (error) {
      console.error('Failed to start processing:', error);
    }
  };
  
  // Start processing in the background
  const startBackgroundProcessing = async (files: File[]) => {
    if (!user) throw new Error('User not authenticated');
    
    const results = [];
    
    // Immediately notify the total count to prevent "0 of 0" display
    if ((window as any).onGlobalProcessingUpdate) {
      (window as any).onGlobalProcessingUpdate(0, files.length);
    }
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        let response;
        
        if (isMultiImageMode && i === 0) {
          // Multi-image mode: process all files together in first iteration
          const formData = new FormData();
          files.forEach((f, index) => {
            formData.append(`image${index}`, f);
          });
          if (userComment.trim()) {
            formData.append('comment', userComment.trim());
          }
          
          response = await fetch('/api/analyze-multi-image', {
            method: 'POST',
            body: formData
          });
        } else if (isMultiImageMode && i > 0) {
          // Skip subsequent iterations in multi-image mode
          continue;
        } else {
          // Single image mode: analyze each image separately
          const formData = new FormData();
          formData.append('image', file);
          if (userComment.trim()) {
            formData.append('comment', userComment.trim());
          }
          
          response = await fetch('/api/analyze-image', {
            method: 'POST',
            body: formData
          });
        }
        
        let analysis;
        
        if (!response.ok) {
          // Handle 413 (Content Too Large) errors with fallback save
          if (response.status === 413) {
            const errorMessage = isMultiImageMode 
              ? 'Multi-image upload too large - try uploading fewer images at once or compress images before uploading.'
              : 'Image too large for processing. Please try a smaller image or compress before uploading.';
            console.warn('Request too large (413), creating fallback asset for:', isMultiImageMode ? `${files.length} images` : file.name);
            analysis = createFallbackAnalysis(
              isMultiImageMode ? `Multi-image upload (${files.length} images)` : file.name, 
              errorMessage
            );
          } else {
            throw new Error(`Analysis failed: ${response.statusText}`);
          }
        } else {
          analysis = await response.json();
        }
        
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
          // Add purchase info if available from multi-image analysis
          ...(analysis.purchaseInfo && {
            purchaseInfo: analysis.purchaseInfo
          })
        });
        
        // Upload images (all images for multi-image mode, single image for single mode)
        const imagesToUpload = isMultiImageMode ? files : [file];
        const imageUrls: string[] = [];
        
        if (assetId) {
          for (const imageFile of imagesToUpload) {
            const imageUrl = await uploadAssetImage(user.uid, assetId, imageFile);
            if (imageUrl) {
              imageUrls.push(imageUrl);
            }
          }
          
          // Update asset with primary image URL (first image)
          if (imageUrls.length > 0) {
            await updateAsset(user.uid, assetId, { 
              imageUrl: imageUrls[0],
              ...(imageUrls.length > 1 && { additionalImages: imageUrls.slice(1) })
            });
          }
        }
        
        // In multi-image mode, create result for all files but with same analysis
        if (isMultiImageMode) {
          files.forEach((f, idx) => {
            results.push({
              file: { name: f.name, size: f.size, type: f.type },
              analysis,
              assetId,
              imageUrl: imageUrls[idx] || imageUrls[0],
              success: true,
              isMultiImage: true,
              isPrimary: idx === 0
            });
          });
          // Break out of the loop since we processed all files
          break;
        } else {
          results.push({
            file: { name: file.name, size: file.size, type: file.type },
            analysis,
            assetId,
            imageUrl: imageUrls[0],
            success: true
          });
        }
        
        // Notify progress (if processing page is listening)
        if ((window as any).onProcessingProgress) {
          const progressCount = isMultiImageMode ? files.length : i + 1;
          (window as any).onProcessingProgress(progressCount, files.length, results);
        }
        
        // Notify global progress indicator
        if ((window as any).onGlobalProcessingUpdate) {
          const progressCount = isMultiImageMode ? files.length : i + 1;
          (window as any).onGlobalProcessingUpdate(progressCount, files.length);
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
              resetTrigger={resetTrigger}
            />

            {/* User Comment Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm text-elegant-300 font-medium">
                  Add context for unique items
                </label>
                <button
                  onClick={() => setShowCommentDialog(true)}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-500 hover:bg-primary-600 transition-colors duration-200"
                  type="button"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
              </div>
              
              {userComment && (
                <div className="bg-elegant-800/50 rounded-lg p-3 border border-elegant-700/50">
                  <p className="text-sm text-elegant-300 mb-2">Your comment:</p>
                  <p className="text-sm text-white">{userComment}</p>
                  <button
                    onClick={() => setUserComment('')}
                    className="text-xs text-elegant-400 hover:text-white mt-2 underline"
                    type="button"
                  >
                    Clear comment
                  </button>
                </div>
              )}
            </div>

            {/* Multi-Image Toggle */}
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-elegant-800/30 rounded-lg border border-elegant-700/50">
                <div className="space-y-1">
                  <h3 className="text-sm font-medium text-white">Multi-Image Single Item</h3>
                  <p className="text-xs text-elegant-400">
                    Upload multiple photos of the same item (different angles + receipt/invoice)
                  </p>
                </div>
                <button
                  onClick={() => setIsMultiImageMode(!isMultiImageMode)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-elegant-900 ${
                    isMultiImageMode ? 'bg-primary-500' : 'bg-elegant-600'
                  }`}
                  type="button"
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isMultiImageMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Comment Dialog */}
            {showCommentDialog && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-elegant-900 rounded-lg border border-elegant-700/50 w-full max-w-md">
                  <div className="flex items-center justify-between p-4 border-b border-elegant-700/50">
                    <h3 className="text-lg font-semibold text-white">Add Item Context</h3>
                    <button
                      onClick={() => setShowCommentDialog(false)}
                      className="text-elegant-400 hover:text-white transition-colors"
                      type="button"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="p-4 space-y-4">
                    <p className="text-sm text-elegant-400">
                      Help the AI identify unique items by providing additional context (e.g., &quot;numbered collectible&quot;, &quot;vintage 1960s&quot;, &quot;custom made&quot;).
                    </p>
                    
                    <textarea
                      value={userComment}
                      onChange={(e) => setUserComment(e.target.value)}
                      placeholder="Describe what makes this item unique or special..."
                      className="w-full h-24 px-3 py-2 bg-elegant-800 border border-elegant-700 rounded-lg text-white placeholder-elegant-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      maxLength={200}
                    />
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-elegant-500">
                        {userComment.length}/200 characters
                      </span>
                      
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => {
                            setUserComment('');
                            setShowCommentDialog(false);
                          }}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => setShowCommentDialog(false)}
                          size="sm"
                        >
                          Save
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedFiles.length > 0 && (
              <div className="space-y-4">
                <div className="text-center">
                  <p className="text-elegant-400 text-sm">
                    {selectedFiles.length} image{selectedFiles.length === 1 ? '' : 's'} selected
                  </p>
                </div>
                
                <Button
                  onClick={handleProcessImages}
                  disabled={selectedFiles.length === 0}
                  className="w-full"
                >
                  <>
                    {isMultiImageMode 
                      ? `Analyze as Single Item (${selectedFiles.length} images)` 
                      : 'Add to Processing Queue'
                    }
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { saveAsset, uploadAssetImage, updateAsset } from '@/lib/assets';
import { ArrowLeft, ArrowRight, Check, X, Edit2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface FileMetadata {
  name: string;
  size: number;
  type: string;
}

interface AnalysisResult {
  file: FileMetadata;
  analysis: any;
  error?: string;
}

interface ReviewItem extends AnalysisResult {
  approved: boolean;
  edited: boolean;
  editedData?: any;
}

export default function ReviewPage() {
  const [items, setItems] = useState<ReviewItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editedData, setEditedData] = useState<any>({});
  
  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    // Load analysis results
    const resultsData = sessionStorage.getItem('analysisResults');
    if (!resultsData) {
      router.push('/upload');
      return;
    }

    const results: AnalysisResult[] = JSON.parse(resultsData);
    const reviewItems: ReviewItem[] = results.map(result => ({
      ...result,
      approved: !result.error,
      edited: false
    }));
    
    setItems(reviewItems);
    if (reviewItems.length > 0) {
      setEditedData(reviewItems[0].analysis || {});
    }
  }, [user]);

  const currentItem = items[currentIndex];
  const currentData = editMode ? editedData : (currentItem?.editedData || currentItem?.analysis);

  const handleEdit = () => {
    setEditMode(true);
    setEditedData(currentItem?.editedData || currentItem?.analysis || {});
  };

  const handleSaveEdit = () => {
    setItems(prev => prev.map((item, idx) => 
      idx === currentIndex 
        ? { ...item, editedData, edited: true, approved: true }
        : item
    ));
    setEditMode(false);
  };

  const handleCancelEdit = () => {
    setEditMode(false);
    setEditedData(currentItem?.editedData || currentItem?.analysis || {});
  };

  const handleApprove = () => {
    setItems(prev => prev.map((item, idx) => 
      idx === currentIndex ? { ...item, approved: true } : item
    ));
  };

  const handleReject = () => {
    setItems(prev => prev.map((item, idx) => 
      idx === currentIndex ? { ...item, approved: false } : item
    ));
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setEditMode(false);
      const nextItem = items[currentIndex + 1];
      setEditedData(nextItem?.editedData || nextItem?.analysis || {});
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setEditMode(false);
      const prevItem = items[currentIndex - 1];
      setEditedData(prevItem?.editedData || prevItem?.analysis || {});
    }
  };

  const handleSaveAll = async () => {
    if (!user) return;
    
    setIsSaving(true);
    const approvedItems = items.filter(item => item.approved);
    
    try {
      for (const item of approvedItems) {
        const dataToSave = item.editedData || item.analysis;
        
        // Convert data URL back to File for upload
        const response = await fetch(item.file.dataUrl);
        const blob = await response.blob();
        const file = new File([blob], item.file.name, { type: item.file.type });
        
        // Save asset first to get ID
        const assetId = await saveAsset(user.uid, {
          name: dataToSave.name || 'Unknown Item',
          category: dataToSave.category || 'other',
          brand: dataToSave.brand,
          model: dataToSave.model,
          serial: dataToSave.serial,
          condition: dataToSave.condition || 'good',
          estimatedValue: dataToSave.estimatedValue || { amount: 0, currency: 'USD' },
          description: dataToSave.description || '',
          confidence: dataToSave.confidence || 0.5,
          room: dataToSave.room,
          imageUrl: '', // Will be updated after upload
        });
        
        // Upload image and update asset with image URL
        if (assetId) {
          const imageUrl = await uploadAssetImage(user.uid, assetId, file);
          
          // Update the asset with the image URL
          if (imageUrl) {
            await updateAsset(user.uid, assetId, { imageUrl });
          }
        }
      }
      
      // Clear session storage
      sessionStorage.removeItem('uploadedFiles');
      sessionStorage.removeItem('analysisResults');
      
      // Redirect to inventory or dashboard
      router.push('/inventory');
      
    } catch (error) {
      console.error('Save error:', error);
      alert('Failed to save assets. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const approvedCount = items.filter(item => item.approved).length;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="flex items-center space-x-2 text-gray-400 hover:text-white disabled:opacity-50"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <h1 className="text-lg font-semibold text-white">Review Items</h1>
              <p className="text-xs text-gray-400">
                {currentIndex + 1} of {items.length} • {approvedCount} approved
              </p>
            </div>
            <button 
              onClick={handleNext}
              disabled={currentIndex === items.length - 1}
              className="flex items-center space-x-2 text-gray-400 hover:text-white disabled:opacity-50"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Image */}
          <div className="aspect-square bg-gray-800 rounded-2xl overflow-hidden">
            <img
              src={currentItem?.file.dataUrl}
              alt="Asset preview"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Analysis Results */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Item Details</CardTitle>
              {!editMode && (
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            
            <CardContent className="space-y-4">
              {currentItem?.error ? (
                <div className="text-red-400 text-sm">
                  Analysis failed: {currentItem.error}
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-400">Name</label>
                    {editMode ? (
                      <Input
                        value={editedData.name || ''}
                        onChange={(e) => setEditedData((prev: any) => ({ ...prev, name: e.target.value }))}
                        placeholder="Item name"
                      />
                    ) : (
                      <p className="text-white">{currentData?.name || 'Unknown'}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm text-gray-400">Category</label>
                      {editMode ? (
                        <select
                          value={editedData.category || ''}
                          onChange={(e) => setEditedData((prev: any) => ({ ...prev, category: e.target.value }))}
                          className="w-full h-12 bg-gray-800 border border-gray-600 rounded-xl px-4 text-white"
                        >
                          <option value="electronics">Electronics</option>
                          <option value="jewelry">Jewelry</option>
                          <option value="furniture">Furniture</option>
                          <option value="appliances">Appliances</option>
                          <option value="clothing">Clothing</option>
                          <option value="art">Art</option>
                          <option value="books">Books</option>
                          <option value="tools">Tools</option>
                          <option value="sports">Sports</option>
                          <option value="other">Other</option>
                        </select>
                      ) : (
                        <p className="text-white capitalize">{currentData?.category || 'Other'}</p>
                      )}
                    </div>

                    <div>
                      <label className="text-sm text-gray-400">Condition</label>
                      {editMode ? (
                        <select
                          value={editedData.condition || ''}
                          onChange={(e) => setEditedData((prev: any) => ({ ...prev, condition: e.target.value }))}
                          className="w-full h-12 bg-gray-800 border border-gray-600 rounded-xl px-4 text-white"
                        >
                          <option value="excellent">Excellent</option>
                          <option value="good">Good</option>
                          <option value="fair">Fair</option>
                          <option value="poor">Poor</option>
                        </select>
                      ) : (
                        <p className="text-white capitalize">{currentData?.condition || 'Good'}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-gray-400">Estimated Value</label>
                    {editMode ? (
                      <Input
                        type="number"
                        value={editedData.estimatedValue?.amount || ''}
                        onChange={(e) => setEditedData((prev: any) => ({ 
                          ...prev, 
                          estimatedValue: { 
                            ...prev.estimatedValue, 
                            amount: parseInt(e.target.value) || 0 
                          }
                        }))}
                        placeholder="Replacement value"
                      />
                    ) : (
                      <p className="text-white">
                        {currentData?.estimatedValue ? 
                          formatCurrency(currentData.estimatedValue.amount) :
                          'Not estimated'
                        }
                      </p>
                    )}
                  </div>

                  {(currentData?.brand || editMode) && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm text-gray-400">Brand</label>
                        {editMode ? (
                          <Input
                            value={editedData.brand || ''}
                            onChange={(e) => setEditedData((prev: any) => ({ ...prev, brand: e.target.value }))}
                            placeholder="Brand"
                          />
                        ) : (
                          <p className="text-white">{currentData?.brand || 'Unknown'}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="text-sm text-gray-400">Model</label>
                        {editMode ? (
                          <Input
                            value={editedData.model || ''}
                            onChange={(e) => setEditedData((prev: any) => ({ ...prev, model: e.target.value }))}
                            placeholder="Model"
                          />
                        ) : (
                          <p className="text-white">{currentData?.model || 'Unknown'}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-4">
            {editMode ? (
              <div className="grid grid-cols-2 gap-3">
                <Button variant="secondary" onClick={handleCancelEdit}>
                  Cancel
                </Button>
                <Button onClick={handleSaveEdit}>
                  Save Changes
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <Button 
                  variant={currentItem?.approved ? "ghost" : "secondary"}
                  onClick={handleReject}
                  className={!currentItem?.approved ? "border-red-500 text-red-400 hover:bg-red-500/10" : ""}
                >
                  <X className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button 
                  variant={currentItem?.approved ? "primary" : "secondary"}
                  onClick={handleApprove}
                  className={currentItem?.approved ? "" : "border-green-500 text-green-400 hover:bg-green-500/10"}
                >
                  <Check className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </div>
            )}

            {/* Save All Button */}
            {currentIndex === items.length - 1 && approvedCount > 0 && (
              <Button 
                className="w-full" 
                onClick={handleSaveAll}
                disabled={isSaving}
              >
                {isSaving ? 'Saving Assets...' : `Save ${approvedCount} Assets to Inventory`}
              </Button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
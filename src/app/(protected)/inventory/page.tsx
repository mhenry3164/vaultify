'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AssetCard } from '@/components/inventory/AssetCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { getUserAssets, deleteAsset, updateAsset, uploadAssetImage } from '@/lib/assets';
import { Asset } from '@/types/asset';
import { ArrowLeft, Plus, Search, Filter, X, Save, Images, ChevronLeft, ChevronRight, Receipt, Upload, Camera } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { CATEGORY_OPTIONS } from '@/lib/categories';
import Link from 'next/link';
import { BackgroundProcessingIndicator } from '@/components/upload/BackgroundProcessingIndicator';

export default function InventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [priceJustification, setPriceJustification] = useState<string>('');
  const [showJustificationField, setShowJustificationField] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancementComment, setEnhancementComment] = useState('');
  const { user } = useAuth();

  const categories = [
    { value: 'all', label: 'All Categories' },
    ...CATEGORY_OPTIONS,
  ];

  useEffect(() => {
    if (user) {
      loadAssets();
    }
  }, [user]);

  useEffect(() => {
    filterAssets();
  }, [assets, searchTerm, selectedCategory]);

  const loadAssets = async () => {
    if (!user) return;
    
    try {
      const userAssets = await getUserAssets(user.uid);
      setAssets(userAssets);
    } catch (error) {
      console.error('Error loading assets:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === selectedCategory);
    }

    setFilteredAssets(filtered);
  };

  const handleEdit = (asset: Asset) => {
    console.log('Edit asset:', asset);
    setEditingAsset(asset);
    setOriginalPrice(asset.estimatedValue.amount);
    setPriceJustification('');
    setShowJustificationField(false);
    setCurrentImageIndex(0); // Reset to first image
    setEditForm({
      name: asset.name,
      category: asset.category,
      brand: asset.brand,
      model: asset.model,
      serial: asset.serial,
      condition: asset.condition,
      estimatedValue: asset.estimatedValue,
      description: asset.description,
      room: asset.room
    });
  };
  
  const handleSaveEdit = async () => {
    if (!user || !editingAsset) return;
    
    // Check if price has changed and justification is required
    const currentPrice = editForm.estimatedValue?.amount || 0;
    const priceChanged = Math.abs(currentPrice - originalPrice) > 0.01; // Account for floating point precision
    
    if (priceChanged && !priceJustification.trim()) {
      alert('Please provide a reason for the value change to help with documentation.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      // Prepare update data with justification if price changed
      const updateData = { ...editForm };
      if (priceChanged && priceJustification.trim()) {
        updateData.priceJustification = priceJustification.trim();
        updateData.priceChangeDate = new Date();
        updateData.originalPrice = originalPrice;
      }
      
      await updateAsset(user.uid, editingAsset.id, updateData);
      
      // Update local state
      setAssets(prev => prev.map(asset => 
        asset.id === editingAsset.id 
          ? { ...asset, ...updateData, updatedAt: new Date() }
          : asset
      ));
      
      // Close modal and reset state
      setEditingAsset(null);
      setEditForm({});
      setPriceJustification('');
      setShowJustificationField(false);
    } catch (error) {
      console.error('Error updating asset:', error);
      alert('Failed to update asset');
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingAsset(null);
    setEditForm({});
    setNewImages([]);
    setEnhancementComment('');
  };

  const handleDelete = async (assetId: string) => {
    if (!user) return;
    
    if (confirm('Are you sure you want to delete this asset?')) {
      try {
        await deleteAsset(user.uid, assetId);
        setAssets(prev => prev.filter(asset => asset.id !== assetId));
      } catch (error) {
        console.error('Error deleting asset:', error);
        alert('Failed to delete asset');
      }
    }
  };

  const handleNewImagesSelected = (files: File[]) => {
    setNewImages(files);
  };

  const removeNewImage = (index: number) => {
    const fileToRemove = newImages[index];
    // Clean up any preview URLs if we had them
    setNewImages(prev => prev.filter((_, i) => i !== index));
  };

  const createImagePreview = (file: File): string => {
    return URL.createObjectURL(file);
  };

  // Start enhancement processing in the background
  const startEnhancementProcessing = async (asset: Asset, images: File[], context: string) => {
    if (!user) throw new Error('User not authenticated');
    
    // Immediately notify the processing indicator
    if ((window as any).onGlobalProcessingUpdate) {
      (window as any).onGlobalProcessingUpdate(0, 1);
    }
    
    try {
      const formData = new FormData();
      formData.append('currentAsset', JSON.stringify(asset));
      
      images.forEach((file, index) => {
        formData.append(`newImage${index}`, file);
      });
      
      if (context.trim()) {
        formData.append('context', context.trim());
      }
      
      const response = await fetch('/api/enhance-asset', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Enhancement failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      // Update the asset in Firestore
      await updateAsset(user.uid, asset.id, {
        ...result.enhancedAsset,
        lastEnhanced: new Date().toISOString(),
        enhancementSummary: result.enhancementSummary
      });
      
      // Notify completion
      if ((window as any).onGlobalProcessingUpdate) {
        (window as any).onGlobalProcessingUpdate(1, 1);
      }
      
      // Refresh assets after a short delay to ensure UI updates
      setTimeout(() => {
        loadAssets();
      }, 1000);
      
      return [{
        success: true,
        assetId: asset.id,
        enhancementSummary: result.enhancementSummary
      }];
      
    } catch (error) {
      console.error('Enhancement error:', error);
      throw error;
    }
  };

  const handleEnhanceAsset = async () => {
    if (!user || !editingAsset || newImages.length === 0) return;
    
    try {
      // Start background processing immediately
      const processingPromise = startEnhancementProcessing(editingAsset, newImages, enhancementComment);
      
      // Store the processing promise globally so notification system can monitor it
      (window as any).currentProcessing = processingPromise;
      
      // Close modal immediately and clear state
      setEditingAsset(null);
      setNewImages([]);
      setEnhancementComment('');
      setIsEnhancing(false);
      
      // The BackgroundProcessingIndicator will show progress and completion
      
    } catch (error) {
      console.error('Failed to start enhancement processing:', error);
      // Error handling will be done by the background processing system
    }
  };

  const totalValue = filteredAssets.reduce((sum, asset) => {
    return sum + asset.estimatedValue.amount;
  }, 0);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
        <p className="text-white">Please log in to view your inventory.</p>
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
              <h1 className="text-lg font-semibold text-white">Inventory</h1>
              <p className="text-xs text-elegant-400">{assets.length} items</p>
            </div>
            <Link href="/upload">
              <Button variant="ghost" size="sm">
                <Plus className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-md mx-auto px-6 py-8">
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gold-400">
                {formatCurrency(totalValue)}
              </div>
              <div className="text-sm text-elegant-400">Total Estimated Value</div>
            </CardContent>
          </Card>

          {/* Search and Filter */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-elegant-400 w-4 h-4" />
              <Input
                placeholder="Search items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-12 bg-elegant-800/50 backdrop-blur-sm border border-elegant-600 rounded-xl px-4 text-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 transition-all duration-200 font-medium tracking-wide shadow-elegant"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          {/* Assets Grid */}
          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-400">Loading your inventory...</p>
            </div>
          ) : filteredAssets.length === 0 ? (
            <div className="text-center py-8">
              {assets.length === 0 ? (
                <div className="space-y-4">
                  <p className="text-gray-400">Your inventory is empty</p>
                  <Link href="/upload">
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Your First Asset
                    </Button>
                  </Link>
                </div>
              ) : (
                <p className="text-gray-400">No items match your search</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredAssets.map(asset => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Floating Add Button */}
      {assets.length > 0 && (
        <Link href="/upload" className="fixed bottom-6 right-6">
          <Button className="w-14 h-14 rounded-full shadow-lg">
            <Plus className="w-6 h-6" />
          </Button>
        </Link>
      )}
      
      {/* Edit Modal */}
      {editingAsset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-elegant-900 rounded-lg border border-elegant-700/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-elegant-700/50">
              <h2 className="text-xl font-semibold text-white">Edit Asset</h2>
              <button
                onClick={handleCancelEdit}
                className="text-elegant-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6">
              {/* Image Gallery Section */}
              {(() => {
                const allImages = [
                  ...(editingAsset.imageUrl ? [editingAsset.imageUrl] : []),
                  ...(editingAsset.additionalImages || [])
                ];
                const hasMultipleImages = allImages.length > 1;
                const hasPurchaseInfo = editingAsset.purchaseInfo && (editingAsset.purchaseInfo.retailer || editingAsset.purchaseInfo.purchaseDate || editingAsset.purchaseInfo.originalPrice);
                
                return allImages.length > 0 ? (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                      <Images className="w-5 h-5" />
                      Images {hasMultipleImages && `(${allImages.length})`}
                    </h3>
                    
                    <div className="relative">
                      {/* Main image display */}
                      <div className="relative aspect-video bg-elegant-800 rounded-lg overflow-hidden">
                        <img
                          src={allImages[currentImageIndex]}
                          alt={`${editingAsset.name} - Image ${currentImageIndex + 1}`}
                          className="w-full h-full object-contain"
                        />
                        
                        {/* Navigation for multiple images */}
                        {hasMultipleImages && (
                          <>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length)}
                              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
                            >
                              <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => setCurrentImageIndex((prev) => (prev + 1) % allImages.length)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white rounded-full p-2 transition-colors"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                            
                            {/* Image counter */}
                            <div className="absolute top-4 right-4 bg-black/70 text-white text-sm px-3 py-1 rounded-full">
                              {currentImageIndex + 1} / {allImages.length}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {/* Thumbnail strip for multiple images */}
                      {hasMultipleImages && (
                        <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
                          {allImages.map((imageUrl, index) => (
                            <button
                              key={index}
                              onClick={() => setCurrentImageIndex(index)}
                              className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                                index === currentImageIndex 
                                  ? 'border-primary-500' 
                                  : 'border-elegant-600 hover:border-elegant-500'
                              }`}
                            >
                              <img
                                src={imageUrl}
                                alt={`Thumbnail ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Purchase Info Display */}
                    {hasPurchaseInfo && (
                      <div className="mt-4 p-4 bg-elegant-800/30 rounded-lg border border-elegant-700/50">
                        <h4 className="text-sm font-medium text-green-400 mb-3 flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          Purchase Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          {editingAsset.purchaseInfo?.retailer && (
                            <div>
                              <span className="text-elegant-400">Store:</span>
                              <div className="text-white font-medium">{editingAsset.purchaseInfo.retailer}</div>
                            </div>
                          )}
                          {editingAsset.purchaseInfo?.purchaseDate && (
                            <div>
                              <span className="text-elegant-400">Purchase Date:</span>
                              <div className="text-white font-medium">{editingAsset.purchaseInfo.purchaseDate}</div>
                            </div>
                          )}
                          {editingAsset.purchaseInfo?.originalPrice && (
                            <div>
                              <span className="text-elegant-400">Original Price:</span>
                              <div className="text-white font-medium">${editingAsset.purchaseInfo.originalPrice}</div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Add New Images Section */}
                    <div className="mt-6 p-4 bg-elegant-800/20 rounded-lg border border-elegant-700/30">
                      <h4 className="text-sm font-medium text-primary-400 mb-3 flex items-center gap-2">
                        <Upload className="w-4 h-4" />
                        Add & Analyze New Images
                      </h4>
                      <p className="text-xs text-elegant-400 mb-4">
                        Upload additional images (ID cards, receipts, better angles) to enhance this asset's information.
                      </p>
                      
                      {/* Image Upload Area */}
                      <div className="space-y-4">
                        <input
                          type="file"
                          id="enhance-file-input"
                          multiple
                          accept="image/*,.heic,.heif"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              handleNewImagesSelected([...newImages, ...files]);
                            }
                            e.target.value = ''; // Reset input
                          }}
                          className="hidden"
                        />
                        <input
                          type="file"
                          id="enhance-camera-input"
                          multiple
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => {
                            const files = Array.from(e.target.files || []);
                            if (files.length > 0) {
                              handleNewImagesSelected([...newImages, ...files]);
                            }
                            e.target.value = ''; // Reset input
                          }}
                          className="hidden"
                        />
                        
                        {newImages.length === 0 ? (
                          <div className="border-2 border-dashed border-elegant-600 rounded-xl p-8 text-center hover:border-gold-400/50 transition-colors">
                            <div className="space-y-4">
                              <div className="w-16 h-16 mx-auto bg-gradient-gold rounded-full flex items-center justify-center shadow-gold-glow/30">
                                <Camera className="w-8 h-8 text-black" />
                              </div>
                              
                              <div>
                                <h4 className="text-lg font-semibold text-white mb-2">Add new images</h4>
                                <p className="text-elegant-400 text-sm">
                                  Upload ID cards, receipts, or better angles<br />
                                  <span className="text-elegant-500 text-xs">JPG, PNG, WEBP, HEIC up to 10MB each</span>
                                </p>
                              </div>
                              
                              <div className="flex gap-3 justify-center">
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => document.getElementById('enhance-camera-input')?.click()}
                                  type="button"
                                >
                                  <Camera className="w-4 h-4 mr-2" />
                                  Take Photo
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => document.getElementById('enhance-file-input')?.click()}
                                  type="button"
                                >
                                  <Upload className="w-4 h-4 mr-2" />
                                  Browse Files
                                </Button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-elegant-300">
                                {newImages.length} new image{newImages.length === 1 ? '' : 's'} selected
                              </span>
                              <button
                                onClick={() => setNewImages([])}
                                className="text-xs text-elegant-400 hover:text-white underline"
                                type="button"
                              >
                                Clear all
                              </button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3">
                              {newImages.map((file, index) => (
                                <div key={index} className="relative group">
                                  <div className="aspect-square bg-elegant-800 rounded-xl overflow-hidden border border-elegant-700 hover:border-gold-400/50 transition-all duration-200 shadow-elegant">
                                    <img
                                      src={createImagePreview(file)}
                                      alt={`New image ${index + 1}`}
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                                      }}
                                    />
                                  </div>
                                  <button
                                    onClick={() => removeNewImage(index)}
                                    className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 shadow-elegant transition-all duration-200 hover:scale-110"
                                    type="button"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                  {/* Show HEIC indicator for HEIC files */}
                                  {(file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) && (
                                    <div className="absolute top-2 left-2 bg-blue-600/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                      </svg>
                                      HEIC
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                            
                            <div className="flex gap-2 justify-center">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => document.getElementById('enhance-camera-input')?.click()}
                                type="button"
                              >
                                <Camera className="w-4 h-4 mr-2" />
                                Add More
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => document.getElementById('enhance-file-input')?.click()}
                                type="button"
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Browse More
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        {/* Enhancement Comment */}
                        <div>
                          <label className="block text-xs font-medium text-elegant-300 mb-2">
                            Context for new images (optional)
                          </label>
                          <textarea
                            value={enhancementComment}
                            onChange={(e) => setEnhancementComment(e.target.value)}
                            placeholder="e.g., 'Added serial number photo' or 'Found original receipt'"
                            rows={2}
                            maxLength={150}
                            className="w-full bg-elegant-800/50 border border-elegant-600 rounded-lg px-3 py-2 text-white placeholder-elegant-500 focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400/20 resize-none text-sm"
                          />
                          <div className="text-xs text-elegant-500 mt-1">
                            {enhancementComment.length}/150 characters
                          </div>
                        </div>
                        
                        {/* Enhance Button */}
                        {newImages.length > 0 && (
                          <Button
                            onClick={handleEnhanceAsset}
                            disabled={isEnhancing}
                            className="w-full"
                            type="button"
                          >
                            {isEnhancing ? (
                              <>
                                <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin mr-2" />
                                Analyzing & Enhancing...
                              </>
                            ) : (
                              <>
                                <Images className="w-4 h-4 mr-2" />
                                Analyze & Enhance Asset
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
              
              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-elegant-300 mb-2">Name</label>
                  <Input
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Asset name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-300 mb-2">Category</label>
                  <select
                    value={editForm.category || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value as Asset['category'] }))}
                    className="w-full h-12 bg-elegant-800/50 border border-elegant-600 rounded-xl px-4 text-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                  >
                    {categories.filter(cat => cat.value !== 'all').map(category => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-elegant-300 mb-2">Brand</label>
                    <Input
                      value={editForm.brand || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, brand: e.target.value }))}
                      placeholder="Brand"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-elegant-300 mb-2">Model</label>
                    <Input
                      value={editForm.model || ''}
                      onChange={(e) => setEditForm(prev => ({ ...prev, model: e.target.value }))}
                      placeholder="Model"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-300 mb-2">Serial Number</label>
                  <Input
                    value={editForm.serial || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, serial: e.target.value }))}
                    placeholder="Serial number"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-300 mb-2">Condition</label>
                  <select
                    value={editForm.condition || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, condition: e.target.value as 'excellent' | 'good' | 'fair' | 'poor' }))}
                    className="w-full h-12 bg-elegant-800/50 border border-elegant-600 rounded-xl px-4 text-white focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20"
                  >
                    <option value="excellent">Excellent</option>
                    <option value="good">Good</option>
                    <option value="fair">Fair</option>
                    <option value="poor">Poor</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-300 mb-2">Estimated Value ($)</label>
                  <Input
                    type="number"
                    value={editForm.estimatedValue?.amount || ''}
                    onChange={(e) => {
                      const newAmount = parseFloat(e.target.value) || 0;
                      const priceChanged = Math.abs(newAmount - originalPrice) > 0.01;
                      
                      setEditForm(prev => ({ 
                        ...prev, 
                        estimatedValue: { 
                          amount: newAmount, 
                          currency: 'USD' 
                        }
                      }));
                      
                      setShowJustificationField(priceChanged);
                      if (!priceChanged) {
                        setPriceJustification('');
                      }
                    }}
                    placeholder="0.00"
                  />
                  
                  {/* Price Justification Field */}
                  {showJustificationField && (
                    <div className="mt-3 p-3 bg-elegant-800/30 rounded-lg border border-elegant-700/50">
                      <label className="block text-sm font-medium text-elegant-300 mb-2">
                        📝 Help us understand the value change
                      </label>
                      <p className="text-xs text-elegant-400 mb-2">
                        A brief note helps with accurate documentation (e.g., "found receipt showing higher value", "condition improved after cleaning", "market research showed different pricing").
                      </p>
                      <textarea
                        value={priceJustification}
                        onChange={(e) => setPriceJustification(e.target.value)}
                        placeholder="Why is this value different from the original estimate?"
                        rows={2}
                        maxLength={150}
                        className="w-full bg-elegant-800/50 border border-elegant-600 rounded-lg px-3 py-2 text-white placeholder-elegant-500 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 resize-none text-sm"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-elegant-500">
                          {priceJustification.length}/150 characters
                        </span>
                        <span className="text-xs text-elegant-400">
                          Original: ${originalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-300 mb-2">Room/Location</label>
                  <Input
                    value={editForm.room || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, room: e.target.value }))}
                    placeholder="Living room, bedroom, etc."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-elegant-300 mb-2">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Additional details..."
                    rows={3}
                    className="w-full bg-elegant-800/50 border border-elegant-600 rounded-xl px-4 py-3 text-white placeholder-elegant-500 focus:border-gold-400 focus:outline-none focus:ring-2 focus:ring-gold-400/20 resize-none"
                  />
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={handleCancelEdit}
                  className="flex-1"
                  disabled={isSaving}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveEdit}
                  className="flex-1 flex items-center justify-center gap-2"
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Background Processing Indicator */}
      <BackgroundProcessingIndicator />
    </div>
  );
}
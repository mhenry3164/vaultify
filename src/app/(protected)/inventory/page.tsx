'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AssetCard } from '@/components/inventory/AssetCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent } from '@/components/ui/Card';
import { getUserAssets, deleteAsset, updateAsset } from '@/lib/assets';
import { Asset } from '@/types/asset';
import { ArrowLeft, Plus, Search, Filter, X, Save } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

export default function InventoryPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editForm, setEditForm] = useState<Partial<Asset>>({});
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'electronics', label: 'Electronics' },
    { value: 'jewelry', label: 'Jewelry' },
    { value: 'furniture', label: 'Furniture' },
    { value: 'appliances', label: 'Appliances' },
    { value: 'clothing', label: 'Clothing' },
    { value: 'art', label: 'Art' },
    { value: 'books', label: 'Books' },
    { value: 'tools', label: 'Tools' },
    { value: 'sports', label: 'Sports' },
    { value: 'other', label: 'Other' },
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
    
    setIsSaving(true);
    
    try {
      await updateAsset(user.uid, editingAsset.id, editForm);
      
      // Update local state
      setAssets(prev => prev.map(asset => 
        asset.id === editingAsset.id 
          ? { ...asset, ...editForm, updatedAt: new Date() }
          : asset
      ));
      
      // Close modal
      setEditingAsset(null);
      setEditForm({});
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

  const totalValue = assets.reduce((sum, asset) => {
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-elegant-900 border border-elegant-700 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Edit Asset</h2>
                <button
                  onClick={handleCancelEdit}
                  className="p-2 text-elegant-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Form */}
              <div className="space-y-4">
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
                    onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
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
                    onChange={(e) => setEditForm(prev => ({ 
                      ...prev, 
                      estimatedValue: { 
                        amount: parseFloat(e.target.value) || 0, 
                        currency: 'USD' 
                      }
                    }))}
                    placeholder="0.00"
                  />
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
    </div>
  );
}
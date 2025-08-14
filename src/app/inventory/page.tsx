'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { AssetCard } from '@/components/inventory/AssetCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ArrowLeft, Plus, Search, Filter } from 'lucide-react';
import { Asset } from '@/types/asset';
import { getUserAssets, deleteAsset } from '@/lib/assets';
import { formatCurrency } from '@/lib/utils';

export default function InventoryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    'all',
    'electronics',
    'jewelry',
    'furniture',
    'appliances',
    'clothing',
    'art',
    'books',
    'tools',
    'sports',
    'other'
  ];

  useEffect(() => {
    if (user) {
      loadAssets();
    }
  }, [user]);

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

  const handleDeleteAsset = async (assetId: string) => {
    if (!user) return;
    
    try {
      await deleteAsset(user.uid, assetId);
      setAssets(prev => prev.filter(asset => asset.id !== assetId));
    } catch (error) {
      console.error('Error deleting asset:', error);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    // For now, just log - could implement edit modal later
    console.log('Edit asset:', asset);
  };

  const filteredAssets = assets.filter(asset => {
    const matchesSearch = asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.brand?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const totalValue = assets.reduce((sum, asset) => {
    return sum + ((asset.estimatedValue.low + asset.estimatedValue.high) / 2);
  }, 0);

  if (!user) {
    return <div>Please log in to view your inventory.</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-dark-950 to-dark-900">
      {/* Header */}
      <header className="bg-dark-900 border-b border-gray-800">
        <div className="max-w-md mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.back()}
                className="p-2"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-xl font-bold text-white">My Inventory</h1>
            </div>
            <Button
              size="sm"
              onClick={() => router.push('/upload')}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-md mx-auto px-6 py-8">
        {/* Summary Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">Portfolio Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Total Items</p>
                <p className="text-2xl font-bold text-white">{assets.length}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Estimated Value</p>
                <p className="text-2xl font-bold text-primary-400">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filter */}
        <div className="space-y-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search assets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex space-x-2 overflow-x-auto pb-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? 'bg-primary-400 text-black'
                    : 'bg-dark-800 text-gray-300 hover:bg-dark-700'
                }`}
              >
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Assets Grid */}
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary-400 border-t-transparent rounded-full"></div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-dark-700 rounded-full flex items-center justify-center">
                <Plus className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {assets.length === 0 ? 'No assets yet' : 'No matching assets'}
              </h3>
              <p className="text-gray-400 mb-4">
                {assets.length === 0 
                  ? 'Start building your inventory by uploading photos of your items'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
              {assets.length === 0 && (
                <Button onClick={() => router.push('/upload')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Your First Asset
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAssets.map(asset => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onEdit={handleEditAsset}
                onDelete={handleDeleteAsset}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

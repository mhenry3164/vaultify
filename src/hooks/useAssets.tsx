'use client';

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { getUserAssets } from '@/lib/assets';
import { Asset } from '@/types/asset';

export function useAssets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const loadAssets = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      setError(null);
      const userAssets = await getUserAssets(user.uid);
      setAssets(userAssets);
    } catch (err) {
      console.error('Error loading assets:', err);
      setError('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const refreshAssets = () => {
    loadAssets();
  };

  const removeAsset = (assetId: string) => {
    setAssets(prev => prev.filter(asset => asset.id !== assetId));
  };

  const addAsset = (asset: Asset) => {
    setAssets(prev => [asset, ...prev]);
  };

  const updateAsset = (updatedAsset: Asset) => {
    setAssets(prev => prev.map(asset => 
      asset.id === updatedAsset.id ? updatedAsset : asset
    ));
  };

  const getTotalValue = () => {
    return assets.reduce((sum, asset) => {
      return sum + asset.estimatedValue.amount;
    }, 0);
  };

  const getAssetsByCategory = () => {
    return assets.reduce((acc, asset) => {
      if (!acc[asset.category]) {
        acc[asset.category] = [];
      }
      acc[asset.category].push(asset);
      return acc;
    }, {} as Record<string, Asset[]>);
  };

  useEffect(() => {
    loadAssets();
  }, [user]);

  return {
    assets,
    loading,
    error,
    refreshAssets,
    removeAsset,
    addAsset,
    updateAsset,
    getTotalValue,
    getAssetsByCategory,
  };
}
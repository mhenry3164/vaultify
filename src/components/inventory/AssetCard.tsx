import { Asset } from '@/types/asset';
import { Card, CardContent } from '@/components/ui/Card';
import { Edit2, Trash2, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useLazyImage } from '@/hooks/useLazyImage';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}

function LazyImage({ src, alt, className }: { src: string; alt: string; className: string }) {
  const { containerRef, imageSrc, isLoaded, isError, handleLoad, handleError } = useLazyImage({ src });

  return (
    <div ref={containerRef} className={`${className} relative`}>
      {/* Base background */}
      <div className="w-full h-full bg-gray-800" />
      
      {/* Actual image */}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={handleLoad}
          onError={handleError}
          style={{ display: isError ? 'none' : 'block' }}
        />
      )}
      
      {/* Loading/Error overlay */}
      {(!imageSrc || !isLoaded || isError) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <div className="flex flex-col items-center gap-2 text-gray-500">
            {!imageSrc ? (
              // Initial placeholder
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs">Loading...</span>
              </>
            ) : isError ? (
              // Error state
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs">Failed to load</span>
              </>
            ) : (
              // Loading spinner
              <>
                <div className="w-6 h-6 border-2 border-gray-600 border-t-gold-400 rounded-full animate-spin" />
                <span className="text-xs">Loading...</span>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  const formatValue = (value: { amount: number; currency: string }) => {
    return formatCurrency(value.amount);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {asset.imageUrl && (
          <LazyImage
            src={asset.imageUrl}
            alt={asset.name}
            className="aspect-square bg-gray-700"
          />
        )}
        
        <div className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{asset.name}</h3>
            {asset.brand && (
              <p className="text-sm text-gray-400">{asset.brand} {asset.model}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-gold-400">
                {formatValue(asset.estimatedValue)}
              </p>
              <p className="text-xs text-elegant-400 capitalize">
                {asset.condition} condition
              </p>
            </div>
            
            <div className="flex space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(asset)}
                className="p-2"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(asset.id)}
                className="p-2 text-red-400 hover:text-red-300"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-elegant-400">
            <span className="capitalize">{asset.category}</span>
            {asset.room && <span>{asset.room}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
import { Asset } from '@/types/asset';
import { Card, CardContent } from '@/components/ui/Card';
import { Edit2, Trash2, ImageIcon, ChevronLeft, ChevronRight, Images, Receipt } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { useLazyImage } from '@/hooks/useLazyImage';
import { useState } from 'react';

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const formatValue = (value: { amount: number; currency: string }) => {
    return formatCurrency(value.amount);
  };

  // Get all images (primary + additional)
  const allImages = [
    ...(asset.imageUrl ? [asset.imageUrl] : []),
    ...(asset.additionalImages || [])
  ];
  
  const hasMultipleImages = allImages.length > 1;
  const hasPurchaseInfo = asset.purchaseInfo && (asset.purchaseInfo.retailer || asset.purchaseInfo.purchaseDate || asset.purchaseInfo.originalPrice);

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {allImages.length > 0 && (
          <div className="relative aspect-square bg-gray-700">
            <LazyImage
              src={allImages[currentImageIndex]}
              alt={`${asset.name} - Image ${currentImageIndex + 1}`}
              className="aspect-square bg-gray-700"
            />
            
            {/* Multi-image controls */}
            {hasMultipleImages && (
              <>
                {/* Navigation buttons */}
                <button
                  onClick={prevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                
                {/* Image counter */}
                <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                  <Images className="w-3 h-3" />
                  {currentImageIndex + 1}/{allImages.length}
                </div>
                
                {/* Dot indicators */}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {allImages.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentImageIndex(index)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
            
            {/* Purchase info indicator */}
            {hasPurchaseInfo && (
              <div className="absolute top-2 left-2 bg-green-600/80 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                <Receipt className="w-3 h-3" />
                Receipt
              </div>
            )}
          </div>
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

          {/* Purchase info display */}
          {hasPurchaseInfo && (
            <div className="text-xs text-elegant-400 bg-elegant-800/30 rounded-lg p-2 space-y-1">
              <div className="flex items-center gap-1 text-green-400 font-medium">
                <Receipt className="w-3 h-3" />
                Purchase Info
              </div>
              {asset.purchaseInfo?.retailer && (
                <div>Store: {asset.purchaseInfo.retailer}</div>
              )}
              {asset.purchaseInfo?.purchaseDate && (
                <div>Date: {asset.purchaseInfo.purchaseDate}</div>
              )}
              {asset.purchaseInfo?.originalPrice && (
                <div>Paid: ${asset.purchaseInfo.originalPrice}</div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-elegant-400">
            <span className="capitalize">{asset.category}</span>
            <div className="flex items-center gap-2">
              {hasMultipleImages && (
                <span className="flex items-center gap-1 text-primary-400">
                  <Images className="w-3 h-3" />
                  {allImages.length}
                </span>
              )}
              {asset.room && <span>{asset.room}</span>}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
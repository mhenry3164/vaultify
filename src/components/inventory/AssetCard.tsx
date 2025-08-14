import { Asset } from '@/types/asset';
import { Card, CardContent } from '@/components/ui/Card';
import { Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatValueRange, getCategoryIcon } from '@/lib/utils';

interface AssetCardProps {
  asset: Asset;
  onEdit: (asset: Asset) => void;
  onDelete: (assetId: string) => void;
}

export function AssetCard({ asset, onEdit, onDelete }: AssetCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        {asset.imageUrl && (
          <div className="aspect-square bg-dark-700">
            <img
              src={asset.imageUrl}
              alt={asset.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4 space-y-3">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-lg">{getCategoryIcon(asset.category)}</span>
              <h3 className="text-lg font-semibold text-white">{asset.name}</h3>
            </div>
            {asset.brand && (
              <p className="text-sm text-gray-400">{asset.brand} {asset.model}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-lg font-bold text-primary-400">
                {formatValueRange(asset.estimatedValue)}
              </p>
              <p className="text-xs text-gray-400 capitalize">
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

          <div className="flex items-center justify-between text-xs text-gray-400">
            <span className="capitalize">{asset.category}</span>
            {asset.room && <span>{asset.room}</span>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
// Note: HEIC files are processed server-side, no client conversion needed

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

interface ProcessedFile {
  file: File;
  previewUrl: string;
}

export function ImageUpload({ 
  onImagesSelected, 
  maxFiles = 5, 
  className 
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<ProcessedFile[]>([]);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URLs on unmount to prevent memory leaks  
  useEffect(() => {
    return () => {
      selectedFiles.forEach(fileItem => {
        // Only revoke blob URLs, not canvas data URLs (which start with 'data:')
        if (fileItem.previewUrl.startsWith('blob:')) {
          URL.revokeObjectURL(fileItem.previewUrl);
        }
      });
    };
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const processedFiles = acceptedFiles.map((file) => {
      // Check if it's a HEIC file (check both MIME type and file extension)
      const isHEIC = file.type === 'image/heic' || file.type === 'image/heif' || 
                    file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif');
      
      let previewUrl: string;
      
      if (isHEIC) {
        // For HEIC files, create a custom preview placeholder
        // The actual file will be processed server-side
        previewUrl = createHEICPlaceholder(file.name);
        console.log('HEIC file detected, will be processed server-side:', file.name);
      } else {
        // For standard image files, create normal preview
        previewUrl = URL.createObjectURL(file);
      }
      
      return { file, previewUrl };
    });
    
    const newFiles = [...selectedFiles, ...processedFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles.map(item => item.file));
  }, [selectedFiles, maxFiles, onImagesSelected]);

  // Helper function to create a placeholder preview for HEIC files
  const createHEICPlaceholder = (fileName: string): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 300;
    canvas.height = 300;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create gradient background
      const gradient = ctx.createLinearGradient(0, 0, 300, 300);
      gradient.addColorStop(0, '#374151');
      gradient.addColorStop(1, '#1f2937');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 300, 300);
      
      // Draw camera icon-like shape
      ctx.fillStyle = '#6b7280';
      ctx.fillRect(100, 120, 100, 60);
      ctx.beginPath();
      ctx.arc(150, 150, 25, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw HEIC text
      ctx.fillStyle = '#f9fafb';
      ctx.font = 'bold 24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('HEIC', 150, 220);
      
      ctx.fillStyle = '#d1d5db';
      ctx.font = '16px sans-serif';
      ctx.fillText('Processing on server', 150, 245);
      
      // Draw file name (truncated)
      ctx.font = '14px monospace';
      const truncatedName = fileName.length > 25 ? fileName.substring(0, 22) + '...' : fileName;
      ctx.fillText(truncatedName, 150, 270);
    }
    
    return canvas.toDataURL('image/png');
  };

  // Handle camera input change
  const handleCameraChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onDrop(files);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  // Handle file input change
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onDrop(files);
    }
    // Reset input so same file can be selected again
    event.target.value = '';
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.heic', '.heif']
    },
    maxFiles: maxFiles - selectedFiles.length,
    maxSize: 10 * 1024 * 1024, // 10MB,
    noClick: true, // Disable click on dropzone to use our custom buttons
  });

  const removeFile = (index: number) => {
    const fileToRemove = selectedFiles[index];
    // Clean up the preview URL to prevent memory leaks (only if it's a blob URL, not canvas data URL)
    if (fileToRemove.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.previewUrl);
    }
    
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles.map(item => item.file));
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed border-elegant-600 rounded-2xl p-8 text-center transition-all duration-300 hover:border-gold-400/50 hover:bg-gold-400/5 hover:shadow-gold-glow/20',
          isDragActive && 'border-gold-400 bg-gold-400/10 shadow-gold-glow/30'
        )}
      >
        <input {...getInputProps()} />
        
        {/* Hidden camera input for mobile camera access */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple={maxFiles > 1}
          onChange={handleCameraChange}
          className="hidden"
        />
        
        {/* Hidden file input for file browsing */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.heic,.heif"
          multiple={maxFiles > 1}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className="w-20 h-20 mx-auto bg-gradient-gold rounded-full flex items-center justify-center shadow-gold-glow/50 animate-pulse">
            <Camera className="w-10 h-10 text-black" />
          </div>
          
          <div>
            <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">
              {isDragActive ? 'Drop images here' : 'Upload asset photos'}
            </h3>
            <p className="text-elegant-400 leading-relaxed">
              Drag & drop images or click to browse<br />
              <span className="text-elegant-500 text-sm">JPG, PNG, WEBP, HEIC up to 10MB each</span>
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                cameraInputRef.current?.click();
              }}
              disabled={selectedFiles.length >= maxFiles}
            >
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <Button 
              size="sm" 
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              disabled={selectedFiles.length >= maxFiles}
            >
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {selectedFiles.map((fileItem, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-elegant-800 rounded-xl overflow-hidden border border-elegant-700 hover:border-gold-400/50 transition-all duration-200 shadow-elegant">
                <img
                  src={fileItem.previewUrl}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  onError={(e) => {
                    // If image fails to load, show a placeholder
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjMzc0MTUxIi8+Cjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9InNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Q0EzQUYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                  }}
                />
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600 shadow-elegant transition-all duration-200 hover:scale-110"
              >
                <X className="w-3 h-3" />
              </button>
              {/* Show HEIC indicator for HEIC files */}
              {(fileItem.file.name.toLowerCase().endsWith('.heic') || fileItem.file.name.toLowerCase().endsWith('.heif')) && (
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
      )}
    </div>
  );
}
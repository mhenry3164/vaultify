'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
  className?: string;
}

export function ImageUpload({ 
  onImagesSelected, 
  maxFiles = 5, 
  className 
}: ImageUploadProps) {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...selectedFiles, ...acceptedFiles].slice(0, maxFiles);
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles);
  }, [selectedFiles, maxFiles, onImagesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: maxFiles - selectedFiles.length,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onImagesSelected(newFiles);
  };

  return (
    <div className={cn('space-y-4', className)}>
      <div
        {...getRootProps()}
        className={cn(
          'border-2 border-dashed border-gray-600 rounded-2xl p-8 text-center cursor-pointer transition-all hover:border-primary-400 hover:bg-dark-800/50',
          isDragActive && 'border-primary-400 bg-primary-400/10'
        )}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto bg-gradient-to-r from-primary-400 to-primary-300 rounded-full flex items-center justify-center">
            <Camera className="w-8 h-8 text-black" />
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {isDragActive ? 'Drop images here' : 'Upload asset photos'}
            </h3>
            <p className="text-gray-400">
              Drag & drop images or click to browse<br />
              JPG, PNG, WEBP up to 10MB each
            </p>
          </div>
          
          <div className="flex gap-3 justify-center">
            <Button size="sm" variant="secondary">
              <Camera className="w-4 h-4 mr-2" />
              Take Photo
            </Button>
            <Button size="sm" variant="secondary">
              <Upload className="w-4 h-4 mr-2" />
              Browse Files
            </Button>
          </div>
        </div>
      </div>

      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative">
              <div className="aspect-square bg-dark-800 rounded-xl overflow-hidden">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Upload ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                onClick={() => removeFile(index)}
                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs hover:bg-red-600"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

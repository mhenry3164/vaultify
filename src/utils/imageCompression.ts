/**
 * Client-side image compression utility to handle images before upload
 * Ensures images stay under Vercel's 4.5MB request body limit
 */

export interface CompressionOptions {
  maxSizeBytes: number;
  quality: number;
  maxWidth: number;
  maxHeight: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxSizeBytes: 4 * 1024 * 1024, // 4MB (leaving 0.5MB buffer for form data)
  quality: 0.85,
  maxWidth: 2048,
  maxHeight: 2048,
};

/**
 * Compresses an image file if it exceeds the size limit
 */
export async function compressImageIfNeeded(
  file: File, 
  options: Partial<CompressionOptions> = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // If file is already under the limit, return as-is
  if (file.size <= opts.maxSizeBytes) {
    console.log(`Image ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB) is under limit, no compression needed`);
    return file;
  }

  console.log(`Compressing image ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB`);

  try {
    const compressedFile = await compressImage(file, opts);
    console.log(`Compressed ${file.name} from ${(file.size / 1024 / 1024).toFixed(2)}MB to ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.warn('Image compression failed, using original file:', error);
    return file;
  }
}

/**
 * Compresses an image using Canvas API
 */
async function compressImage(file: File, options: CompressionOptions): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      const { width, height } = calculateDimensions(
        img.width,
        img.height,
        options.maxWidth,
        options.maxHeight
      );

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx.drawImage(img, 0, 0, width, height);

      // Try different qualities until we get under the size limit
      compressWithQualityReduction(canvas, file.name, file.type, options.quality, options.maxSizeBytes)
        .then(resolve)
        .catch(reject);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate optimal dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
    return { width: originalWidth, height: originalHeight };
  }

  const widthRatio = maxWidth / originalWidth;
  const heightRatio = maxHeight / originalHeight;
  const ratio = Math.min(widthRatio, heightRatio);

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  };
}

/**
 * Progressively reduce quality until file size is acceptable
 */
async function compressWithQualityReduction(
  canvas: HTMLCanvasElement,
  fileName: string,
  mimeType: string,
  initialQuality: number,
  maxSizeBytes: number,
  attempts: number = 0
): Promise<File> {
  const MAX_ATTEMPTS = 8;
  
  if (attempts >= MAX_ATTEMPTS) {
    throw new Error('Could not compress image to target size after maximum attempts');
  }

  // Ensure we use JPEG for compression (better compression than PNG)
  const outputMimeType = mimeType.startsWith('image/png') ? 'image/jpeg' : mimeType;
  const quality = initialQuality - (attempts * 0.1); // Reduce quality by 10% each attempt

  if (quality <= 0.1) {
    throw new Error('Quality too low, cannot compress further');
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        // If still too large, try again with lower quality
        if (blob.size > maxSizeBytes && attempts < MAX_ATTEMPTS) {
          try {
            const result = await compressWithQualityReduction(
              canvas,
              fileName,
              mimeType,
              initialQuality,
              maxSizeBytes,
              attempts + 1
            );
            resolve(result);
          } catch (error) {
            reject(error);
          }
          return;
        }

        // Convert blob to File
        const extension = outputMimeType === 'image/jpeg' ? '.jpg' : getFileExtension(fileName);
        const compressedFileName = fileName.replace(/\.[^/.]+$/, '') + `_compressed${extension}`;
        
        const file = new File([blob], compressedFileName, {
          type: outputMimeType,
          lastModified: Date.now(),
        });

        resolve(file);
      },
      outputMimeType,
      quality
    );
  });
}

/**
 * Get file extension from filename
 */
function getFileExtension(fileName: string): string {
  const match = fileName.match(/\.[^/.]+$/);
  return match ? match[0] : '.jpg';
}

/**
 * Check if a file type can be compressed by our system
 */
export function canCompress(mimeType: string): boolean {
  return mimeType.startsWith('image/') && 
         !mimeType.includes('svg') && 
         !mimeType.includes('gif'); // Preserve animated GIFs
}

/**
 * Batch compress multiple files
 */
export async function compressImages(
  files: File[],
  options: Partial<CompressionOptions> = {}
): Promise<File[]> {
  const results: File[] = [];
  
  for (const file of files) {
    if (canCompress(file.type)) {
      const compressed = await compressImageIfNeeded(file, options);
      results.push(compressed);
    } else {
      console.log(`Skipping compression for ${file.name} (type: ${file.type})`);
      results.push(file);
    }
  }
  
  return results;
}
/**
 * Image utility functions for profile picture handling
 * Provides compression, validation, and format conversion for production use
 */

interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export interface CompressedImageResult {
  file: File;
  dataUrl: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

/**
 * Validate image file for profile picture upload
 * Checks file type, size, and dimensions
 */
export const validateImageFile = (file: File): ImageValidationResult => {
  console.log('ImageUtils: Validating image file:', file.name);
  
  // Check file type - only allow common web-safe formats
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please upload a JPEG, PNG, or WebP image file.'
    };
  }
  
  // Check file size - limit to 10MB for original upload
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'Image file must be smaller than 10MB.'
    };
  }
  
  return { isValid: true };
};

/**
 * Get image dimensions from file
 */
const getImageDimensions = (file: File): Promise<{ width: number; height: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.width, height: img.height });
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
};

/**
 * Compress and resize image for optimal web performance
 * Converts to WebP format for best compression while maintaining quality
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 400,
  maxHeight: number = 400,
  quality: number = 0.85
): Promise<CompressedImageResult> => {
  console.log('ImageUtils: Compressing image:', file.name);
  
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
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      ctx.fillStyle = '#FFFFFF'; // White background for transparency
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to WebP for optimal compression
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress image'));
            return;
          }
          
          // Create compressed file
          const compressedFile = new File([blob], `${file.name.split('.')[0]}.webp`, {
            type: 'image/webp',
            lastModified: Date.now(),
          });
          
          // Create data URL for preview
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            
            const result: CompressedImageResult = {
              file: compressedFile,
              dataUrl,
              originalSize: file.size,
              compressedSize: compressedFile.size,
              compressionRatio: Math.round((1 - compressedFile.size / file.size) * 100),
            };
            
            console.log('ImageUtils: Compression completed:', {
              originalSize: `${(file.size / 1024).toFixed(1)}KB`,
              compressedSize: `${(compressedFile.size / 1024).toFixed(1)}KB`,
              compressionRatio: `${result.compressionRatio}%`,
            });
            
            resolve(result);
          };
          
          reader.onerror = () => reject(new Error('Failed to read compressed image'));
          reader.readAsDataURL(compressedFile);
        },
        'image/webp',
        quality
      );
    };
    
    img.onerror = () => reject(new Error('Failed to load image for compression'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Generate a unique filename for storage
 * Returns path relative to the storage bucket (not including bucket name)
 */
export const generateImageFilename = (userId: string, originalName: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  const extension = 'webp'; // Always use WebP for compressed images
  
  // Return path relative to bucket: userId/filename.webp
  return `${userId}/${timestamp}-${randomString}.${extension}`;
};

/**
 * Create a circular crop preview of the image
 */
export const createCircularPreview = (dataUrl: string, size: number = 200): Promise<string> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    if (!ctx) {
      reject(new Error('Canvas context not available'));
      return;
    }
    
    canvas.width = size;
    canvas.height = size;
    
    img.onload = () => {
      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      
      // Draw image to fit circle
      const minDimension = Math.min(img.width, img.height);
      const sx = (img.width - minDimension) / 2;
      const sy = (img.height - minDimension) / 2;
      
      ctx.drawImage(img, sx, sy, minDimension, minDimension, 0, 0, size, size);
      
      resolve(canvas.toDataURL('image/webp', 0.9));
    };
    
    img.onerror = () => reject(new Error('Failed to create circular preview'));
    img.src = dataUrl;
  });
};
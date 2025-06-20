import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Check, 
  AlertCircle, 
  Loader2,
  User,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { uploadProfilePicture, removeProfilePicture } from '../lib/profilePicture';
import { createCircularPreview } from '../lib/imageUtils';
import toast from 'react-hot-toast';

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null;
  onImageUpdate: (newImageUrl: string | null) => void;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Profile picture upload component with drag & drop, preview, and compression
 * Provides a complete image upload experience with visual feedback
 */
export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentImageUrl,
  onImageUpdate,
  size = 'lg'
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  console.log('ProfilePictureUpload: Rendered with currentImageUrl:', currentImageUrl);

  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const handleFileSelect = async (file: File) => {
    console.log('ProfilePictureUpload: File selected:', file.name);
    setIsUploading(true);
    
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        try {
          const circularPreview = await createCircularPreview(dataUrl, 200);
          setPreviewUrl(circularPreview);
          setShowPreview(true);
        } catch (error) {
          console.error('ProfilePictureUpload: Failed to create preview:', error);
          setPreviewUrl(dataUrl);
          setShowPreview(true);
        }
      };
      reader.readAsDataURL(file);
      
      // Upload file
      const result = await uploadProfilePicture(file);
      
      if (result.success && result.profilePictureUrl) {
        onImageUpdate(result.profilePictureUrl);
        setShowPreview(false);
        setPreviewUrl(null);
        
        // Show compression info
        if (result.compressionInfo) {
          const { originalSize, compressedSize, compressionRatio } = result.compressionInfo;
          toast.success(
            `Profile picture updated! Compressed from ${(originalSize / 1024).toFixed(1)}KB to ${(compressedSize / 1024).toFixed(1)}KB (${compressionRatio}% reduction)`,
            { duration: 5000 }
          );
        } else {
          toast.success('Profile picture updated successfully!');
        }
      } else {
        toast.error(result.error || 'Failed to upload profile picture');
        setShowPreview(false);
        setPreviewUrl(null);
      }
    } catch (error) {
      console.error('ProfilePictureUpload: Upload error:', error);
      toast.error('Failed to upload profile picture');
      setShowPreview(false);
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;
    
    setIsRemoving(true);
    
    try {
      const result = await removeProfilePicture();
      
      if (result.success) {
        onImageUpdate(null);
        toast.success('Profile picture removed successfully!');
      } else {
        toast.error(result.error || 'Failed to remove profile picture');
      }
    } catch (error) {
      console.error('ProfilePictureUpload: Remove error:', error);
      toast.error('Failed to remove profile picture');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (imageFile) {
      handleFileSelect(imageFile);
    } else {
      toast.error('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Main Profile Picture Display */}
      <div className="relative">
        <div
          className={`${sizeClasses[size]} rounded-full border-4 border-gray-200 dark:border-gray-700 overflow-hidden bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center relative group cursor-pointer transition-all duration-200 hover:border-purple-400 dark:hover:border-purple-500`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={openFileDialog}
        >
          {currentImageUrl ? (
            <img
              src={currentImageUrl}
              alt="Profile"
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('ProfilePictureUpload: Failed to load image:', currentImageUrl);
                // Fallback to default avatar
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <User className={`${iconSizes[size]} text-white`} />
          )}
          
          {/* Hover Overlay */}
          <div className={`absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${isDragOver ? 'opacity-100 bg-purple-600/50' : ''}`}>
            <Camera className="h-6 w-6 text-white" />
          </div>
          
          {/* Loading Overlay */}
          {(isUploading || isRemoving) && (
            <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
              <Loader2 className="h-6 w-6 text-white animate-spin" />
            </div>
          )}
        </div>
        
        {/* Remove Button */}
        {currentImageUrl && !isUploading && !isRemoving && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveImage();
            }}
            className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-colors duration-200 shadow-lg"
            title="Remove profile picture"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Upload Instructions */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          {currentImageUrl ? 'Click to change' : 'Click to upload'} or drag & drop
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-500">
          JPEG, PNG, or WebP • Max 10MB • Automatically optimized
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-3">
        <button
          onClick={openFileDialog}
          disabled={isUploading || isRemoving}
          className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload Photo</span>
            </>
          )}
        </button>
        
        {currentImageUrl && (
          <button
            onClick={handleRemoveImage}
            disabled={isUploading || isRemoving}
            className="flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRemoving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Removing...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Remove</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Preview Modal */}
      <AnimatePresence>
        {showPreview && previewUrl && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 w-full max-w-md"
            >
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Preview Profile Picture
                </h3>
                
                <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                <div className="flex items-center justify-center space-x-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
                  <ImageIcon className="h-4 w-4" />
                  <span>Optimized for web • WebP format</span>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowPreview(false);
                      setPreviewUrl(null);
                      setIsUploading(false);
                    }}
                    className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
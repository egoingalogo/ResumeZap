import { supabase, handleSupabaseError } from './supabase';
import { 
  validateImageFile, 
  compressImage, 
  generateImageFilename,
  type CompressedImageResult 
} from './imageUtils';

/**
 * Profile picture management with Supabase Storage integration
 * Handles upload, update, and deletion of user profile pictures
 */

interface ProfilePictureUploadResult {
  success: boolean;
  profilePictureUrl?: string;
  error?: string;
  compressionInfo?: {
    originalSize: number;
    compressedSize: number;
    compressionRatio: number;
  };
}

/**
 * Upload profile picture to Supabase Storage
 * Includes validation, compression, and database update
 */
export const uploadProfilePicture = async (file: File): Promise<ProfilePictureUploadResult> => {
  console.log('ProfilePicture: Starting upload process for:', file.name);
  
  try {
    // Step 1: Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }
    
    // Step 2: Validate image file
    const validation = validateImageFile(file);
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error,
      };
    }
    
    // Step 3: Compress image for optimal web performance
    console.log('ProfilePicture: Compressing image...');
    const compressed: CompressedImageResult = await compressImage(file, 400, 400, 0.85);
    
    // Step 4: Delete existing profile picture if it exists
    await deleteExistingProfilePicture(user.id);
    
    // Step 5: Generate unique filename (relative to bucket)
    const filename = generateImageFilename(user.id, file.name);
    
    // Step 6: Upload to Supabase Storage
    console.log('ProfilePicture: Uploading to Supabase Storage...');
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-pictures')
      .upload(filename, compressed.file, {
        cacheControl: '3600',
        upsert: false,
      });
    
    if (uploadError) {
      console.error('ProfilePicture: Upload failed:', uploadError);
      throw new Error(handleSupabaseError(uploadError, 'upload profile picture'));
    }
    
    // Step 7: Get public URL
    const { data: urlData } = supabase.storage
      .from('profile-pictures')
      .getPublicUrl(filename);
    
    if (!urlData.publicUrl) {
      throw new Error('Failed to get public URL for uploaded image');
    }
    
    // Step 8: Update user profile in database
    console.log('ProfilePicture: Updating user profile...');
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        profile_picture_url: urlData.publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (updateError) {
      // If database update fails, clean up uploaded file
      await supabase.storage
        .from('profile-pictures')
        .remove([filename]);
      
      console.error('ProfilePicture: Database update failed:', updateError);
      throw new Error(handleSupabaseError(updateError, 'update profile picture URL'));
    }
    
    console.log('ProfilePicture: Upload completed successfully');
    
    return {
      success: true,
      profilePictureUrl: urlData.publicUrl,
      compressionInfo: {
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
        compressionRatio: compressed.compressionRatio,
      },
    };
    
  } catch (error) {
    console.error('ProfilePicture: Upload failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to upload profile picture',
    };
  }
};

/**
 * Delete existing profile picture from storage
 */
const deleteExistingProfilePicture = async (userId: string): Promise<void> => {
  try {
    console.log('ProfilePicture: Checking for existing profile picture...');
    
    // Get current profile picture URL from database
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();
    
    if (fetchError || !userData?.profile_picture_url) {
      console.log('ProfilePicture: No existing profile picture found');
      return;
    }
    
    // Extract filename from URL
    const url = userData.profile_picture_url;
    
    // Parse the URL to extract the file path
    // URL format: https://[project].supabase.co/storage/v1/object/public/profile-pictures/userId/filename.webp
    const urlParts = url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === 'profile-pictures');
    
    if (bucketIndex !== -1 && bucketIndex < urlParts.length - 1) {
      // Get everything after 'profile-pictures' in the URL
      const filename = urlParts.slice(bucketIndex + 1).join('/');
      
      console.log('ProfilePicture: Deleting existing file:', filename);
      const { error: deleteError } = await supabase.storage
        .from('profile-pictures')
        .remove([filename]);
      
      if (deleteError) {
        console.warn('ProfilePicture: Failed to delete existing file:', deleteError);
        // Don't throw error - continue with upload
      }
    }
  } catch (error) {
    console.warn('ProfilePicture: Error during existing file cleanup:', error);
    // Don't throw error - continue with upload
  }
};

/**
 * Remove profile picture completely
 */
export const removeProfilePicture = async (): Promise<{ success: boolean; error?: string }> => {
  console.log('ProfilePicture: Removing profile picture');
  
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('No authenticated user found');
    }
    
    // Delete from storage
    await deleteExistingProfilePicture(user.id);
    
    // Update database to remove URL
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        profile_picture_url: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id);
    
    if (updateError) {
      console.error('ProfilePicture: Failed to update database:', updateError);
      throw new Error(handleSupabaseError(updateError, 'remove profile picture'));
    }
    
    console.log('ProfilePicture: Profile picture removed successfully');
    return { success: true };
    
  } catch (error) {
    console.error('ProfilePicture: Failed to remove profile picture:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to remove profile picture',
    };
  }
};

/**
 * Get profile picture URL for a user
 */
const getProfilePictureUrl = async (userId: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('profile_picture_url')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      return null;
    }
    
    return data.profile_picture_url;
  } catch (error) {
    console.error('ProfilePicture: Failed to get profile picture URL:', error);
    return null;
  }
};
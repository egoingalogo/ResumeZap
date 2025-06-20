/*
  # Add Profile Picture Support

  1. Changes
    - Add `profile_picture_url` column to `users` table
    - Column is nullable to support users without profile pictures
    - Add index for better query performance

  2. Security
    - No additional RLS policies needed as this uses existing user policies
    - Profile pictures will be stored in Supabase Storage with public access
*/

-- Add profile_picture_url column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'profile_picture_url'
  ) THEN
    ALTER TABLE users ADD COLUMN profile_picture_url text;
  END IF;
END $$;

-- Add index for profile picture URL queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_users_profile_picture_url ON users(profile_picture_url) WHERE profile_picture_url IS NOT NULL;
/*
  # Add Hiring Manager and Personal Highlights to Cover Letters

  1. Changes
    - Add `hiring_manager` column to `cover_letters` table (optional text field)
    - Add `personal_highlights` column to `cover_letters` table (optional text field)
    - Both fields are nullable to support existing records

  2. Security
    - No additional RLS policies needed as this uses existing cover letter policies
*/

-- Add hiring_manager column to cover_letters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cover_letters' AND column_name = 'hiring_manager'
  ) THEN
    ALTER TABLE cover_letters ADD COLUMN hiring_manager text;
  END IF;
END $$;

-- Add personal_highlights column to cover_letters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cover_letters' AND column_name = 'personal_highlights'
  ) THEN
    ALTER TABLE cover_letters ADD COLUMN personal_highlights text;
  END IF;
END $$;
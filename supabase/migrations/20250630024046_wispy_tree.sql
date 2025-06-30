/*
  # Add Cover Letter Analysis Fields

  1. New Fields
    - `tone_analysis` (jsonb column for storing tone analysis information)
      - Contains formality, enthusiasm, persuasiveness, clarity, and notes
    - `matching_elements` (jsonb column for storing job requirements and qualifications matching)
      - Contains jobRequirements, candidateQualifications, and alignmentScore
    - Both fields are nullable for backward compatibility with existing records

  2. Security
    - No additional RLS policies needed as this uses existing cover letter policies
*/

-- Add tone_analysis column to cover_letters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cover_letters' AND column_name = 'tone_analysis'
  ) THEN
    ALTER TABLE cover_letters ADD COLUMN tone_analysis jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add matching_elements column to cover_letters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cover_letters' AND column_name = 'matching_elements'
  ) THEN
    ALTER TABLE cover_letters ADD COLUMN matching_elements jsonb DEFAULT NULL;
  END IF;
END $$;
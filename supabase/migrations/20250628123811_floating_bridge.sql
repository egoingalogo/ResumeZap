/*
  # Add Resume Analysis Details Storage

  1. Changes
    - Add `analysis_details` column to `resumes` table to store complete analysis data
    - Column stores JSON data including changes, keyword matches, and ATS optimizations
    - Add index for better query performance

  2. Security
    - No additional RLS policies needed as this uses existing resume policies
*/

-- Add analysis_details column to resumes table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'resumes' AND column_name = 'analysis_details'
  ) THEN
    ALTER TABLE resumes ADD COLUMN analysis_details jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add index for analysis details queries (optional, for performance)
CREATE INDEX IF NOT EXISTS idx_resumes_analysis_details ON resumes USING gin(analysis_details) WHERE analysis_details IS NOT NULL;
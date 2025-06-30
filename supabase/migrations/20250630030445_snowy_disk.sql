/*
  # Add Job Title Extraction to Skill Analyses

  1. Changes
    - Add `extracted_job_title` column to `skill_analyses` table
    - Column is nullable to support existing records
    - Will store the extracted job title from job posting for better display in UI

  2. Security
    - No additional RLS policies needed as this uses existing skill analyses policies
*/

-- Add extracted_job_title column to skill_analyses table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'extracted_job_title'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN extracted_job_title text;
  END IF;
END $$;
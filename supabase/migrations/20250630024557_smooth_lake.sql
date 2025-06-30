/*
  # Add Detailed Skill Gap Analysis Fields

  1. New Columns
    - `detailed_skill_gap_analysis` (jsonb) - Stores full skillGapAnalysis object
    - `learning_recommendations_details` (jsonb) - Stores detailed learning recommendations 
    - `development_roadmap_details` (jsonb) - Stores the development roadmap
    - `skills_already_strong_details` (jsonb) - Stores skills already possessed
    - `total_development_time` (text) - Overall timeline estimate
    - `budget_estimate_details` (jsonb) - Cost estimates for learning paths
    - `next_steps_details` (jsonb) - Immediate actionable steps

  2. Changes
    - Adds new columns to existing skill_analyses table
    - All fields are nullable to support existing records
*/

-- Add detailed_skill_gap_analysis column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'detailed_skill_gap_analysis'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN detailed_skill_gap_analysis jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add learning_recommendations_details column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'learning_recommendations_details'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN learning_recommendations_details jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add development_roadmap_details column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'development_roadmap_details'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN development_roadmap_details jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add skills_already_strong_details column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'skills_already_strong_details'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN skills_already_strong_details jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add total_development_time column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'total_development_time'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN total_development_time text DEFAULT NULL;
  END IF;
END $$;

-- Add budget_estimate_details column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'budget_estimate_details'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN budget_estimate_details jsonb DEFAULT NULL;
  END IF;
END $$;

-- Add next_steps_details column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'skill_analyses' AND column_name = 'next_steps_details'
  ) THEN
    ALTER TABLE skill_analyses ADD COLUMN next_steps_details jsonb DEFAULT NULL;
  END IF;
END $$;
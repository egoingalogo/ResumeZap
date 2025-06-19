/*
  # Create Skill Gap Analysis Storage Tables

  1. New Tables
    - `skill_analyses`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `resume_id` (uuid, optional foreign key to resumes)
      - `job_posting_content` (text, job posting used for analysis)
      - `resume_content_snapshot` (text, resume content snapshot)
      - `analysis_date` (timestamp, when analysis was performed)
      - `overall_summary` (text, optional AI-generated summary)
    - `skill_recommendations`
      - `id` (uuid, primary key)
      - `skill_analysis_id` (uuid, foreign key to skill_analyses)
      - `skill_name` (text, name of the skill)
      - `importance` (enum: low, medium, high)
      - `has_skill` (boolean, whether user has this skill)
      - `recommended_courses` (jsonb, array of course recommendations)
      - `recommended_resources` (jsonb, array of resource recommendations)
      - `time_estimate` (text, estimated time to learn)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their own data

  3. Enums
    - Create `skill_importance` enum for priority levels
*/

-- Create skill importance enum
CREATE TYPE skill_importance AS ENUM ('low', 'medium', 'high');

-- Create skill_analyses table
CREATE TABLE IF NOT EXISTS skill_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id uuid REFERENCES resumes(id) ON DELETE SET NULL,
  job_posting_content text NOT NULL,
  resume_content_snapshot text NOT NULL,
  analysis_date timestamptz DEFAULT now(),
  overall_summary text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create skill_recommendations table
CREATE TABLE IF NOT EXISTS skill_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_analysis_id uuid NOT NULL REFERENCES skill_analyses(id) ON DELETE CASCADE,
  skill_name text NOT NULL,
  importance skill_importance NOT NULL DEFAULT 'medium',
  has_skill boolean NOT NULL DEFAULT false,
  recommended_courses jsonb DEFAULT '[]'::jsonb,
  recommended_resources jsonb DEFAULT '[]'::jsonb,
  time_estimate text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE skill_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_recommendations ENABLE ROW LEVEL SECURITY;

-- Create policies for skill_analyses
CREATE POLICY "Users can insert own skill analyses"
  ON skill_analyses
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own skill analyses"
  ON skill_analyses
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own skill analyses"
  ON skill_analyses
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own skill analyses"
  ON skill_analyses
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create policies for skill_recommendations
CREATE POLICY "Users can insert own skill recommendations"
  ON skill_recommendations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM skill_analyses 
      WHERE id = skill_analysis_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can read own skill recommendations"
  ON skill_recommendations
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_analyses 
      WHERE id = skill_analysis_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own skill recommendations"
  ON skill_recommendations
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_analyses 
      WHERE id = skill_analysis_id 
      AND user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM skill_analyses 
      WHERE id = skill_analysis_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own skill recommendations"
  ON skill_recommendations
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM skill_analyses 
      WHERE id = skill_analysis_id 
      AND user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skill_analyses_user_id ON skill_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_analyses_analysis_date ON skill_analyses(analysis_date DESC);
CREATE INDEX IF NOT EXISTS idx_skill_analyses_resume_id ON skill_analyses(resume_id);

CREATE INDEX IF NOT EXISTS idx_skill_recommendations_analysis_id ON skill_recommendations(skill_analysis_id);
CREATE INDEX IF NOT EXISTS idx_skill_recommendations_importance ON skill_recommendations(importance);
CREATE INDEX IF NOT EXISTS idx_skill_recommendations_has_skill ON skill_recommendations(has_skill);

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_skill_analyses_updated_at'
  ) THEN
    CREATE TRIGGER update_skill_analyses_updated_at
      BEFORE UPDATE ON skill_analyses
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_skill_recommendations_updated_at'
  ) THEN
    CREATE TRIGGER update_skill_recommendations_updated_at
      BEFORE UPDATE ON skill_recommendations
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
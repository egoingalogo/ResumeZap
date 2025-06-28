/*
  # Create Cover Letters Storage Table

  1. New Tables
    - `cover_letters`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `title` (text, cover letter title)
      - `content` (text, cover letter content)
      - `company_name` (text, target company)
      - `job_title` (text, target position)
      - `tone` (enum: professional, enthusiastic, concise)
      - `job_posting` (text, job posting used for generation)
      - `resume_content_snapshot` (text, resume content snapshot)
      - `customizations` (jsonb, AI customizations applied)
      - `key_strengths` (jsonb, key strengths highlighted)
      - `call_to_action` (text, closing statement used)

  2. Security
    - Enable RLS on cover_letters table
    - Add policies for authenticated users to manage their own data

  3. Enums
    - Create `cover_letter_tone` enum for tone options
*/

-- Create cover letter tone enum
CREATE TYPE cover_letter_tone AS ENUM ('professional', 'enthusiastic', 'concise');

-- Create cover_letters table
CREATE TABLE IF NOT EXISTS cover_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  company_name text NOT NULL,
  job_title text NOT NULL,
  tone cover_letter_tone NOT NULL DEFAULT 'professional',
  job_posting text,
  resume_content_snapshot text,
  customizations jsonb DEFAULT '[]'::jsonb,
  key_strengths jsonb DEFAULT '[]'::jsonb,
  call_to_action text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE cover_letters ENABLE ROW LEVEL SECURITY;

-- Create policies for cover_letters
CREATE POLICY "Users can insert own cover letters"
  ON cover_letters
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own cover letters"
  ON cover_letters
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own cover letters"
  ON cover_letters
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cover letters"
  ON cover_letters
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_created_at ON cover_letters(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cover_letters_company_name ON cover_letters(company_name);
CREATE INDEX IF NOT EXISTS idx_cover_letters_tone ON cover_letters(tone);

-- Create trigger for updated_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_cover_letters_updated_at'
  ) THEN
    CREATE TRIGGER update_cover_letters_updated_at
      BEFORE UPDATE ON cover_letters
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
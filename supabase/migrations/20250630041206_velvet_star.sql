/*
  # Create App Settings Table

  1. New Table
    - `app_settings`
      - `setting_key` (text, primary key)
      - `setting_value` (jsonb, stores setting values)
      - `created_at` (timestamp, creation date)
      - `updated_at` (timestamp, last update date)

  2. Security
    - Enable RLS on the table
    - Allow read access to all authenticated and anonymous users
    - Restrict write access to service role only

  3. Initial Data
    - Add lifetime plan price setting
*/

-- Create app_settings table
CREATE TABLE IF NOT EXISTS app_settings (
  setting_key text PRIMARY KEY,
  setting_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for app_settings
CREATE POLICY "Everyone can read app_settings"
  ON app_settings
  FOR SELECT
  TO authenticated, anon
  USING (true);
  
-- Allow only service role (admins) to update settings
CREATE POLICY "Only service role can modify app_settings"
  ON app_settings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Insert initial settings including lifetime price
INSERT INTO app_settings (setting_key, setting_value) 
VALUES ('lifetime_plan_price', '{"price": "79.99", "currency": "USD"}'::jsonb)
ON CONFLICT (setting_key) DO NOTHING;

-- Create trigger for updated_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_app_settings_updated_at'
  ) THEN
    CREATE TRIGGER update_app_settings_updated_at
      BEFORE UPDATE ON app_settings
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
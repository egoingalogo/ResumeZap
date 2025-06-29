/*
  # Create Payment Records Table

  1. New Tables
    - `payments`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `paypal_order_id` (text, PayPal order identifier)
      - `plan_type` (text, plan purchased)
      - `amount` (text, payment amount)
      - `currency` (text, payment currency)
      - `status` (text, payment status)
      - `payment_data` (jsonb, complete payment data from PayPal)
      - `created_at` (timestamp, when payment was processed)
      - `updated_at` (timestamp, when record was updated)

  2. Security
    - Enable RLS on payments table
    - Add policies for authenticated users to read their own payment records
    - No update or delete policies as payment records should be immutable
*/

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  paypal_order_id text NOT NULL,
  plan_type text NOT NULL,
  amount text NOT NULL,
  currency text NOT NULL,
  status text NOT NULL,
  payment_data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy for users to read their own payments
CREATE POLICY "Users can read own payments"
  ON payments
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_paypal_order_id ON payments(paypal_order_id);

-- Create trigger for updated_at timestamp
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_payments_updated_at'
  ) THEN
    CREATE TRIGGER update_payments_updated_at
      BEFORE UPDATE ON payments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;
/*
  # Create user education table

  1. New Tables
    - `user_education`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `school` (text)
      - `degree` (text)
      - `start_year` (text)
      - `end_year` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `user_education` table
    - Add policies for users to manage their own education records
*/

-- Create user_education table
CREATE TABLE IF NOT EXISTS user_education (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school text NOT NULL,
  degree text NOT NULL,
  start_year text NOT NULL,
  end_year text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE user_education ENABLE ROW LEVEL SECURITY;

-- Add policies for user_education
CREATE POLICY "Users can view their own education records"
  ON user_education
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own education records"
  ON user_education
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own education records"
  ON user_education
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own education records"
  ON user_education
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_education_user_id ON user_education(user_id);
CREATE INDEX IF NOT EXISTS idx_user_education_start_year ON user_education(start_year DESC);
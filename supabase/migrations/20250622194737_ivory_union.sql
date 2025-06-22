/*
  # Create skills table for user skills management

  1. New Tables
    - `skills`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `name` (text, required)
      - `level` (text, optional - beginner, intermediate, advanced, expert)
      - `years_experience` (integer, optional)
      - `is_featured` (boolean, default false - for highlighting top skills)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `skills` table
    - Add policies for users to manage their own skills
    - Users can view skills of public profiles

  3. Indexes
    - Add index on user_id for efficient queries
    - Add index on name for skill searches
    - Add index on is_featured for featured skills
*/

-- Create skills table
CREATE TABLE IF NOT EXISTS skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  level text CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')),
  years_experience integer CHECK (years_experience >= 0 AND years_experience <= 50),
  is_featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, name) -- Prevent duplicate skills for the same user
);

-- Enable Row Level Security
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;

-- Create policies for skills
CREATE POLICY "Users can view skills of public profiles"
  ON skills
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing skills if the user profile is public or it's the user's own skills
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = skills.user_id 
      AND (profiles.is_public = true OR profiles.id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own skills"
  ON skills
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own skills"
  ON skills
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own skills"
  ON skills
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_skills_featured ON skills(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_skills_user_featured ON skills(user_id, is_featured);
CREATE INDEX IF NOT EXISTS idx_skills_created_at ON skills(created_at DESC);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_skills_updated_at
  BEFORE UPDATE ON skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comments
COMMENT ON TABLE skills IS 'Stores user skills and expertise information';
COMMENT ON COLUMN skills.level IS 'Skill proficiency level: beginner, intermediate, advanced, expert';
COMMENT ON COLUMN skills.years_experience IS 'Number of years of experience with this skill';
COMMENT ON COLUMN skills.is_featured IS 'Whether this skill should be highlighted as a top skill';
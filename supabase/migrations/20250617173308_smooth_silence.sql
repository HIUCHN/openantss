/*
  # Create user_location table for real-time location tracking

  1. New Tables
    - `user_location`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `latitude` (double precision)
      - `longitude` (double precision)
      - `accuracy` (double precision, optional)
      - `altitude` (double precision, optional)
      - `heading` (double precision, optional)
      - `speed` (double precision, optional)
      - `timestamp` (timestamptz)
      - `is_active` (boolean) - to mark current/latest location
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on `user_location` table
    - Add policies for users to manage their own location data
    - Add policies for viewing public locations based on privacy settings

  3. Indexes
    - Add spatial index for location queries
    - Add index for user_id and timestamp
    - Add index for active locations
*/

-- Create user_location table
CREATE TABLE IF NOT EXISTS user_location (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  accuracy double precision,
  altitude double precision,
  heading double precision,
  speed double precision,
  timestamp timestamptz NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_location ENABLE ROW LEVEL SECURITY;

-- Create policies for user_location
CREATE POLICY "Users can view their own location data"
  ON user_location
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public location data"
  ON user_location
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = user_location.user_id 
      AND profiles.is_public = true
    )
  );

CREATE POLICY "Users can insert their own location data"
  ON user_location
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own location data"
  ON user_location
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own location data"
  ON user_location
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_location_user_id ON user_location(user_id);
CREATE INDEX IF NOT EXISTS idx_user_location_timestamp ON user_location(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_user_location_active ON user_location(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_user_location_spatial ON user_location(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_user_location_user_active ON user_location(user_id, is_active) WHERE is_active = true;

-- Create function to update active location
CREATE OR REPLACE FUNCTION update_active_location()
RETURNS TRIGGER AS $$
BEGIN
  -- Set all previous locations for this user to inactive
  UPDATE user_location 
  SET is_active = false 
  WHERE user_id = NEW.user_id AND id != NEW.id;
  
  -- Ensure the new location is active
  NEW.is_active = true;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically manage active locations
CREATE TRIGGER trigger_update_active_location
  BEFORE INSERT ON user_location
  FOR EACH ROW
  EXECUTE FUNCTION update_active_location();
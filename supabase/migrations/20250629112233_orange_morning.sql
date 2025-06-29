/*
  # Create Smart Matches Table

  1. New Tables
    - `smart_matches`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `match_id` (uuid, foreign key to profiles)
      - `match_score` (integer)
      - `distance` (double precision)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on `smart_matches` table
    - Add policies for users to view their own matches
    - Add policies for users to create matches

  3. Indexes
    - Add index on user_id for efficient queries
    - Add index on match_id for efficient queries
    - Add index on match_score for sorting
*/

-- Create smart_matches table
CREATE TABLE IF NOT EXISTS smart_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  match_score integer NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  distance double precision NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  UNIQUE(user_id, match_id)
);

-- Enable Row Level Security
ALTER TABLE smart_matches ENABLE ROW LEVEL SECURITY;

-- Create policies for smart_matches
CREATE POLICY "Users can view their own smart matches"
  ON smart_matches
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create smart matches"
  ON smart_matches
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own smart matches"
  ON smart_matches
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own smart matches"
  ON smart_matches
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_smart_matches_user_id ON smart_matches(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_matches_match_id ON smart_matches(match_id);
CREATE INDEX IF NOT EXISTS idx_smart_matches_score ON smart_matches(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_smart_matches_distance ON smart_matches(distance ASC);
CREATE INDEX IF NOT EXISTS idx_smart_matches_created_at ON smart_matches(created_at DESC);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_smart_matches_updated_at
  BEFORE UPDATE ON smart_matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to store smart matches from nearby users
CREATE OR REPLACE FUNCTION store_smart_matches_from_nearby(radius_meters double precision DEFAULT 5000)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_lat double precision;
  user_lng double precision;
  match_count integer := 0;
  result json;
BEGIN
  -- Get current user's location
  SELECT latitude, longitude INTO user_lat, user_lng
  FROM profiles
  WHERE id = auth.uid() AND is_public = true;
  
  -- Check if user has location data
  IF user_lat IS NULL OR user_lng IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'message', 'User location not available. Please enable location sharing.'
    );
  END IF;
  
  -- Delete existing matches to refresh them
  DELETE FROM smart_matches WHERE user_id = auth.uid();
  
  -- Insert new matches from nearby users
  WITH nearby_users AS (
    SELECT 
      p.id,
      p.latitude,
      p.longitude,
      -- Calculate distance using the Haversine formula
      (6371000 * acos(
        cos(radians(user_lat)) * 
        cos(radians(p.latitude)) * 
        cos(radians(p.longitude) - radians(user_lng)) + 
        sin(radians(user_lat)) * 
        sin(radians(p.latitude))
      )) AS distance
    FROM profiles p
    WHERE 
      p.id != auth.uid() AND 
      p.is_public = true AND
      p.latitude IS NOT NULL AND 
      p.longitude IS NOT NULL AND
      p.last_location_update > now() - interval '1 hour'
    -- Filter by radius
    HAVING (6371000 * acos(
      cos(radians(user_lat)) * 
      cos(radians(p.latitude)) * 
      cos(radians(p.longitude) - radians(user_lng)) + 
      sin(radians(user_lat)) * 
      sin(radians(p.latitude))
    )) <= radius_meters
    -- Order by distance
    ORDER BY distance ASC
  )
  INSERT INTO smart_matches (user_id, match_id, match_score, distance)
  SELECT 
    auth.uid(),
    nu.id,
    -- Calculate match score based on distance (closer = higher score)
    GREATEST(50, LEAST(100, 100 - ROUND((nu.distance / radius_meters) * 50))),
    nu.distance
  FROM nearby_users nu;
  
  -- Get count of matches created
  GET DIAGNOSTICS match_count = ROW_COUNT;
  
  result := json_build_object(
    'success', true,
    'message', 'Smart matches created successfully',
    'count', match_count
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION store_smart_matches_from_nearby(double precision) TO authenticated;

-- Create function to get smart matches for a user
CREATE OR REPLACE FUNCTION get_smart_matches(limit_count integer DEFAULT 20)
RETURNS TABLE (
  id uuid,
  match_id uuid,
  match_score integer,
  distance double precision,
  username text,
  full_name text,
  role text,
  company text,
  bio text,
  avatar_url text,
  interests text[],
  skills text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sm.id,
    sm.match_id,
    sm.match_score,
    sm.distance,
    p.username,
    p.full_name,
    p.role,
    p.company,
    p.bio,
    p.avatar_url,
    p.interests,
    p.skills
  FROM smart_matches sm
  INNER JOIN profiles p ON p.id = sm.match_id
  WHERE sm.user_id = auth.uid()
  ORDER BY sm.match_score DESC, sm.distance ASC
  LIMIT limit_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_smart_matches(integer) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE smart_matches IS 'Stores smart matches between users based on location and other factors';
COMMENT ON COLUMN smart_matches.match_score IS 'Score from 0-100 indicating match quality';
COMMENT ON COLUMN smart_matches.distance IS 'Distance in meters between users';
COMMENT ON FUNCTION store_smart_matches_from_nearby(double precision) IS 'Creates smart matches from nearby users within a specified radius';
COMMENT ON FUNCTION get_smart_matches(integer) IS 'Gets smart matches for the current user with profile details';
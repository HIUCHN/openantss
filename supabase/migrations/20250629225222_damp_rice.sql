/*
  # Force Schema Refresh and Fix Location Columns

  1. Changes
    - Force schema cache refresh by making a minor change to profiles table
    - Ensure latitude, longitude, and last_location_update columns exist
    - Add proper indexes for location-based queries
    - Add column comments for documentation

  2. Security
    - Location data follows existing RLS policies for profiles table
    - Users can only update their own location data
*/

-- Force schema cache refresh by updating table comment
COMMENT ON TABLE profiles IS 'User profiles with location data - Updated to refresh schema cache';

-- Ensure the columns exist with proper error handling
DO $$
BEGIN
  -- Add latitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
    RAISE NOTICE 'Added latitude column to profiles table';
  END IF;

  -- Add longitude column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
    RAISE NOTICE 'Added longitude column to profiles table';
  END IF;

  -- Add last_location_update column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_location_update'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_location_update timestamptz;
    RAISE NOTICE 'Added last_location_update column to profiles table';
  END IF;
END $$;

-- Add column comments to document the column purposes
COMMENT ON COLUMN profiles.latitude IS 'User current latitude coordinate for location sharing';
COMMENT ON COLUMN profiles.longitude IS 'User current longitude coordinate for location sharing';
COMMENT ON COLUMN profiles.last_location_update IS 'Timestamp of when the user location was last updated';

-- Create indexes for location-based queries if they don't exist
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) 
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profiles_last_location_update ON profiles(last_location_update DESC);

-- Refresh the schema by analyzing the table
ANALYZE profiles;

-- Force a minor schema change to trigger cache refresh
ALTER TABLE profiles ALTER COLUMN updated_at SET DEFAULT now();
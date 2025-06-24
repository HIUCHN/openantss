/*
  # Fix location columns in profiles table

  1. New Tables
    - No new tables created

  2. Changes
    - Ensure `latitude` column exists (double precision)
    - Ensure `longitude` column exists (double precision) 
    - Ensure `last_location_update` column exists (timestamptz)
    - Add indexes for location-based queries

  3. Security
    - Location data follows existing RLS policies for profiles table
    - Users can only update their own location data
*/

-- Add latitude column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
    RAISE NOTICE 'Added latitude column to profiles table';
  ELSE
    RAISE NOTICE 'latitude column already exists in profiles table';
  END IF;
END $$;

-- Add longitude column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
    RAISE NOTICE 'Added longitude column to profiles table';
  ELSE
    RAISE NOTICE 'longitude column already exists in profiles table';
  END IF;
END $$;

-- Add last_location_update column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'last_location_update'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_location_update timestamptz;
    RAISE NOTICE 'Added last_location_update column to profiles table';
  ELSE
    RAISE NOTICE 'last_location_update column already exists in profiles table';
  END IF;
END $$;

-- Create index for location-based queries (for proximity searches)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for location update timestamp
CREATE INDEX IF NOT EXISTS idx_profiles_last_location_update ON profiles(last_location_update DESC);

-- Add comments to document the column purposes
COMMENT ON COLUMN profiles.latitude IS 'User''s current latitude coordinate for location sharing';
COMMENT ON COLUMN profiles.longitude IS 'User''s current longitude coordinate for location sharing';
COMMENT ON COLUMN profiles.last_location_update IS 'Timestamp of when the user''s latitude/longitude was last updated';
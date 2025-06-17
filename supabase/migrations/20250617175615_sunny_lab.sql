/*
  # Add location columns to profiles table

  1. Changes
    - Add `latitude` column (double precision)
    - Add `longitude` column (double precision)
    - Add `last_location_update` column (timestamp)
    - Add index for location-based queries

  2. Security
    - Location data follows existing RLS policies for profiles table
    - Users can only update their own location data
*/

-- Add location columns to profiles table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'latitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN latitude double precision;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'longitude'
  ) THEN
    ALTER TABLE profiles ADD COLUMN longitude double precision;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_location_update'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_location_update timestamptz;
  END IF;
END $$;

-- Create index for location-based queries (for proximity searches)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for location update timestamp
CREATE INDEX IF NOT EXISTS idx_profiles_last_location_update ON profiles(last_location_update DESC);
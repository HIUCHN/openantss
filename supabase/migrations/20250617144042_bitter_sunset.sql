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

-- Add location columns to profiles table
ALTER TABLE profiles 
ADD COLUMN latitude double precision,
ADD COLUMN longitude double precision,
ADD COLUMN last_location_update timestamptz;

-- Create index for location-based queries (for proximity searches)
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Create index for location update timestamp
CREATE INDEX IF NOT EXISTS idx_profiles_last_location_update ON profiles(last_location_update DESC);
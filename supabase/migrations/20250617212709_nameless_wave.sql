/*
  # Add last_location_update column to profiles table

  1. Changes
    - Add `last_location_update` column (timestamptz) to profiles table
    - Add index for efficient querying by location update time

  2. Security
    - Column follows existing RLS policies for profiles table
    - Users can only update their own location data
*/

-- Add last_location_update column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_location_update'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_location_update timestamptz;
  END IF;
END $$;

-- Create index for location update timestamp queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_location_update ON profiles(last_location_update DESC);

-- Add comment to document the column purpose
COMMENT ON COLUMN profiles.last_location_update IS 'Timestamp of when the user''s latitude/longitude was last updated';
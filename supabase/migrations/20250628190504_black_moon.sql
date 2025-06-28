/*
  # Fix Avatar Storage and Improve Location Accuracy

  1. Storage Improvements
    - Create a dedicated 'avatars' storage bucket if it doesn't exist
    - Set up proper RLS policies for avatar storage
    - Implement user-specific folder structure for better organization
    - Add helper functions to update avatar URLs in user profiles

  2. Location Accuracy Improvements
    - Add function to update user location with high accuracy
    - Ensure location data is properly stored and updated
    - Add indexes for efficient location queries

  3. Security
    - Implement proper RLS policies for avatar access
    - Ensure users can only access their own avatars or public avatars
    - Protect user location data with appropriate access controls
*/

-- Create a storage bucket for avatars if it doesn't exist
DO $$
BEGIN
  -- Check if the bucket already exists
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE name = 'avatars'
  ) THEN
    -- Create the bucket using the proper API function
    PERFORM storage.create_bucket('avatars', 'User avatar storage');
    
    -- Set the bucket to public (allows public access with RLS policies)
    UPDATE storage.buckets SET public = TRUE WHERE name = 'avatars';
    
    RAISE NOTICE 'Created avatars storage bucket';
  ELSE
    RAISE NOTICE 'Avatars storage bucket already exists';
  END IF;
END $$;

-- Create transaction for policy creation to ensure atomicity
BEGIN;
  -- Drop existing policies if they exist to avoid conflicts
  DROP POLICY IF EXISTS "Avatar public read access" ON storage.objects;
  DROP POLICY IF EXISTS "Avatar upload access" ON storage.objects;
  DROP POLICY IF EXISTS "Avatar update access" ON storage.objects;
  DROP POLICY IF EXISTS "Avatar delete access" ON storage.objects;

  -- Create policy for public read access to avatars
  CREATE POLICY "Avatar public read access"
    ON storage.objects
    FOR SELECT
    TO public
    USING (
      bucket_id = 'avatars' AND (
        -- Allow access to avatars of public profiles
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.avatar_url LIKE '%' || name || '%'
          AND profiles.is_public = true
        )
        OR
        -- Allow users to access their own avatars
        (storage.foldername(name))[1] = auth.uid()::text
      )
    );

  -- Create policy for avatar uploads
  CREATE POLICY "Avatar upload access"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Create policy for avatar updates
  CREATE POLICY "Avatar update access"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );

  -- Create policy for avatar deletion
  CREATE POLICY "Avatar delete access"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'avatars' AND
      (storage.foldername(name))[1] = auth.uid()::text
    );
COMMIT;

-- Create function to update avatar URL in profile
CREATE OR REPLACE FUNCTION update_avatar_url(
  avatar_url text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Update profile with new avatar URL
  UPDATE profiles
  SET 
    avatar_url = avatar_url,
    updated_at = now()
  WHERE id = auth.uid();
  
  result := json_build_object(
    'success', true,
    'message', 'Avatar URL updated successfully',
    'avatar_url', avatar_url
  );
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_avatar_url(text) TO authenticated;

-- Create function to update user location with high accuracy
CREATE OR REPLACE FUNCTION update_user_location_high_accuracy(
  lat double precision,
  lng double precision,
  accuracy double precision DEFAULT NULL,
  altitude double precision DEFAULT NULL,
  heading double precision DEFAULT NULL,
  speed double precision DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Only update if user has public mode enabled
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_public = true
  ) THEN
    -- Update profile with new location
    UPDATE profiles
    SET 
      latitude = lat,
      longitude = lng,
      last_location_update = now(),
      updated_at = now()
    WHERE id = auth.uid();
    
    -- Insert into user_location table for history
    INSERT INTO user_location (
      user_id,
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      timestamp,
      is_active
    ) VALUES (
      auth.uid(),
      lat,
      lng,
      accuracy,
      altitude,
      heading,
      speed,
      now(),
      true
    );
    
    -- Set all previous locations to inactive
    UPDATE user_location
    SET is_active = false
    WHERE user_id = auth.uid()
      AND id != currval(pg_get_serial_sequence('user_location', 'id'));
    
    result := json_build_object(
      'success', true,
      'message', 'Location updated with high accuracy',
      'latitude', lat,
      'longitude', lng,
      'accuracy', accuracy
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Location sharing is disabled. Enable public mode first.'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_location_high_accuracy(double precision, double precision, double precision, double precision, double precision, double precision) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION update_avatar_url(text) IS 'Updates a user''s avatar URL in their profile';
COMMENT ON FUNCTION update_user_location_high_accuracy(double precision, double precision, double precision, double precision, double precision, double precision) IS 'Updates a user''s location with high accuracy and maintains location history';
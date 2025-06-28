/*
  # Fix Avatar Storage Implementation

  1. Changes
    - Create avatars storage bucket using proper API functions
    - Set up RLS policies with correct permissions
    - Use folder-based organization for user avatars
    - Fix permission issues with previous implementation

  2. Security
    - Users can only upload/modify/delete their own avatars
    - Public read access for avatars of users with public profiles
    - Private avatars only accessible to their owners
*/

-- Create a storage bucket for avatars using the storage API
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

-- Add helpful comments
COMMENT ON FUNCTION update_avatar_url(text) IS 'Updates a user''s avatar URL in their profile';
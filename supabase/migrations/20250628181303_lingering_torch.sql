/*
  # Create Avatar Storage for User Profile Pictures

  1. Changes
    - Create a storage bucket for user avatars
    - Set up RLS policies for secure access
    - Create helper functions for avatar management

  2. Security
    - Users can only upload to their own folder
    - Users can only update/delete their own avatars
    - Public read access for avatars of users with public profiles
*/

-- Create a storage bucket for avatars if it doesn't exist
BEGIN;

-- Check if the bucket already exists and create it if needed
INSERT INTO storage.buckets (id, name, public)
SELECT 'avatars', 'avatars', true
WHERE NOT EXISTS (
  SELECT 1 FROM storage.buckets WHERE name = 'avatars'
);

-- Set up RLS for the storage.objects table
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
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
        WHERE profiles.avatar_url LIKE '%' || storage.objects.name || '%'
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

COMMIT;

-- Add helpful comments
COMMENT ON POLICY "Avatar public read access" ON storage.objects IS 'Allows public access to avatars of users with public profiles';
COMMENT ON POLICY "Avatar upload access" ON storage.objects IS 'Allows users to upload avatars to their own folder';
COMMENT ON POLICY "Avatar update access" ON storage.objects IS 'Allows users to update their own avatars';
COMMENT ON POLICY "Avatar delete access" ON storage.objects IS 'Allows users to delete their own avatars';
COMMENT ON FUNCTION update_avatar_url(text) IS 'Updates a user''s avatar URL in their profile';
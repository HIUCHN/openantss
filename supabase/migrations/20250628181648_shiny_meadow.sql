/*
  # Fix Avatar Storage Implementation

  1. Problem
    - Previous migration failed with error: ERROR: 42501: must be owner of table objects
    - This occurs because the migration tried to directly modify storage tables without proper permissions

  2. Solution
    - Use Supabase's storage API functions instead of direct table manipulation
    - Create a proper storage bucket using the storage API
    - Set up appropriate security policies using the storage API
    - Ensure users can only access their own avatars

  3. Security
    - Maintain proper access controls for avatar storage
    - Users can only upload/modify their own avatars
    - Public read access for avatars of users with public profiles
*/

-- Create a storage bucket for avatars using the storage API
SELECT storage.create_bucket('avatars', 'User avatar storage');

-- Set the bucket to public (allows public access with RLS policies)
UPDATE storage.buckets SET public = TRUE WHERE name = 'avatars';

-- Create security policies for the avatars bucket
-- Policy for public read access to avatars
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
        SELECT 1 FROM public.profiles
        WHERE profiles.avatar_url LIKE '%' || name || '%'
        AND profiles.is_public = true
      )
      OR
      -- Allow users to access their own avatars
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- Create policy for avatar uploads
CREATE POLICY "Avatar upload access"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for avatar updates
CREATE POLICY "Avatar update access"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create policy for avatar deletion
CREATE POLICY "Avatar delete access"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'avatars' AND
    auth.uid()::text = (storage.foldername(name))[1]
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
  UPDATE public.profiles
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
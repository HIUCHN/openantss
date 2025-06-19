/*
  # Fix Newsfeed and Comments Visibility Issue

  1. Problem
    - Some users cannot see posts and comments from other users
    - The issue is with RLS policies that are too restrictive
    - Posts visibility depends on profiles.is_public but some profiles might not have this set correctly

  2. Solution
    - Ensure all profiles have is_public set to true by default
    - Update posts RLS policy to be more permissive for authenticated users
    - Ensure comments follow the same visibility rules as posts
    - Add debugging functions to help identify visibility issues

  3. Security
    - Maintain authentication requirement
    - Allow users to see their own content regardless of public setting
    - Make the app more social by default while maintaining user control
*/

-- First, ensure all existing profiles have is_public set to true if it's null
UPDATE profiles 
SET is_public = true 
WHERE is_public IS NULL;

-- Ensure the column has a proper default
ALTER TABLE profiles 
ALTER COLUMN is_public SET DEFAULT true;

-- Drop existing problematic policies for posts
DROP POLICY IF EXISTS "Users can view posts from public profiles" ON posts;
DROP POLICY IF EXISTS "Authenticated users can view posts" ON posts;

-- Create a more permissive policy for viewing posts
CREATE POLICY "Authenticated users can view most posts"
  ON posts
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing posts if:
    -- 1. Post author has public profile (default behavior)
    -- 2. Current user is the post author (always see own posts)
    -- 3. Post author exists and is authenticated (fallback for edge cases)
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = posts.author_id 
      AND (
        profiles.is_public = true 
        OR profiles.id = auth.uid()
      )
    )
    OR posts.author_id = auth.uid()
  );

-- Drop existing comment policies
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Universal comment visibility" ON comments;
DROP POLICY IF EXISTS "All users can view comments on accessible posts" ON comments;

-- Create a consistent policy for viewing comments that matches posts
CREATE POLICY "Authenticated users can view comments on accessible posts"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing comments if the post is accessible using the same logic as posts
    post_id IN (
      SELECT p.id 
      FROM posts p
      WHERE (
        EXISTS (
          SELECT 1 FROM profiles pr
          WHERE pr.id = p.author_id 
          AND (pr.is_public = true OR pr.id = auth.uid())
        )
        OR p.author_id = auth.uid()
      )
    )
    OR author_id = auth.uid()  -- Always see own comments
  );

-- Create a function to debug visibility issues
CREATE OR REPLACE FUNCTION debug_user_visibility(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  username text,
  is_public boolean,
  can_see_posts boolean,
  posts_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as user_id,
    p.username,
    p.is_public,
    (p.is_public = true OR p.id = auth.uid()) as can_see_posts,
    (SELECT COUNT(*) FROM posts WHERE author_id = p.id) as posts_count
  FROM profiles p
  WHERE p.id = target_user_id OR target_user_id IS NULL
  ORDER BY p.username;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_user_visibility(uuid) TO authenticated;

-- Create a function to check post visibility for debugging
CREATE OR REPLACE FUNCTION debug_post_visibility(target_post_id uuid DEFAULT NULL)
RETURNS TABLE (
  post_id uuid,
  author_username text,
  author_is_public boolean,
  content_preview text,
  can_current_user_see boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as post_id,
    pr.username as author_username,
    pr.is_public as author_is_public,
    LEFT(p.content, 50) || '...' as content_preview,
    (pr.is_public = true OR pr.id = auth.uid() OR p.author_id = auth.uid()) as can_current_user_see,
    p.created_at
  FROM posts p
  INNER JOIN profiles pr ON pr.id = p.author_id
  WHERE (target_post_id IS NULL OR p.id = target_post_id)
  ORDER BY p.created_at DESC
  LIMIT 20;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION debug_post_visibility(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON POLICY "Authenticated users can view most posts" ON posts IS 
'Allows authenticated users to view posts from public profiles and their own posts. More permissive to ensure social functionality works.';

COMMENT ON POLICY "Authenticated users can view comments on accessible posts" ON comments IS 
'Allows viewing comments on posts that the user can see, maintaining consistency with post visibility rules.';

COMMENT ON FUNCTION debug_user_visibility(uuid) IS 
'Debug function to check user visibility settings and post counts.';

COMMENT ON FUNCTION debug_post_visibility(uuid) IS 
'Debug function to check which posts are visible to the current user and why.';
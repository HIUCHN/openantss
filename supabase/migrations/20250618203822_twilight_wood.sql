/*
  # Fix Comments Visibility Issue

  1. Problem
    - Current RLS policy is too restrictive
    - Users can only see their own comments, not comments from others
    - This breaks the social aspect of the newsfeed

  2. Solution
    - Update the comments SELECT policy to allow viewing comments on any post the user can see
    - Ensure comments are visible to all users who can see the parent post
    - Maintain security by still checking post visibility permissions

  3. Security
    - Users can only see comments on posts they have permission to view
    - Users can still only create/edit/delete their own comments
    - No sensitive data exposure
*/

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view comments on posts they can see" ON comments;

-- Create a new, more permissive policy for viewing comments
CREATE POLICY "Users can view comments on visible posts"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing comments if the user can see the post
    EXISTS (
      SELECT 1 FROM posts 
      WHERE posts.id = comments.post_id
      AND (
        -- Post author has public profile OR user is the post author
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE profiles.id = posts.author_id 
          AND (profiles.is_public = true OR profiles.id = auth.uid())
        )
      )
    )
  );

-- Ensure the other comment policies remain unchanged
-- (These should already exist and work correctly)

-- Verify indexes exist for performance
CREATE INDEX IF NOT EXISTS idx_comments_post_author ON comments(post_id, author_id);
CREATE INDEX IF NOT EXISTS idx_comments_visibility ON comments(post_id) 
  WHERE post_id IN (
    SELECT posts.id FROM posts 
    JOIN profiles ON profiles.id = posts.author_id 
    WHERE profiles.is_public = true
  );
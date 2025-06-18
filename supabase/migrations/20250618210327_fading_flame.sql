/*
  # Fix Comments Visibility Issue

  1. Problem
    - Some users (test2, test3) can only see comments from test2
    - Only test1 can see all comments from other accounts
    - This indicates an issue with the RLS policy for comments

  2. Solution
    - Drop the existing restrictive policy
    - Create a simpler, more permissive policy
    - Ensure all authenticated users can see comments on public posts
    - Maintain security by still checking post visibility

  3. Security
    - Users can only see comments on posts they have permission to view
    - Private posts and their comments remain protected
    - No unauthorized access to sensitive data
*/

-- Drop the existing policy that's causing issues
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON comments;

-- Create a new, simplified policy for viewing comments
CREATE POLICY "Authenticated users can view comments on accessible posts"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing comments if the post exists and is accessible
    EXISTS (
      SELECT 1 FROM posts 
      JOIN profiles ON profiles.id = posts.author_id
      WHERE posts.id = comments.post_id 
      AND (
        -- Post is from a public profile OR user is viewing their own post
        profiles.is_public = true 
        OR posts.author_id = auth.uid()
      )
    )
  );

-- Ensure we have proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_post_visibility ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_posts_author_public ON posts(author_id) 
  WHERE author_id IN (
    SELECT id FROM profiles WHERE is_public = true
  );

-- Add a comment to document the policy
COMMENT ON POLICY "Authenticated users can view comments on accessible posts" ON comments IS 
'Allows authenticated users to view comments on posts from public profiles or their own posts';
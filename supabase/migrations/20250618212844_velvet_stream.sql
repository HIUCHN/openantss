/*
  # Fix Comments Visibility Policy

  1. Changes
    - Drop the existing restrictive comments policy
    - Create a new policy that allows all authenticated users to see comments on public posts
    - Ensure comments are visible to all users when the post author has a public profile

  2. Security
    - Maintains security by only showing comments on posts from public profiles
    - Users can still see their own comments regardless of post visibility
    - Users can see comments on their own posts regardless of their profile visibility
*/

-- Drop all existing comment viewing policies to start fresh
DROP POLICY IF EXISTS "View comments on public posts" ON comments;
DROP POLICY IF EXISTS "Authenticated users can view comments on accessible posts" ON comments;
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON comments;
DROP POLICY IF EXISTS "Users can view comments on posts they can see" ON comments;

-- Create a new, comprehensive policy for viewing comments
CREATE POLICY "All users can view comments on accessible posts"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing comments if ANY of these conditions are met:
    
    -- 1. The post is from a user with a public profile
    EXISTS (
      SELECT 1 
      FROM posts p
      JOIN profiles pr ON pr.id = p.author_id
      WHERE p.id = comments.post_id 
      AND pr.is_public = true
    )
    
    OR
    
    -- 2. The current user is the author of the post (can see comments on own posts)
    EXISTS (
      SELECT 1 
      FROM posts p
      WHERE p.id = comments.post_id 
      AND p.author_id = auth.uid()
    )
    
    OR
    
    -- 3. The current user is the author of the comment (can see own comments)
    author_id = auth.uid()
  );

-- Create optimized indexes for the new policy
CREATE INDEX IF NOT EXISTS idx_comments_policy_optimization ON comments(post_id, author_id);
CREATE INDEX IF NOT EXISTS idx_posts_public_author ON posts(id, author_id);

-- Add helpful documentation
COMMENT ON POLICY "All users can view comments on accessible posts" ON comments IS 
'Allows all authenticated users to view comments on posts from public profiles, their own posts, or their own comments. This ensures comments are visible to everyone when appropriate.';
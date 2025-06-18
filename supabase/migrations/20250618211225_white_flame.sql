/*
  # Fix Comment Visibility RLS Policy

  1. Problem
    - Current RLS policy for comments is too restrictive
    - Users can only see comments from certain accounts (test1 sees all, test2/test3 limited)
    - The policy logic needs to be simplified and fixed

  2. Solution
    - Drop the existing complex policy
    - Create a simple, clear policy that allows all authenticated users to see comments on public posts
    - Ensure the policy logic is straightforward and doesn't have edge cases

  3. Security
    - Maintain security by only showing comments on posts from public profiles
    - Users can always see comments on their own posts
    - Keep other comment policies (insert, update, delete) unchanged
*/

-- Drop the existing problematic policy
DROP POLICY IF EXISTS "Authenticated users can view comments on accessible posts" ON comments;
DROP POLICY IF EXISTS "Users can view comments on visible posts" ON comments;
DROP POLICY IF EXISTS "Users can view comments on posts they can see" ON comments;

-- Create a new, simplified policy for viewing comments
CREATE POLICY "View comments on public posts"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    -- Allow viewing comments if:
    -- 1. The post author has a public profile, OR
    -- 2. The current user is the post author, OR  
    -- 3. The current user is the comment author
    post_id IN (
      SELECT p.id 
      FROM posts p
      JOIN profiles pr ON pr.id = p.author_id
      WHERE pr.is_public = true
    )
    OR 
    post_id IN (
      SELECT p.id 
      FROM posts p
      WHERE p.author_id = auth.uid()
    )
    OR 
    author_id = auth.uid()
  );

-- Ensure we have the right indexes for performance
CREATE INDEX IF NOT EXISTS idx_comments_post_lookup ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_lookup ON comments(author_id);

-- Add helpful comment
COMMENT ON POLICY "View comments on public posts" ON comments IS 
'Allows users to see comments on public posts, their own posts, or their own comments';
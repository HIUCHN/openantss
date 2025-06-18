/*
  # Fix Index Subquery Error

  1. Changes
    - Remove the problematic index with subquery predicate
    - Create a simpler, more efficient index without subquery
    - Ensure comments visibility policy works correctly

  2. Performance
    - Add proper indexes for comment visibility queries
    - Optimize for common query patterns
*/

-- Drop the problematic index that uses a subquery in the WHERE clause
DROP INDEX IF EXISTS idx_posts_author_public;

-- Create a simpler index on posts.author_id for better performance
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);

-- Create an index on profiles.is_public for faster profile visibility checks
CREATE INDEX IF NOT EXISTS idx_profiles_is_public ON profiles(is_public) WHERE is_public = true;

-- Create a composite index for better comment visibility performance
CREATE INDEX IF NOT EXISTS idx_posts_author_public_composite ON posts(author_id, id);

-- Add comment to document the fix
COMMENT ON INDEX idx_posts_author_id IS 'Index for post author lookups - replaces problematic subquery index';
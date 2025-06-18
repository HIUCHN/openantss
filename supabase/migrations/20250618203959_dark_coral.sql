/*
  # Add Post Like/Unlike Functions

  1. Functions
    - `increment_post_likes` - Safely increment post likes count
    - `decrement_post_likes` - Safely decrement post likes count (with minimum 0)

  2. Security
    - Functions can only be called by authenticated users
    - Functions include proper error handling
    - Atomic operations to prevent race conditions
*/

-- Function to safely increment post likes
CREATE OR REPLACE FUNCTION increment_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts 
  SET likes_count = likes_count + 1,
      updated_at = now()
  WHERE id = post_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
END;
$$;

-- Function to safely decrement post likes
CREATE OR REPLACE FUNCTION decrement_post_likes(post_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE posts 
  SET likes_count = GREATEST(likes_count - 1, 0),
      updated_at = now()
  WHERE id = post_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Post not found';
  END IF;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION increment_post_likes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_post_likes(uuid) TO authenticated;
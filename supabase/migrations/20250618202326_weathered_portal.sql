/*
  # Create comments table for post comments

  1. New Tables
    - `comments`
      - `id` (uuid, primary key)
      - `post_id` (uuid, foreign key to posts)
      - `author_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `parent_comment_id` (uuid, nullable - for nested replies)
      - `likes_count` (integer)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `comments` table
    - Add policies for users to manage their own comments
    - Add policies for viewing comments on public posts

  3. Indexes
    - Add index on post_id for efficient comment loading
    - Add index on author_id for user's comments
    - Add index on parent_comment_id for nested replies
    - Add index on created_at for sorting
*/

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  likes_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create policies for comments
CREATE POLICY "Users can view comments on posts they can see"
  ON comments
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts 
      JOIN profiles ON profiles.id = posts.author_id
      WHERE posts.id = comments.post_id 
      AND (profiles.is_public = true OR profiles.id = auth.uid())
    )
  );

CREATE POLICY "Users can insert their own comments"
  ON comments
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Users can update their own comments"
  ON comments
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = author_id);

CREATE POLICY "Users can delete their own comments"
  ON comments
  FOR DELETE
  TO authenticated
  USING (auth.uid() = author_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to update post comment count when comments are added/removed
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Increment comment count
    UPDATE posts 
    SET comments_count = comments_count + 1,
        updated_at = now()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrement comment count (but don't go below 0)
    UPDATE posts 
    SET comments_count = GREATEST(comments_count - 1, 0),
        updated_at = now()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update post comment counts
CREATE TRIGGER trigger_update_post_comment_count_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

CREATE TRIGGER trigger_update_post_comment_count_delete
  AFTER DELETE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();
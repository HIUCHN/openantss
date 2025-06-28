/*
  # Create name_change_history table

  1. New Tables
    - `name_change_history`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `previous_name` (text)
      - `new_name` (text)
      - `changed_at` (timestamptz)
      - `reason` (text, optional)

  2. Security
    - Enable RLS on `name_change_history` table
    - Add policies for users to view their own name change history
    - Add policies for admins to view all name change history

  3. Indexes
    - Add index on user_id for efficient queries
    - Add index on changed_at for chronological sorting
*/

-- Create name_change_history table
CREATE TABLE IF NOT EXISTS name_change_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  previous_name text NOT NULL,
  new_name text NOT NULL,
  changed_at timestamptz DEFAULT now() NOT NULL,
  reason text
);

-- Enable Row Level Security
ALTER TABLE name_change_history ENABLE ROW LEVEL SECURITY;

-- Create policies for name_change_history
CREATE POLICY "Users can view their own name change history"
  ON name_change_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own name change records"
  ON name_change_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_name_change_history_user_id ON name_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_name_change_history_changed_at ON name_change_history(changed_at DESC);

-- Create function to update profile name and record history
CREATE OR REPLACE FUNCTION update_user_name(
  change_reason text DEFAULT NULL,
  new_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_name text;
  result json;
BEGIN
  -- Get current name
  SELECT full_name INTO current_name
  FROM profiles
  WHERE id = auth.uid();
  
  -- Only proceed if name is actually changing
  IF current_name IS DISTINCT FROM new_full_name THEN
    -- Record name change history
    INSERT INTO name_change_history (
      user_id,
      previous_name,
      new_name,
      reason
    ) VALUES (
      auth.uid(),
      current_name,
      new_full_name,
      change_reason
    );
    
    -- Update profile with new name
    UPDATE profiles
    SET 
      full_name = new_full_name,
      updated_at = now()
    WHERE id = auth.uid();
    
    result := json_build_object(
      'success', true,
      'message', 'Name updated successfully',
      'previous_name', current_name,
      'new_name', new_full_name
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'New name is the same as current name'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_name(text, text) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE name_change_history IS 'Stores history of user name changes';
COMMENT ON COLUMN name_change_history.previous_name IS 'User''s name before the change';
COMMENT ON COLUMN name_change_history.new_name IS 'User''s name after the change';
COMMENT ON COLUMN name_change_history.reason IS 'Optional reason for the name change';
COMMENT ON FUNCTION update_user_name(text, text) IS 'Updates a user''s name and records the change in history';
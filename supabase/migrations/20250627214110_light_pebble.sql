/*
  # Create messages table for user-to-user messaging

  1. New Tables
    - `messages`
      - `id` (uuid, primary key)
      - `sender_id` (uuid, foreign key to profiles)
      - `receiver_id` (uuid, foreign key to profiles)
      - `content` (text)
      - `is_read` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `messages` table
    - Add policies for users to send and receive messages
    - Users can only see messages they sent or received

  3. Indexes
    - Add index on sender_id and receiver_id for efficient queries
    - Add index on created_at for sorting
    - Add composite index for conversation queries
*/

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  receiver_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,
  CHECK (sender_id != receiver_id) -- Prevent self-messaging
);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = sender_id
    AND
    -- Ensure both users exist and receiver has public profile or is connected
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = receiver_id 
      AND (
        is_public = true 
        OR EXISTS (
          SELECT 1 FROM connections 
          WHERE (user1_id = auth.uid() AND user2_id = receiver_id)
             OR (user1_id = receiver_id AND user2_id = auth.uid())
        )
      )
    )
  );

CREATE POLICY "Users can update their received messages"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(sender_id, receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(receiver_id, is_read) WHERE is_read = false;

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create function to get conversations for a user
CREATE OR REPLACE FUNCTION get_user_conversations(user_id uuid)
RETURNS TABLE (
  conversation_partner_id uuid,
  conversation_partner_name text,
  conversation_partner_avatar text,
  conversation_partner_role text,
  last_message_content text,
  last_message_time timestamptz,
  unread_count bigint,
  is_online boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH latest_messages AS (
    SELECT 
      CASE 
        WHEN m.sender_id = user_id THEN m.receiver_id
        ELSE m.sender_id
      END as partner_id,
      m.content as last_content,
      m.created_at as last_time,
      ROW_NUMBER() OVER (
        PARTITION BY CASE 
          WHEN m.sender_id = user_id THEN m.receiver_id
          ELSE m.sender_id
        END 
        ORDER BY m.created_at DESC
      ) as rn
    FROM messages m
    WHERE m.sender_id = user_id OR m.receiver_id = user_id
  ),
  unread_counts AS (
    SELECT 
      m.sender_id as partner_id,
      COUNT(*) as unread_count
    FROM messages m
    WHERE m.receiver_id = user_id AND m.is_read = false
    GROUP BY m.sender_id
  )
  SELECT 
    p.id as conversation_partner_id,
    COALESCE(p.full_name, p.username) as conversation_partner_name,
    p.avatar_url as conversation_partner_avatar,
    COALESCE(p.role, 'Professional') as conversation_partner_role,
    lm.last_content as last_message_content,
    lm.last_time as last_message_time,
    COALESCE(uc.unread_count, 0) as unread_count,
    (p.last_location_update > now() - interval '5 minutes') as is_online
  FROM latest_messages lm
  INNER JOIN profiles p ON p.id = lm.partner_id
  LEFT JOIN unread_counts uc ON uc.partner_id = lm.partner_id
  WHERE lm.rn = 1
  ORDER BY lm.last_time DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_conversations(uuid) TO authenticated;

-- Create function to get messages between two users
CREATE OR REPLACE FUNCTION get_conversation_messages(user1_id uuid, user2_id uuid)
RETURNS TABLE (
  id uuid,
  sender_id uuid,
  receiver_id uuid,
  content text,
  is_read boolean,
  created_at timestamptz,
  sender_name text,
  sender_avatar text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify that the requesting user is one of the participants
  IF auth.uid() != user1_id AND auth.uid() != user2_id THEN
    RAISE EXCEPTION 'Access denied: You can only view your own conversations';
  END IF;

  RETURN QUERY
  SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.content,
    m.is_read,
    m.created_at,
    COALESCE(p.full_name, p.username) as sender_name,
    p.avatar_url as sender_avatar
  FROM messages m
  INNER JOIN profiles p ON p.id = m.sender_id
  WHERE (m.sender_id = user1_id AND m.receiver_id = user2_id)
     OR (m.sender_id = user2_id AND m.receiver_id = user1_id)
  ORDER BY m.created_at ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_conversation_messages(uuid, uuid) TO authenticated;

-- Add helpful comments
COMMENT ON TABLE messages IS 'Stores direct messages between users';
COMMENT ON COLUMN messages.is_read IS 'Whether the message has been read by the receiver';
COMMENT ON FUNCTION get_user_conversations(uuid) IS 'Gets all conversations for a user with latest message and unread count';
COMMENT ON FUNCTION get_conversation_messages(uuid, uuid) IS 'Gets all messages between two specific users';
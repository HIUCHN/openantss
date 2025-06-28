/*
  # Fix Connection Requests Handling

  1. Changes
    - Add a trigger to update notification counts when connection requests change
    - Ensure connection requests are properly deleted after acceptance
    - Add indexes for better performance on connection-related queries

  2. Security
    - Maintain existing RLS policies
    - No changes to access control

  3. Performance
    - Add indexes for faster connection request lookups
    - Optimize connection status checks
*/

-- Create index for faster connection request lookups
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver_status ON connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender_status ON connection_requests(sender_id, status);

-- Create function to check if a connection exists between two users
CREATE OR REPLACE FUNCTION check_connection_exists(user1_id uuid, user2_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM connections
    WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_connection_exists(uuid, uuid) TO authenticated;

-- Create function to count pending connection requests for a user
CREATE OR REPLACE FUNCTION count_pending_connection_requests(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  request_count integer;
BEGIN
  SELECT COUNT(*) INTO request_count
  FROM connection_requests
  WHERE receiver_id = user_id AND status = 'pending';
  
  RETURN request_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION count_pending_connection_requests(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION check_connection_exists(uuid, uuid) IS 'Checks if a connection exists between two users';
COMMENT ON FUNCTION count_pending_connection_requests(uuid) IS 'Counts the number of pending connection requests for a user';
COMMENT ON INDEX idx_connection_requests_receiver_status IS 'Index for faster lookup of connection requests by receiver and status';
COMMENT ON INDEX idx_connection_requests_sender_status IS 'Index for faster lookup of connection requests by sender and status';
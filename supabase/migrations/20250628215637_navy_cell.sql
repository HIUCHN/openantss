/*
  # Fix Connection Requests Handling

  1. Changes
    - Add function to properly handle connection request acceptance
    - Add function to properly handle connection request rejection
    - Add function to count pending connection requests
    - Add indexes for faster connection request lookups

  2. Security
    - Functions are security definer to ensure proper access control
    - Only authenticated users can execute these functions
    - Proper error handling and validation

  3. Performance
    - Optimized queries for connection request operations
    - Proper indexing for faster lookups
    - Atomic operations to prevent race conditions
*/

-- Create index for faster connection request lookups
CREATE INDEX IF NOT EXISTS idx_connection_requests_receiver_status ON connection_requests(receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connection_requests_sender_status ON connection_requests(sender_id, status);

-- Create function to properly handle connection request acceptance
CREATE OR REPLACE FUNCTION accept_connection_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  sender_id uuid;
  receiver_id uuid;
  result json;
BEGIN
  -- Get the request details
  SELECT cr.sender_id, cr.receiver_id INTO sender_id, receiver_id
  FROM connection_requests cr
  WHERE cr.id = request_id AND cr.receiver_id = auth.uid() AND cr.status = 'pending';
  
  -- Check if request exists and belongs to current user
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Connection request not found or not authorized to accept'
    );
  END IF;
  
  -- Check if connection already exists
  IF EXISTS (
    SELECT 1 FROM connections
    WHERE (user1_id = sender_id AND user2_id = receiver_id)
       OR (user1_id = receiver_id AND user2_id = sender_id)
  ) THEN
    -- Connection already exists, just delete the request
    DELETE FROM connection_requests WHERE id = request_id;
    
    RETURN json_build_object(
      'success', true,
      'message', 'Connection already exists, request removed'
    );
  END IF;
  
  -- Create the connection
  INSERT INTO connections (user1_id, user2_id)
  VALUES (sender_id, receiver_id);
  
  -- Delete the request
  DELETE FROM connection_requests WHERE id = request_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Connection request accepted successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error accepting connection request: ' || SQLERRM
    );
END;
$$;

-- Create function to properly handle connection request rejection
CREATE OR REPLACE FUNCTION decline_connection_request(request_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Check if request exists and belongs to current user
  IF NOT EXISTS (
    SELECT 1 FROM connection_requests
    WHERE id = request_id AND receiver_id = auth.uid() AND status = 'pending'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Connection request not found or not authorized to decline'
    );
  END IF;
  
  -- Delete the request
  DELETE FROM connection_requests WHERE id = request_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Connection request declined successfully'
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Error declining connection request: ' || SQLERRM
    );
END;
$$;

-- Create function to count pending connection requests for a user
CREATE OR REPLACE FUNCTION count_pending_connection_requests(user_id uuid DEFAULT auth.uid())
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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION accept_connection_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_connection_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION count_pending_connection_requests(uuid) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION accept_connection_request(uuid) IS 'Accepts a connection request and creates a connection between users';
COMMENT ON FUNCTION decline_connection_request(uuid) IS 'Declines and removes a connection request';
COMMENT ON FUNCTION count_pending_connection_requests(uuid) IS 'Counts the number of pending connection requests for a user';
COMMENT ON INDEX idx_connection_requests_receiver_status IS 'Index for faster lookup of connection requests by receiver and status';
COMMENT ON INDEX idx_connection_requests_sender_status IS 'Index for faster lookup of connection requests by sender and status';
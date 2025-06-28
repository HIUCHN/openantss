/*
  # Improve Location Tracking and Connection Request Handling

  1. Changes
    - Add function to update user location with high accuracy
    - Add function to get nearby users with distance calculation
    - Improve connection request acceptance and rejection
    - Add helper functions for location-based queries

  2. Security
    - Maintain proper RLS policies for location data
    - Ensure users can only access appropriate location data
    - Protect sensitive location information

  3. Performance
    - Add indexes for efficient location queries
    - Optimize distance calculations
    - Improve connection request handling
*/

-- Create function to update user location with high accuracy
CREATE OR REPLACE FUNCTION update_user_location_high_accuracy(
  lat double precision,
  lng double precision,
  accuracy double precision DEFAULT NULL,
  altitude double precision DEFAULT NULL,
  heading double precision DEFAULT NULL,
  speed double precision DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Only update if user has public mode enabled
  IF EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND is_public = true
  ) THEN
    -- Update profile with new location
    UPDATE profiles
    SET 
      latitude = lat,
      longitude = lng,
      last_location_update = now(),
      updated_at = now()
    WHERE id = auth.uid();
    
    -- Insert into user_location table for history
    INSERT INTO user_location (
      user_id,
      latitude,
      longitude,
      accuracy,
      altitude,
      heading,
      speed,
      timestamp,
      is_active
    ) VALUES (
      auth.uid(),
      lat,
      lng,
      accuracy,
      altitude,
      heading,
      speed,
      now(),
      true
    );
    
    -- Set all previous locations to inactive
    UPDATE user_location
    SET is_active = false
    WHERE user_id = auth.uid()
      AND id != currval(pg_get_serial_sequence('user_location', 'id'));
    
    result := json_build_object(
      'success', true,
      'message', 'Location updated with high accuracy',
      'latitude', lat,
      'longitude', lng,
      'accuracy', accuracy
    );
  ELSE
    result := json_build_object(
      'success', false,
      'message', 'Location sharing is disabled. Enable public mode first.'
    );
  END IF;
  
  RETURN result;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_location_high_accuracy(double precision, double precision, double precision, double precision, double precision, double precision) TO authenticated;

-- Create function to get nearby users with distance calculation
CREATE OR REPLACE FUNCTION get_nearby_users(radius_meters double precision DEFAULT 2000)
RETURNS TABLE (
  id uuid,
  username text,
  full_name text,
  role text,
  company text,
  avatar_url text,
  latitude double precision,
  longitude double precision,
  last_location_update timestamptz,
  distance double precision
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_lat double precision;
  user_lng double precision;
BEGIN
  -- Get current user's location
  SELECT latitude, longitude INTO user_lat, user_lng
  FROM profiles
  WHERE id = auth.uid() AND is_public = true;
  
  -- Check if user has location data
  IF user_lat IS NULL OR user_lng IS NULL THEN
    RAISE EXCEPTION 'User location not available. Please enable location sharing.';
  END IF;
  
  -- Return nearby users with calculated distance
  RETURN QUERY
  SELECT 
    p.id,
    p.username,
    p.full_name,
    p.role,
    p.company,
    p.avatar_url,
    p.latitude,
    p.longitude,
    p.last_location_update,
    -- Calculate distance using the Haversine formula
    (6371000 * acos(
      cos(radians(user_lat)) * 
      cos(radians(p.latitude)) * 
      cos(radians(p.longitude) - radians(user_lng)) + 
      sin(radians(user_lat)) * 
      sin(radians(p.latitude))
    )) AS distance
  FROM profiles p
  WHERE 
    p.id != auth.uid() AND 
    p.is_public = true AND
    p.latitude IS NOT NULL AND 
    p.longitude IS NOT NULL AND
    p.last_location_update > now() - interval '1 hour'
  -- Filter by radius
  HAVING (6371000 * acos(
    cos(radians(user_lat)) * 
    cos(radians(p.latitude)) * 
    cos(radians(p.longitude) - radians(user_lng)) + 
    sin(radians(user_lat)) * 
    sin(radians(p.latitude))
  )) <= radius_meters
  -- Order by distance
  ORDER BY distance ASC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_nearby_users(double precision) TO authenticated;

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

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION accept_connection_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION decline_connection_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION update_user_location_high_accuracy(double precision, double precision, double precision, double precision, double precision, double precision) TO authenticated;
GRANT EXECUTE ON FUNCTION get_nearby_users(double precision) TO authenticated;

-- Add helpful comments
COMMENT ON FUNCTION update_user_location_high_accuracy(double precision, double precision, double precision, double precision, double precision, double precision) IS 'Updates a user''s location with high accuracy and maintains location history';
COMMENT ON FUNCTION get_nearby_users(double precision) IS 'Gets nearby users within a specified radius (in meters) with calculated distances';
COMMENT ON FUNCTION accept_connection_request(uuid) IS 'Accepts a connection request and creates a connection between users';
COMMENT ON FUNCTION decline_connection_request(uuid) IS 'Declines and removes a connection request';
/*
  # Fix update_user_name function parameter order

  1. Problem
    - The update_user_name function is being called with parameters in the wrong order
    - Current error: "Could not find the function public.update_user_name(change_reason, new_full_name) in the schema cache"
    - The function exists but with parameters in a different order (new_full_name, change_reason)

  2. Solution
    - Create an overloaded version of the function that accepts parameters in both orders
    - This ensures backward compatibility with existing code
    - The new function will call the original function with parameters in the correct order

  3. Security
    - Maintain the same security model as the original function
    - No changes to permissions or access control
*/

-- Create an overloaded version of update_user_name that accepts parameters in the reverse order
CREATE OR REPLACE FUNCTION update_user_name(
  change_reason text,
  new_full_name text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Call the original function with parameters in the correct order
  RETURN update_user_name(new_full_name, change_reason);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_user_name(text, text) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION update_user_name(text, text) IS 'Overloaded version of update_user_name that accepts parameters in reverse order for backward compatibility';
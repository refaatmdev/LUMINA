-- Function to allow unauthenticated TVs to check if their pairing code has been registered
CREATE OR REPLACE FUNCTION get_screen_by_pairing_code(check_code TEXT)
RETURNS TABLE (id UUID, org_id UUID, name TEXT)
LANGUAGE plpgsql
SECURITY DEFINER -- Allows bypassing RLS
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.org_id, s.name
  FROM screens s
  WHERE s.pairing_code = check_code
  LIMIT 1;
END;
$$;

-- Grant execute permission to anon (public) role
GRANT EXECUTE ON FUNCTION get_screen_by_pairing_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_screen_by_pairing_code(TEXT) TO authenticated;

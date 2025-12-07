-- Add last_ping column to screens table
ALTER TABLE screens ADD COLUMN IF NOT EXISTS last_ping TIMESTAMP WITH TIME ZONE;

-- Create a function to handle screen heartbeats
-- This function is SECURITY DEFINER to allow unauthenticated players (who know their ID) to ping
CREATE OR REPLACE FUNCTION ping_screen(screen_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE screens
    SET 
        last_ping = NOW(),
        status = 'online'
    WHERE id = screen_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to public (anon) since players are unauthenticated
GRANT EXECUTE ON FUNCTION ping_screen(UUID) TO anon;
GRANT EXECUTE ON FUNCTION ping_screen(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION ping_screen(UUID) TO service_role;

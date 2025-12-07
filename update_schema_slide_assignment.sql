-- Migration: Slide Assignment & Screen Groups

-- 1. Create screen_groups table
CREATE TABLE IF NOT EXISTS screen_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    active_slide_id UUID REFERENCES slides(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Update screens table
ALTER TABLE screens 
ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES screen_groups(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS active_slide_id UUID REFERENCES slides(id) ON DELETE SET NULL;

-- 3. Enable RLS for screen_groups
ALTER TABLE screen_groups ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for screen_groups

-- View: Users can view groups in their organization
CREATE POLICY "Users can view screen groups in their organization" ON screen_groups
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE profiles.id = auth.uid()
    ));

-- Insert: Users can insert groups in their organization
CREATE POLICY "Users can insert screen groups in their organization" ON screen_groups
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM profiles WHERE profiles.id = auth.uid()
    ));

-- Update: Users can update groups in their organization
CREATE POLICY "Users can update screen groups in their organization" ON screen_groups
    FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE profiles.id = auth.uid()
    ));

-- Delete: Users can delete groups in their organization
CREATE POLICY "Users can delete screen groups in their organization" ON screen_groups
    FOR DELETE
    USING (org_id IN (
        SELECT org_id FROM profiles WHERE profiles.id = auth.uid()
    ));

-- 5. Update get_screen_by_pairing_code function to include group info if needed
-- (Optional, but good for future proofing if we want to show group name on TV)
DROP FUNCTION IF EXISTS get_screen_by_pairing_code(TEXT);

CREATE OR REPLACE FUNCTION get_screen_by_pairing_code(check_code TEXT)
RETURNS TABLE (id UUID, org_id UUID, name TEXT, group_id UUID, active_slide_id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT s.id, s.org_id, s.name, s.group_id, s.active_slide_id
  FROM screens s
  WHERE s.pairing_code = check_code
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION get_screen_by_pairing_code(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_screen_by_pairing_code(TEXT) TO authenticated;

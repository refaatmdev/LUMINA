-- Migration: Multi-tenancy & User Management

-- 1. Update Organizations Table
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('active', 'suspended')) DEFAULT 'active';

-- 2. Rename Users to Profiles and Update Columns
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    ALTER TABLE users RENAME TO profiles;
  END IF;
END $$;

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS full_name TEXT;

-- Drop the old constraint FIRST so we can update the values
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS users_role_check;

-- Update existing data to match new roles
UPDATE profiles SET role = 'org_admin' WHERE role = 'admin';

-- Add the new constraint
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check; -- Drop if it partially succeeded
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('super_admin', 'org_admin', 'editor'));

-- 3. Trigger to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, org_id)
  VALUES (
    new.id, 
    new.email, 
    'org_admin', -- Default role, can be changed later
    (SELECT id FROM organizations LIMIT 1) -- Temporary: assign to first org or handle org creation separately
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. RLS Policies

-- Helper function to get current profile (SECURITY DEFINER to bypass RLS)
CREATE OR REPLACE FUNCTION get_my_profile()
RETURNS TABLE (id UUID, org_id UUID, role TEXT)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT id, org_id, role FROM profiles WHERE id = auth.uid();
$$;

-- Enable RLS (already enabled, but good to ensure)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;
DROP POLICY IF EXISTS "Users can view members of their own organization" ON profiles; -- was users
DROP POLICY IF EXISTS "Users can view their own user record" ON profiles; -- was users

-- Organizations Policies
CREATE POLICY "Super Admin: Full Access Organizations" ON organizations
    FOR ALL
    USING ( (SELECT role FROM get_my_profile()) = 'super_admin' );

CREATE POLICY "Org Admin & Editor: View Own Organization" ON organizations
    FOR SELECT
    USING ( id = (SELECT org_id FROM get_my_profile()) );

-- Profiles Policies
CREATE POLICY "Super Admin: Full Access Profiles" ON profiles
    FOR ALL
    USING ( (SELECT role FROM get_my_profile()) = 'super_admin' );

CREATE POLICY "Org Admin: View/Edit Own Org Profiles" ON profiles
    FOR ALL
    USING ( org_id = (SELECT org_id FROM get_my_profile()) AND (SELECT role FROM get_my_profile()) = 'org_admin' );

CREATE POLICY "Editor: View Own Profile" ON profiles
    FOR SELECT
    USING ( id = auth.uid() );

-- Update other tables (Screens, Slides) to use get_my_profile() or similar logic if needed, 
-- but they rely on org_id which is consistent. 
-- We just need to ensure they reference 'profiles' if they have foreign keys to it (they reference auth.users usually or organizations).
-- Screens and Slides reference organizations(id), so that's fine.
-- Their RLS policies currently use `get_auth_user_org_id()` which queries `users`.
-- We need to update `get_auth_user_org_id` to query `profiles`.

CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT org_id FROM profiles WHERE id = auth.uid();
$$;

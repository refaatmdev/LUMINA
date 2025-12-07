-- Fix infinite recursion in RLS policies by using a SECURITY DEFINER function

-- 1. Create a secure function to get the current user's org_id
-- This function runs with the privileges of the creator (admin), bypassing RLS
CREATE OR REPLACE FUNCTION get_auth_user_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT org_id FROM users WHERE id = auth.uid();
$$;

-- 2. Drop the problematic policies that were causing recursion
DROP POLICY IF EXISTS "Users can view members of their own organization" ON users;
DROP POLICY IF EXISTS "Users can view their own organization" ON organizations;

-- Drop dependent policies on other tables to update them to use the new function (cleaner/more performant)
DROP POLICY IF EXISTS "Users can view screens in their organization" ON screens;
DROP POLICY IF EXISTS "Users can insert screens in their organization" ON screens;
DROP POLICY IF EXISTS "Users can update screens in their organization" ON screens;
DROP POLICY IF EXISTS "Users can delete screens in their organization" ON screens;

DROP POLICY IF EXISTS "Users can view slides in their organization" ON slides;
DROP POLICY IF EXISTS "Users can insert slides in their organization" ON slides;
DROP POLICY IF EXISTS "Users can update slides in their organization" ON slides;
DROP POLICY IF EXISTS "Users can delete slides in their organization" ON slides;

-- 3. Re-create policies using the helper function

-- Users: Use the function to check org_id without triggering RLS recursion
CREATE POLICY "Users can view members of their own organization" ON users
    FOR SELECT
    USING (org_id = get_auth_user_org_id());

-- Organizations
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT
    USING (id = get_auth_user_org_id());

-- Screens
CREATE POLICY "Users can view screens in their organization" ON screens
    FOR SELECT
    USING (org_id = get_auth_user_org_id());

CREATE POLICY "Users can insert screens in their organization" ON screens
    FOR INSERT
    WITH CHECK (org_id = get_auth_user_org_id());

CREATE POLICY "Users can update screens in their organization" ON screens
    FOR UPDATE
    USING (org_id = get_auth_user_org_id());

CREATE POLICY "Users can delete screens in their organization" ON screens
    FOR DELETE
    USING (org_id = get_auth_user_org_id());

-- Slides
CREATE POLICY "Users can view slides in their organization" ON slides
    FOR SELECT
    USING (org_id = get_auth_user_org_id());

CREATE POLICY "Users can insert slides in their organization" ON slides
    FOR INSERT
    WITH CHECK (org_id = get_auth_user_org_id());

CREATE POLICY "Users can update slides in their organization" ON slides
    FOR UPDATE
    USING (org_id = get_auth_user_org_id());

CREATE POLICY "Users can delete slides in their organization" ON slides
    FOR DELETE
    USING (org_id = get_auth_user_org_id());

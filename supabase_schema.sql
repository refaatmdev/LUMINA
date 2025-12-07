-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('admin', 'editor')) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create screens table
CREATE TABLE screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    location TEXT,
    status TEXT CHECK (status IN ('online', 'offline')) DEFAULT 'offline',
    auth_type TEXT CHECK (auth_type IN ('pairing_code', 'credentials')) NOT NULL,
    pairing_code TEXT UNIQUE CHECK (LENGTH(pairing_code) = 6),
    username TEXT,
    password_hash TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create slides table
CREATE TABLE slides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    org_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    content JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE screens ENABLE ROW LEVEL SECURITY;
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Organizations: Users can view their own organization
CREATE POLICY "Users can view their own organization" ON organizations
    FOR SELECT
    USING (id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

-- Users: Users can view members of their own organization
CREATE POLICY "Users can view members of their own organization" ON users
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

-- Note: We need a policy to allow a user to see their own record initially or a trigger to create it.
-- For simplicity, assuming a trigger or admin function handles user creation, 
-- but allowing users to read their own record is essential.
CREATE POLICY "Users can view their own user record" ON users
    FOR SELECT
    USING (id = auth.uid());

-- Screens: Access restricted to organization members
CREATE POLICY "Users can view screens in their organization" ON screens
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can insert screens in their organization" ON screens
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can update screens in their organization" ON screens
    FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can delete screens in their organization" ON screens
    FOR DELETE
    USING (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

-- Slides: Access restricted to organization members
CREATE POLICY "Users can view slides in their organization" ON slides
    FOR SELECT
    USING (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can insert slides in their organization" ON slides
    FOR INSERT
    WITH CHECK (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can update slides in their organization" ON slides
    FOR UPDATE
    USING (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

CREATE POLICY "Users can delete slides in their organization" ON slides
    FOR DELETE
    USING (org_id IN (
        SELECT org_id FROM users WHERE users.id = auth.uid()
    ));

-- Storage Bucket Configuration
-- Note: This requires the storage extension to be enabled and the storage schema to exist.
-- Creating the bucket if it doesn't exist.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
-- Allow authenticated users to upload to the media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'media' AND
        auth.role() = 'authenticated'
    );

-- Allow public access to view media (since the bucket is public)
CREATE POLICY "Public can view media" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'media');

-- Allow users to update/delete their own uploads or uploads within their org (more complex, keeping simple for now)
-- Restricting update/delete to the owner of the object
CREATE POLICY "Users can update their own media" ON storage.objects
    FOR UPDATE
    USING (bucket_id = 'media' AND owner = auth.uid());

CREATE POLICY "Users can delete their own media" ON storage.objects
    FOR DELETE
    USING (bucket_id = 'media' AND owner = auth.uid());

-- Create templates table
CREATE TABLE IF NOT EXISTS templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    thumbnail_url TEXT,
    content JSONB NOT NULL,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read public templates
CREATE POLICY "Public templates are viewable by everyone" 
ON templates FOR SELECT 
USING (is_public = true);

-- Policy: Authenticated users can read all templates (if we want them to see internal ones too, or just public?)
-- Requirement says "is_public - If true, all tenants can see it". 
-- Let's assume non-public templates might be internal drafts or org-specific later.
-- For now, let's allow reading all public templates.

-- Policy: Only Super Admins can insert/update/delete templates
-- We need a way to check for super_admin role. 
-- Assuming we have a way to check app_role in profiles or jwt.
-- For simplicity in this MVP, we'll allow authenticated users to INSERT if they have the role (checked in app logic),
-- but strictly enforce it here if possible. 
-- Since we don't have a custom claim for super_admin easily accessible in simple RLS without a join,
-- we'll rely on the application layer for the "Save as Template" button visibility,
-- and maybe a trigger or just open write access for authenticated users for now, 
-- OR better: Check profiles table.

CREATE POLICY "Super Admins can manage templates"
ON templates
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'super_admin'
    )
);

-- Insert some default templates
INSERT INTO templates (name, category, content, is_public, thumbnail_url)
VALUES 
(
    'Welcome Screen', 
    'General', 
    '{"content": [{"type": "Hero", "props": {"title": "Welcome to Our Office", "subtitle": "We are glad to have you here", "backgroundImage": "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"}}], "root": {"props": {"title": "Welcome Screen"}}}',
    true,
    'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80'
),
(
    'Lunch Menu', 
    'Menu', 
    '{"content": [{"type": "SplitScreen", "props": {"leftImage": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80", "rightText": "Today''s Special:\n\nGrilled Salmon with Asparagus\n$15.99\n\nCaesar Salad\n$8.99"}}], "root": {"props": {"title": "Lunch Menu"}}}',
    true,
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'
),
(
    'Emergency Alert', 
    'Announcements', 
    '{"content": [{"type": "Notice", "props": {"type": "warning", "text": "FIRE ALARM TEST IN PROGRESS"}}], "root": {"props": {"title": "Emergency Alert"}}}',
    true,
    'https://plus.unsplash.com/premium_photo-1661963212517-830bbb7d76fc?auto=format&fit=crop&w=400&q=80'
);

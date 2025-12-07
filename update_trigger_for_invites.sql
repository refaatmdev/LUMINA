-- Update the handle_new_user function to respect metadata from invites
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  assigned_org_id UUID;
  assigned_role TEXT;
  assigned_full_name TEXT;
BEGIN
  -- Extract values from raw_user_meta_data
  -- These are passed when using supabase.auth.admin.inviteUserByEmail(email, { data: { org_id: '...', role: '...' } })
  assigned_org_id := (new.raw_user_meta_data->>'org_id')::UUID;
  assigned_role := new.raw_user_meta_data->>'role';
  assigned_full_name := new.raw_user_meta_data->>'full_name';

  -- Fallback logic for self-signup (if no metadata provided)
  IF assigned_org_id IS NULL THEN
     -- OPTION 1: Create a new organization for the user (Self-Serve SaaS model)
     INSERT INTO organizations (name, status) 
     VALUES (COALESCE(assigned_full_name, new.email) || '''s Organization', 'active') 
     RETURNING id INTO assigned_org_id;
     
     assigned_role := 'org_admin';
  END IF;

  -- Default role if still null
  IF assigned_role IS NULL THEN
     assigned_role := 'org_admin';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, org_id)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(assigned_full_name, ''),
    assigned_role, 
    assigned_org_id
  );
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

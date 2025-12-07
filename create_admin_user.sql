-- Script to create an Admin User and Organization
-- Run this in the Supabase SQL Editor

-- Enable pgcrypto for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
  new_org_id UUID;
  new_user_id UUID;
  user_email TEXT := 'admin@lumina.com';
  user_password TEXT := 'password123';
BEGIN
  -- 1. Create Organization
  INSERT INTO public.organizations (name)
  VALUES ('Lumina HQ')
  RETURNING id INTO new_org_id;

  -- 2. Create Auth User
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  )
  VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    user_email,
    crypt(user_password, gen_salt('bf')),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  )
  RETURNING id INTO new_user_id;

  -- 3. Create Public User linked to Org and Auth User
  INSERT INTO public.users (id, org_id, role)
  VALUES (new_user_id, new_org_id, 'admin');

  -- 4. Create Identity (Required for some auth flows)
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id::text, user_email)::jsonb,
    'email',
    new_user_id::text,
    NOW(),
    NOW(),
    NOW()
  );
  
  RAISE NOTICE 'Admin user created: % (Password: %)', user_email, user_password;
END $$;

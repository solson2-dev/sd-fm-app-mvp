-- Create default user (for full schema that requires owner_id)
-- Note: This is a workaround for MVP. In production, users come from Supabase Auth

-- First, check if auth.users exists (Supabase schema)
-- If it doesn't, we'll create a simple workaround

-- Create a default user in auth.users if needed
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  aud,
  role
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'admin@studiodatum.com',
  crypt('temp_password_change_me', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Default Admin"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Create default organization
INSERT INTO organizations (
  id,
  name,
  slug,
  owner_id,
  created_at,
  updated_at
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'StudioDatum',
  'studiodatum',
  'a0000000-0000-0000-0000-000000000001'::uuid,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create default scenario
INSERT INTO scenarios (
  id,
  organization_id,
  created_by,
  name,
  type,
  description,
  created_at,
  updated_at
)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Base Case',
  'base',
  'MVP test scenario with validated calculations',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify the records were created
SELECT 'Organizations:' as table_name, count(*) as count FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Scenarios:', count(*) FROM scenarios WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid;

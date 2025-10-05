-- Minimal initialization - discover and create required records
-- Run this in Supabase SQL Editor

-- First, let's see what the users table structure is
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users';

-- Try creating user with minimal fields (adjust based on actual schema)
INSERT INTO users (
  id,
  email,
  created_at,
  updated_at
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@studiodatum.com',
  NOW(),
  NOW()
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
  'MVP test scenario',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Results:' as status;
SELECT 'User exists:', count(*) FROM users WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;
SELECT 'Org exists:', count(*) FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;
SELECT 'Scenario exists:', count(*) FROM scenarios WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid;

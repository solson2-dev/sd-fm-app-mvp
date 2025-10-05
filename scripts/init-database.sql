-- Initialize database for MVP
-- This handles the full schema that requires users table

-- Step 1: Create a default user in the users table (not auth.users)
INSERT INTO users (
  id,
  email,
  name,
  created_at,
  updated_at
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@studiodatum.com',
  'Default Admin',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create default organization
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

-- Step 3: Create default scenario
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

-- Verify everything was created
SELECT 'User created:' as status, email, name FROM users WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Organization created:', name, slug FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid
UNION ALL
SELECT 'Scenario created:', name, type FROM scenarios WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid;

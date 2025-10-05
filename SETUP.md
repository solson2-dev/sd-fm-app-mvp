# Setup Instructions

## Database Initialization

The Supabase database needs a default organization and scenario. Run this SQL in the Supabase SQL Editor:

https://supabase.com/dashboard/project/hfghrfftjqzjsssrhmlq/sql/new

```sql
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
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as owner, or create one
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

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
  (SELECT id FROM auth.users LIMIT 1), -- Use first user as creator
  'Base Case',
  'base',
  'MVP test scenario with validated calculations',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Verify
SELECT 'Organization created:', name FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001'::uuid;
SELECT 'Scenario created:', name FROM scenarios WHERE id = 'b0000000-0000-0000-0000-000000000001'::uuid;
```

## Alternative: If No Users Exist

If you don't have any users in auth.users yet, create a dummy one first:

```sql
-- Create a test user (only for development!)
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
  crypt('temp_password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"name":"Default Admin"}'::jsonb,
  'authenticated',
  'authenticated'
)
ON CONFLICT (id) DO NOTHING;

-- Then run the organization and scenario inserts above
```

## After Running SQL

1. Refresh the app at http://localhost:3001
2. Go to `/personnel`
3. The default 8 roles should load
4. Make changes and click "Save & Calculate"
5. Go to `/dashboard` to see the OPEX projections

## Troubleshooting

If you still get errors:

1. Check the server logs: The dev server shows errors in terminal
2. Verify scenario exists: Run `curl http://localhost:3001/api/init`
3. Check Supabase console: https://supabase.com/dashboard/project/hfghrfftjqzjsssrhmlq

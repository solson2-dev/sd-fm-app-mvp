-- Initialize base scenario and organization
-- Run this with: PGPASSWORD="PositiveStudio2025!" psql -h db.hfghrfftjqzjsssrhmlq.supabase.co -U postgres -d postgres -f scripts/init-base-scenario.sql

-- Insert base organization (if not exists)
INSERT INTO organizations (id, name, created_at, updated_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Default Organization',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert base scenario (if not exists)
INSERT INTO scenarios (id, organization_id, name, description, created_by, created_at, updated_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Base Case',
  'Default scenario for MVP',
  '30099033-b36b-4f7f-aaa8-6dc26b98f799',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Verify
SELECT 'Organizations:' as info;
SELECT id, name FROM organizations WHERE id = 'a0000000-0000-0000-0000-000000000001';

SELECT 'Scenarios:' as info;
SELECT id, name, organization_id FROM scenarios WHERE id = 'b0000000-0000-0000-0000-000000000001';

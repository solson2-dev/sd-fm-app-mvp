-- Seed script for MVP
-- Creates default organization and scenario for testing

-- Create default organization with fixed UUID
INSERT INTO organizations (id, name, slug, created_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'StudioDatum',
  'studiodatum',
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Create default scenario with fixed UUID
INSERT INTO scenarios (id, organization_id, name, type, description, created_at, updated_at)
VALUES (
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Base Case',
  'base',
  'MVP test scenario with validated calculations',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

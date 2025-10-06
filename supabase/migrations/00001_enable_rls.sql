-- Migration: Enable Row Level Security (RLS)
-- Purpose: Implement multi-tenant data isolation
-- Critical Security Fix: Prevents users from accessing other organizations' data
-- Created: 2025-10-06

-- ============================================================================
-- STEP 1: Create user_organizations junction table
-- ============================================================================
-- This table links users to organizations and defines their roles

CREATE TABLE IF NOT EXISTS user_organizations (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'editor', 'viewer', 'member')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, organization_id)
);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_organizations_updated_at BEFORE UPDATE ON user_organizations
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- STEP 2: Enable RLS on all tables
-- ============================================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_opex_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_projections ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE assumptions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 3: Create RLS Policies for ORGANIZATIONS table
-- ============================================================================

-- Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
ON organizations FOR SELECT
USING (
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users with owner/admin role can insert organizations
CREATE POLICY "Admins can insert organizations"
ON organizations FOR INSERT
WITH CHECK (
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Users with owner/admin role can update their organizations
CREATE POLICY "Admins can update their organizations"
ON organizations FOR UPDATE
USING (
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- Only owners can delete organizations
CREATE POLICY "Owners can delete their organizations"
ON organizations FOR DELETE
USING (
  id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role = 'owner'
  )
);

-- ============================================================================
-- STEP 4: Create RLS Policies for SCENARIOS table
-- ============================================================================

-- Users can view scenarios for their organizations
CREATE POLICY "Users can view their organization's scenarios"
ON scenarios FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- Users with editor+ role can insert scenarios
CREATE POLICY "Editors can insert scenarios"
ON scenarios FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can update scenarios
CREATE POLICY "Editors can update scenarios"
ON scenarios FOR UPDATE
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with admin+ role can delete scenarios
CREATE POLICY "Admins can delete scenarios"
ON scenarios FOR DELETE
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
  )
);

-- ============================================================================
-- STEP 5: Create RLS Policies for PERSONNEL_ROLES table
-- ============================================================================

-- Users can view personnel roles for scenarios in their organizations
CREATE POLICY "Users can view personnel roles for their scenarios"
ON personnel_roles FOR SELECT
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users with editor+ role can insert personnel roles
CREATE POLICY "Editors can insert personnel roles"
ON personnel_roles FOR INSERT
WITH CHECK (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can update personnel roles
CREATE POLICY "Editors can update personnel roles"
ON personnel_roles FOR UPDATE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can delete personnel roles
CREATE POLICY "Editors can delete personnel roles"
ON personnel_roles FOR DELETE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- ============================================================================
-- STEP 6: Create RLS Policies for MONTHLY_OPEX_PROJECTIONS table
-- ============================================================================

-- Users can view OPEX projections for scenarios in their organizations
CREATE POLICY "Users can view OPEX projections for their scenarios"
ON monthly_opex_projections FOR SELECT
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users with editor+ role can insert OPEX projections
CREATE POLICY "Editors can insert OPEX projections"
ON monthly_opex_projections FOR INSERT
WITH CHECK (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can update OPEX projections
CREATE POLICY "Editors can update OPEX projections"
ON monthly_opex_projections FOR UPDATE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can delete OPEX projections
CREATE POLICY "Editors can delete OPEX projections"
ON monthly_opex_projections FOR DELETE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- ============================================================================
-- STEP 7: Create RLS Policies for ANNUAL_PROJECTIONS table
-- ============================================================================

-- Users can view annual projections for scenarios in their organizations
CREATE POLICY "Users can view annual projections for their scenarios"
ON annual_projections FOR SELECT
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users with editor+ role can insert annual projections
CREATE POLICY "Editors can insert annual projections"
ON annual_projections FOR INSERT
WITH CHECK (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can update annual projections
CREATE POLICY "Editors can update annual projections"
ON annual_projections FOR UPDATE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can delete annual projections
CREATE POLICY "Editors can delete annual projections"
ON annual_projections FOR DELETE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- ============================================================================
-- STEP 8: Create RLS Policies for FUNDING_ROUNDS table
-- ============================================================================

-- Users can view funding rounds for scenarios in their organizations
CREATE POLICY "Users can view funding rounds for their scenarios"
ON funding_rounds FOR SELECT
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users with editor+ role can insert funding rounds
CREATE POLICY "Editors can insert funding rounds"
ON funding_rounds FOR INSERT
WITH CHECK (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can update funding rounds
CREATE POLICY "Editors can update funding rounds"
ON funding_rounds FOR UPDATE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can delete funding rounds
CREATE POLICY "Editors can delete funding rounds"
ON funding_rounds FOR DELETE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- ============================================================================
-- STEP 9: Create RLS Policies for ASSUMPTIONS table
-- ============================================================================

-- Users can view assumptions for scenarios in their organizations
CREATE POLICY "Users can view assumptions for their scenarios"
ON assumptions FOR SELECT
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
  )
);

-- Users with editor+ role can insert assumptions
CREATE POLICY "Editors can insert assumptions"
ON assumptions FOR INSERT
WITH CHECK (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can update assumptions
CREATE POLICY "Editors can update assumptions"
ON assumptions FOR UPDATE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Users with editor+ role can delete assumptions
CREATE POLICY "Editors can delete assumptions"
ON assumptions FOR DELETE
USING (
  scenario_id IN (
    SELECT s.id
    FROM scenarios s
    JOIN user_organizations uo ON s.organization_id = uo.organization_id
    WHERE uo.user_id = auth.uid()
    AND uo.role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to verify RLS is working:

-- 1. Check RLS is enabled on all tables:
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
-- AND tablename IN ('organizations', 'scenarios', 'personnel_roles', 'monthly_opex_projections',
--                   'annual_projections', 'funding_rounds', 'assumptions');

-- 2. List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- 3. Test with a specific user (replace USER_UUID):
-- SET ROLE authenticated;
-- SET request.jwt.claim.sub = 'USER_UUID';
-- SELECT * FROM scenarios; -- Should only see scenarios for user's organizations

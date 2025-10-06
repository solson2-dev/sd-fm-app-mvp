-- Migration: Fix column name references and add missing indexes
-- Created: 2025-10-06
-- Purpose: Align index definitions with actual schema column names

-- Drop any indexes that may have been created with wrong column names
DROP INDEX IF EXISTS idx_annual_projections_scenario_year;
DROP INDEX IF EXISTS idx_annual_projections_scenario_fiscal_year_old;

-- Create the correct composite index for annual projections
-- Using fiscal_year since that's the calendar year column
CREATE INDEX IF NOT EXISTS idx_annual_projections_scenario_fiscal_year
ON annual_projections(scenario_id, fiscal_year);

-- Add index for year_number as well since it's used in queries
CREATE INDEX IF NOT EXISTS idx_annual_projections_scenario_year_number
ON annual_projections(scenario_id, year_number);

-- Verify all critical indexes exist
CREATE INDEX IF NOT EXISTS idx_scenarios_organization_id ON scenarios(organization_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_created_at ON scenarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_annual_projections_scenario_id ON annual_projections(scenario_id);
CREATE INDEX IF NOT EXISTS idx_annual_projections_organization_id ON annual_projections(organization_id);
CREATE INDEX IF NOT EXISTS idx_monthly_opex_scenario_id ON monthly_opex_projections(scenario_id);
CREATE INDEX IF NOT EXISTS idx_monthly_opex_month ON monthly_opex_projections(scenario_id, month);
CREATE INDEX IF NOT EXISTS idx_personnel_roles_scenario_id ON personnel_roles(scenario_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_scenario_id ON funding_rounds(scenario_id);
CREATE INDEX IF NOT EXISTS idx_funding_rounds_close_date ON funding_rounds(scenario_id, close_date);
CREATE INDEX IF NOT EXISTS idx_assumptions_scenario_id ON assumptions(scenario_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_user_id ON user_organizations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_organizations_organization_id ON user_organizations(organization_id);

-- Comment to document schema
COMMENT ON COLUMN annual_projections.fiscal_year IS 'Calendar year (e.g., 2025, 2026)';
COMMENT ON COLUMN annual_projections.year_number IS 'Sequential year number from model start (1, 2, 3, etc.)';

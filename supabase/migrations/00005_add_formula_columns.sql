-- Migration: Add Formula Storage Columns
-- Purpose: Enable formula preservation for Excel imports
-- Created: 2025-10-06

-- ============================================================================
-- Add Formula Columns to annual_projections
-- ============================================================================

-- Store formulas for calculated revenue fields
ALTER TABLE annual_projections
ADD COLUMN IF NOT EXISTS arr_formula TEXT,
ADD COLUMN IF NOT EXISTS customers_formula TEXT,
ADD COLUMN IF NOT EXISTS setup_fees_formula TEXT,
ADD COLUMN IF NOT EXISTS total_revenue_formula TEXT,
ADD COLUMN IF NOT EXISTS ending_customers_formula TEXT;

-- Add comments for documentation
COMMENT ON COLUMN annual_projections.arr_formula IS 'Excel formula used to calculate ARR';
COMMENT ON COLUMN annual_projections.customers_formula IS 'Excel formula used to calculate customers';
COMMENT ON COLUMN annual_projections.setup_fees_formula IS 'Excel formula used to calculate setup fees';
COMMENT ON COLUMN annual_projections.total_revenue_formula IS 'Excel formula used to calculate total revenue';
COMMENT ON COLUMN annual_projections.ending_customers_formula IS 'Excel formula used to calculate ending customers';

-- ============================================================================
-- Add Formula Columns to monthly_opex_projections
-- ============================================================================

-- Store formulas for calculated OPEX fields
ALTER TABLE monthly_opex_projections
ADD COLUMN IF NOT EXISTS personnel_cost_formula TEXT,
ADD COLUMN IF NOT EXISTS headcount_formula TEXT,
ADD COLUMN IF NOT EXISTS marketing_formula TEXT,
ADD COLUMN IF NOT EXISTS sales_formula TEXT,
ADD COLUMN IF NOT EXISTS infrastructure_formula TEXT,
ADD COLUMN IF NOT EXISTS facilities_formula TEXT,
ADD COLUMN IF NOT EXISTS professional_services_formula TEXT,
ADD COLUMN IF NOT EXISTS other_formula TEXT,
ADD COLUMN IF NOT EXISTS total_opex_formula TEXT,
ADD COLUMN IF NOT EXISTS cumulative_opex_formula TEXT;

-- Add comments for documentation
COMMENT ON COLUMN monthly_opex_projections.personnel_cost_formula IS 'Excel formula used to calculate personnel cost';
COMMENT ON COLUMN monthly_opex_projections.headcount_formula IS 'Excel formula used to calculate headcount';
COMMENT ON COLUMN monthly_opex_projections.marketing_formula IS 'Excel formula used to calculate marketing expenses';
COMMENT ON COLUMN monthly_opex_projections.sales_formula IS 'Excel formula used to calculate sales expenses';
COMMENT ON COLUMN monthly_opex_projections.infrastructure_formula IS 'Excel formula used to calculate infrastructure costs';
COMMENT ON COLUMN monthly_opex_projections.facilities_formula IS 'Excel formula used to calculate facilities costs';
COMMENT ON COLUMN monthly_opex_projections.professional_services_formula IS 'Excel formula used to calculate professional services costs';
COMMENT ON COLUMN monthly_opex_projections.other_formula IS 'Excel formula used to calculate other expenses';
COMMENT ON COLUMN monthly_opex_projections.total_opex_formula IS 'Excel formula used to calculate total OPEX';
COMMENT ON COLUMN monthly_opex_projections.cumulative_opex_formula IS 'Excel formula used to calculate cumulative OPEX';

-- ============================================================================
-- Create Index for Formula Queries
-- ============================================================================

-- Index to find records with formulas
CREATE INDEX IF NOT EXISTS idx_annual_projections_has_formula
ON annual_projections (scenario_id)
WHERE arr_formula IS NOT NULL
   OR total_revenue_formula IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_monthly_opex_has_formula
ON monthly_opex_projections (scenario_id)
WHERE total_opex_formula IS NOT NULL
   OR personnel_cost_formula IS NOT NULL;

-- ============================================================================
-- Add Metadata Columns
-- ============================================================================

-- Track import source and metadata
ALTER TABLE annual_projections
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS import_metadata JSONB;

ALTER TABLE monthly_opex_projections
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS import_metadata JSONB;

ALTER TABLE assumptions
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS import_metadata JSONB;

ALTER TABLE personnel_roles
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS import_metadata JSONB;

ALTER TABLE funding_rounds
ADD COLUMN IF NOT EXISTS import_source TEXT,
ADD COLUMN IF NOT EXISTS import_metadata JSONB;

-- Add comments
COMMENT ON COLUMN annual_projections.import_source IS 'Source of import (excel, manual, api)';
COMMENT ON COLUMN annual_projections.import_metadata IS 'Additional import metadata (file name, timestamp, etc.)';
COMMENT ON COLUMN monthly_opex_projections.import_source IS 'Source of import (excel, manual, api)';
COMMENT ON COLUMN monthly_opex_projections.import_metadata IS 'Additional import metadata (file name, timestamp, etc.)';

-- ============================================================================
-- Create Import History Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS import_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  scenario_id uuid NOT NULL REFERENCES scenarios(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  import_mode TEXT NOT NULL CHECK (import_mode IN ('merge', 'replace')),
  records_imported JSONB NOT NULL,
  errors JSONB,
  warnings JSONB,
  duration_ms INTEGER NOT NULL,
  imported_by uuid REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_import_history_organization
ON import_history(organization_id);

CREATE INDEX IF NOT EXISTS idx_import_history_scenario
ON import_history(scenario_id);

CREATE INDEX IF NOT EXISTS idx_import_history_created_at
ON import_history(created_at DESC);

-- Enable RLS
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view import history for their organizations
CREATE POLICY "Users can view import history for their organizations"
ON import_history FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
  )
);

-- RLS Policy: Users can insert import history for their organizations
CREATE POLICY "Users can insert import history for their organizations"
ON import_history FOR INSERT
WITH CHECK (
  organization_id IN (
    SELECT organization_id
    FROM user_organizations
    WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin', 'editor', 'member')
  )
);

-- Add comment
COMMENT ON TABLE import_history IS 'Tracks all Excel imports with metadata and results';

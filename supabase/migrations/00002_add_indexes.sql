-- Migration: Add Performance Indexes
-- Purpose: Optimize query performance across all tables
-- Expected Impact: 5-10x speedup on common queries
-- Created: 2025-10-06

-- ============================================================================
-- SCENARIOS TABLE INDEXES
-- ============================================================================
-- scenario_id is used in 21 queries across all related tables
-- organization_id is used for multi-tenant filtering
-- created_at and updated_at are used for sorting and recent scenario lists

-- Index for filtering scenarios by organization (multi-tenant queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_organization_id
ON scenarios(organization_id);

-- Index for sorting scenarios by creation date (newest first)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_created_at
ON scenarios(created_at DESC);

-- Index for sorting scenarios by last modified (most recently updated)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_updated_at
ON scenarios(updated_at DESC);

-- Composite index for common query pattern: organization + updated_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_scenarios_org_updated
ON scenarios(organization_id, updated_at DESC);

-- ============================================================================
-- ANNUAL_PROJECTIONS TABLE INDEXES
-- ============================================================================
-- This table is queried frequently for financial statements and reports

-- Index for filtering projections by scenario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_annual_projections_scenario_id
ON annual_projections(scenario_id);

-- Composite index for common query: scenario + year (for time-series queries)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_annual_projections_scenario_year
ON annual_projections(scenario_id, year);

-- Index for year-based filtering across scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_annual_projections_year
ON annual_projections(year);

-- ============================================================================
-- MONTHLY_OPEX_PROJECTIONS TABLE INDEXES
-- ============================================================================
-- High-frequency table for OPEX calculations and dashboards

-- Index for filtering OPEX by scenario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_opex_scenario_id
ON monthly_opex_projections(scenario_id);

-- Composite index for time-series queries: scenario + month
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_opex_scenario_month
ON monthly_opex_projections(scenario_id, month);

-- Index for month-based filtering (e.g., comparing all scenarios at month 12)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_opex_month
ON monthly_opex_projections(month);

-- Index for sorting by calculation time (cache invalidation, debugging)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_monthly_opex_calculated_at
ON monthly_opex_projections(calculated_at DESC);

-- ============================================================================
-- PERSONNEL_ROLES TABLE INDEXES
-- ============================================================================
-- Used for headcount planning and personnel cost calculations

-- Index for filtering personnel by scenario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personnel_roles_scenario_id
ON personnel_roles(scenario_id);

-- Composite index for time-based queries: scenario + start_month
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personnel_roles_scenario_start
ON personnel_roles(scenario_id, start_month);

-- Index for department-based filtering
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_personnel_roles_department
ON personnel_roles(department);

-- ============================================================================
-- FUNDING_ROUNDS TABLE INDEXES
-- ============================================================================
-- Used for cap table calculations and funding timeline analysis

-- Index for filtering funding rounds by scenario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funding_rounds_scenario_id
ON funding_rounds(scenario_id);

-- Index for sorting by close date (funding timeline)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funding_rounds_close_date
ON funding_rounds(close_date);

-- Composite index for scenario + close date queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_funding_rounds_scenario_date
ON funding_rounds(scenario_id, close_date);

-- ============================================================================
-- ASSUMPTIONS TABLE INDEXES
-- ============================================================================
-- Key-value store for scenario configuration and variables

-- Index for filtering assumptions by scenario
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assumptions_scenario_id
ON assumptions(scenario_id);

-- Composite index for key-value lookups: scenario + key
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assumptions_scenario_key
ON assumptions(scenario_id, key);

-- Index for key-based filtering across scenarios
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_assumptions_key
ON assumptions(key);

-- ============================================================================
-- ORGANIZATIONS TABLE INDEXES
-- ============================================================================
-- Core multi-tenant table

-- Index for primary key lookups (if not already created)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_id
ON organizations(id);

-- Index for slug-based lookups (URL routing)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_slug
ON organizations(slug);

-- Index for sorting organizations by creation date
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_organizations_created_at
ON organizations(created_at DESC);

-- ============================================================================
-- USER_ORGANIZATIONS TABLE INDEXES (from previous migration)
-- ============================================================================
-- Ensure the junction table has optimal indexes for RLS policy queries

-- These should already exist from 00001_enable_rls.sql, but adding IF NOT EXISTS for safety
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_user_id
ON user_organizations(user_id);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_organization_id
ON user_organizations(organization_id);

-- Composite index for role-based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_user_organizations_user_role
ON user_organizations(user_id, role);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these after applying the migration to verify indexes are created:

-- 1. List all indexes on public schema tables:
-- SELECT
--     tablename,
--     indexname,
--     indexdef
-- FROM pg_indexes
-- WHERE schemaname = 'public'
-- ORDER BY tablename, indexname;

-- 2. Check index usage statistics (after running queries):
-- SELECT
--     schemaname,
--     tablename,
--     indexname,
--     idx_scan as index_scans,
--     idx_tup_read as tuples_read,
--     idx_tup_fetch as tuples_fetched
-- FROM pg_stat_user_indexes
-- WHERE schemaname = 'public'
-- ORDER BY idx_scan DESC;

-- 3. Analyze query performance (example):
-- EXPLAIN ANALYZE
-- SELECT s.*, COUNT(ap.id) as projection_count
-- FROM scenarios s
-- LEFT JOIN annual_projections ap ON s.id = ap.scenario_id
-- WHERE s.organization_id = 'YOUR_ORG_ID'
-- GROUP BY s.id
-- ORDER BY s.updated_at DESC;

-- Expected results:
-- - "Index Scan" instead of "Seq Scan" for filtered queries
-- - "Bitmap Index Scan" for composite index usage
-- - Significantly lower "actual time" values

-- ============================================================================
-- MAINTENANCE NOTES
-- ============================================================================
-- 1. CONCURRENTLY option allows index creation without locking the table
--    - Production deployments can continue serving traffic during migration
--    - Takes longer than regular CREATE INDEX but safer
--
-- 2. Monitor index bloat over time:
--    SELECT * FROM pg_stat_user_indexes WHERE idx_scan = 0;
--    (Drop unused indexes to save space)
--
-- 3. Re-index periodically if data changes significantly:
--    REINDEX INDEX CONCURRENTLY idx_scenarios_organization_id;
--
-- 4. Vacuum analyze after creating indexes:
--    VACUUM ANALYZE scenarios;
--    VACUUM ANALYZE annual_projections;
--    (etc. for all tables)

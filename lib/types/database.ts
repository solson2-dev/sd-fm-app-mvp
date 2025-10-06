/**
 * Database Types for Supabase Tables
 *
 * This file contains TypeScript interfaces for all database tables
 * to replace `any` types throughout the application.
 */

// ============================================================================
// Database Row Types
// ============================================================================

export interface AssumptionRow {
  id: string;
  organization_id: string;
  scenario_id: string;
  key: string;
  value: string;
  category: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnnualProjectionRow {
  id: string;
  organization_id: string;
  scenario_id: string;
  year: number;
  year_number: number;
  arr: number | null;
  customers: number | null;
  revenue: number | null;
  total_revenue: number | null;
  cogs: number | null;
  gross_profit: number | null;
  gross_margin: number | null;
  total_opex: number | null;
  ebitda: number | null;
  net_income: number | null;
  ending_customers: number | null;
  setup_fees: number | null;
  created_at: string;
  updated_at: string;
}

export interface FundingRoundRow {
  id: string;
  scenario_id: string;
  round_name: string;
  amount_raised: number;
  pre_money_valuation: number | null;
  post_money_valuation: number;
  price_per_share: number | null;
  shares_issued: number | null;
  investor_ownership: number | null;
  close_date: string;
  close_month: number | null;
  esop_refresh_target: number | null;
  created_at: string;
}

export interface MonthlyOpexProjectionRow {
  id: string;
  scenario_id: string;
  month: number;
  personnel_cost: number;
  headcount: number;
  marketing: number;
  sales: number;
  infrastructure: number;
  facilities: number;
  professional_services: number;
  other: number;
  total_opex: number;
  cumulative_opex: number | null;
  calculated_at: string;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  success?: boolean;
}

export interface EquityApiResponse {
  capTable: import('../calculations/equity').CapTableEntry[];
  founders: FounderData[];
  esopPoolSize: number;
  fundingRounds: FundingRoundData[];
}

export interface FounderData {
  name: string;
  ownership: number;
}

export interface FundingRoundData {
  roundName: string;
  amount: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  pricePerShare: number;
  sharesIssued: number;
  investorOwnership: number;
  date: string;
}

// ============================================================================
// Hook Types
// ============================================================================

export interface EquityMutationData {
  scenarioId: string;
  founders: FounderData[];
  esopPoolSize: number;
}

export interface RevenueMutationData {
  scenarioId: string;
  assumptions: Partial<import('../calculations/revenue').RevenueAssumptions>;
}

export interface FinancialsMutationData {
  scenarioId: string;
  assumptions: Record<string, unknown>;
}

// ============================================================================
// Query Cache Types (for TanStack Query)
// ============================================================================

export interface EquityQueryData {
  capTable: import('../calculations/equity').CapTableEntry[];
  founders: FounderData[];
  esopPoolSize: number;
  fundingRounds: FundingRoundData[];
}

export interface RevenueQueryData {
  projections: import('../calculations/revenue').RevenueMetrics[];
  assumptions: import('../calculations/revenue').RevenueAssumptions;
}

export interface FinancialsQueryData {
  incomeStatements: import('../calculations/financials').IncomeStatement[];
  cashFlows: import('../calculations/financials').CashFlowStatement[];
  balanceSheets: import('../calculations/financials').BalanceSheet[];
}

// ============================================================================
// Grouped/Aggregate Types
// ============================================================================

export interface GroupedAssumptions {
  [category: string]: AssumptionRow[];
}

export interface AssumptionsApiResponse {
  assumptions: AssumptionRow[];
  grouped: GroupedAssumptions;
}

// ============================================================================
// Export Types
// ============================================================================

export interface FundingRoundExportData {
  roundName: string;
  amount: number;
  valuation: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  pricePerShare: number;
  sharesIssued: number;
  investorOwnership: number;
  date?: string;
}

export interface AnnualOpexData {
  organization_id: string;
  scenario_id: string;
  year: number;
  total_opex: number;
}

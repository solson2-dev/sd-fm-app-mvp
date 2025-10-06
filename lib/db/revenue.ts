import { supabase } from '@/lib/supabase/client';
import {
  RevenueAssumptions,
  RevenueMetrics,
  calculateRevenueProjections,
  calculateCustomerProjections,
} from '@/lib/calculations/revenue';
import type { AssumptionRow, AnnualProjectionRow } from '@/lib/types/database';

export async function getRevenueAssumptions(
  scenarioId: string
): Promise<RevenueAssumptions | null> {
  const { data, error } = await supabase
    .from('assumptions')
    .select('*')
    .eq('scenario_id', scenarioId)
    .in('key', [
      'tam',
      'target_penetration',
      'years_to_target',
      'year1_customers',
      'base_arr',
      'setup_fee',
      'annual_price_increase',
      'churn_rate',
      'cogs_percent',
    ]);

  if (error || !data || data.length === 0) return null;

  // Convert array of assumptions into RevenueAssumptions object
  const assumptions: Partial<RevenueAssumptions> = {};
  data.forEach((row: AssumptionRow) => {
    const key = row.key
      .replace(/_([a-z])/g, (_match: string, letter: string) => letter.toUpperCase())
      .replace(/^./, (str: string) => str.toLowerCase());
    (assumptions as Record<string, number>)[key] = parseFloat(row.value);
  });

  return assumptions as RevenueAssumptions;
}

export async function saveRevenueAssumptions(
  scenarioId: string,
  assumptions: RevenueAssumptions
): Promise<void> {
  // Convert object to array of key-value pairs (no growth_exponent - it's calculated)
  const records = [
    { scenario_id: scenarioId, key: 'tam', value: assumptions.tam },
    {
      scenario_id: scenarioId,
      key: 'target_penetration',
      value: assumptions.targetPenetration,
    },
    {
      scenario_id: scenarioId,
      key: 'years_to_target',
      value: assumptions.yearsToTarget,
    },
    {
      scenario_id: scenarioId,
      key: 'year1_customers',
      value: assumptions.year1Customers,
    },
    { scenario_id: scenarioId, key: 'base_arr', value: assumptions.baseArr },
    { scenario_id: scenarioId, key: 'setup_fee', value: assumptions.setupFee },
    {
      scenario_id: scenarioId,
      key: 'annual_price_increase',
      value: assumptions.annualPriceIncrease,
    },
    {
      scenario_id: scenarioId,
      key: 'churn_rate',
      value: assumptions.churnRate,
    },
  ];

  // Add cogs_percent if provided
  if (assumptions.cogsPercent !== undefined) {
    records.push({
      scenario_id: scenarioId,
      key: 'cogs_percent',
      value: assumptions.cogsPercent,
    });
  }

  // Upsert revenue assumptions - update existing or insert new
  const { error } = await supabase
    .from('assumptions')
    .upsert(records, {
      onConflict: 'scenario_id,key',
      ignoreDuplicates: false
    });

  if (error) throw error;

  // Clean up old growth_exponent assumption if it exists (no longer used)
  await supabase
    .from('assumptions')
    .delete()
    .eq('scenario_id', scenarioId)
    .eq('key', 'growth_exponent');
}

export async function saveRevenueProjections(
  scenarioId: string,
  projections: RevenueMetrics[]
): Promise<void> {
  // Note: This stores in annual_projections table
  // Update the projections with revenue data

  // Use default organization ID for MVP (RLS policies block scenario lookup)
  const organizationId = 'a0000000-0000-0000-0000-000000000001';

  const records = projections.map((p) => ({
    organization_id: organizationId,
    scenario_id: scenarioId,
    year: p.year,
    arr: p.arr,
    customers: p.customers,
    revenue: p.totalRevenue,
    cogs: p.cogs,
    gross_profit: p.grossProfit,
    gross_margin: p.grossMargin,
  }));

  // Upsert revenue projections - update existing or insert new
  const { error } = await supabase
    .from('annual_projections')
    .upsert(records, {
      onConflict: 'scenario_id,year',
      ignoreDuplicates: false
    });

  if (error) throw error;
}

export async function getRevenueProjections(
  scenarioId: string
): Promise<RevenueMetrics[]> {
  const { data, error } = await supabase
    .from('annual_projections')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('year_number');

  if (error) throw error;

  return (data || []).map((row: AnnualProjectionRow) => ({
    year: row.year_number,
    month: 12,
    absoluteMonth: row.year_number * 12,
    arr: row.arr || 0,
    setupFees: row.setup_fees || 0,
    totalRevenue: row.total_revenue || 0,
    customers: row.ending_customers || 0,
    cogs: 0, // Not stored in annual_projections (calculated from gross_profit)
    grossProfit: row.gross_profit || 0,
    grossMargin: row.gross_margin || 0,
  }));
}

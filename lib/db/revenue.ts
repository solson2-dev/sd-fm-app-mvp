import { supabase } from '@/lib/supabase/client';
import {
  RevenueAssumptions,
  RevenueMetrics,
  calculateRevenueProjections,
  calculateCustomerProjections,
} from '@/lib/calculations/revenue';

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
    ]);

  if (error || !data || data.length === 0) return null;

  // Convert array of assumptions into RevenueAssumptions object
  const assumptions: Partial<RevenueAssumptions> = {};
  data.forEach((row) => {
    const key = row.key
      .replace(/_([a-z])/g, (_, letter: string) => letter.toUpperCase())
      .replace(/^./, (str: string) => str.toLowerCase());
    (assumptions as any)[key] = parseFloat(row.value);
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

  // Delete existing revenue assumptions (including old growth_exponent if it exists)
  const { error: deleteError } = await supabase
    .from('assumptions')
    .delete()
    .eq('scenario_id', scenarioId)
    .in('key', [...records.map((r) => r.key), 'growth_exponent']);

  if (deleteError) throw deleteError;

  // Insert new assumptions
  const { error: insertError } = await supabase.from('assumptions').insert(records);

  if (insertError) throw insertError;
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

  // Delete existing revenue projections
  const { error: deleteError } = await supabase
    .from('annual_projections')
    .delete()
    .eq('scenario_id', scenarioId);

  if (deleteError) throw deleteError;

  // Insert new projections
  const { error: insertError } = await supabase
    .from('annual_projections')
    .insert(records);

  if (insertError) throw insertError;
}

export async function getRevenueProjections(
  scenarioId: string
): Promise<RevenueMetrics[]> {
  const { data, error } = await supabase
    .from('annual_projections')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('year');

  if (error) throw error;

  return (data || []).map((row) => ({
    year: row.year,
    month: 12,
    absoluteMonth: row.year * 12,
    arr: row.arr || 0,
    setupFees: 0, // Not stored separately
    totalRevenue: row.revenue || 0,
    customers: row.customers || 0,
    cogs: row.cogs || 0,
    grossProfit: row.gross_profit || 0,
    grossMargin: row.gross_margin || 0,
  }));
}

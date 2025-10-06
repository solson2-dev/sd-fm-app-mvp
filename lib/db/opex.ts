import { supabase } from '@/lib/supabase/client';
import {
  calculateMonthlyOPEX,
  calculateCumulativeOPEX,
  MonthlyOPEX,
} from '@/lib/calculations/opex';
import { PersonnelRole, calculateHeadcount } from '@/lib/calculations/personnel';
import type { MonthlyOpexProjectionRow, AnnualOpexData } from '@/lib/types/database';

export async function saveOPEXProjections(
  scenarioId: string,
  roles: PersonnelRole[],
  startMonth: number,
  endMonth: number
): Promise<void> {
  const projections: Omit<MonthlyOpexProjectionRow, 'id' | 'calculated_at'>[] = [];

  for (let month = startMonth; month <= endMonth; month++) {
    const opex = calculateMonthlyOPEX(roles, month);
    const cumulativeOPEX = calculateCumulativeOPEX(roles, month);
    const headcount = calculateHeadcount(roles, month);

    projections.push({
      scenario_id: scenarioId,
      month,
      personnel_cost: opex.personnelCost,
      headcount,
      marketing: opex.marketingAndSales,
      sales: 0, // Included in marketingAndSales
      infrastructure: opex.productDevelopment,
      facilities: opex.officeAndEquipment,
      professional_services: opex.legalAndProfessional,
      other: opex.travelAndEvents,
      total_opex: opex.totalOPEX,
      cumulative_opex: cumulativeOPEX,
    });
  }

  // Upsert monthly OPEX projections - update existing or insert new
  const { error } = await supabase
    .from('monthly_opex_projections')
    .upsert(projections, {
      onConflict: 'scenario_id,month',
      ignoreDuplicates: false
    });

  if (error) throw error;

  // Calculate and save annual OPEX totals to annual_projections table
  await saveAnnualOPEX(scenarioId, projections);
}

async function saveAnnualOPEX(
  scenarioId: string,
  monthlyProjections: Array<Omit<MonthlyOpexProjectionRow, 'id' | 'calculated_at'> | MonthlyOpexProjectionRow>
): Promise<void> {
  // Use default organization ID for MVP (RLS policies block scenario lookup)
  const organizationId = 'a0000000-0000-0000-0000-000000000001';

  // Calculate annual totals
  const annualData: AnnualOpexData[] = [];
  const maxYear = Math.ceil(monthlyProjections[monthlyProjections.length - 1].month / 12);

  for (let year = 1; year <= maxYear; year++) {
    const startMonth = (year - 1) * 12 + 1;
    const endMonth = year * 12;

    const yearlyProjections = monthlyProjections.filter(
      (p) => p.month >= startMonth && p.month <= endMonth
    );

    const totalOPEX = yearlyProjections.reduce((sum, p) => sum + p.total_opex, 0);

    annualData.push({
      organization_id: organizationId,
      scenario_id: scenarioId,
      year,
      total_opex: totalOPEX,
    });
  }

  // Update or insert annual OPEX data
  for (const data of annualData) {
    const { error } = await supabase
      .from('annual_projections')
      .upsert(data, {
        onConflict: 'scenario_id,year',
      });

    if (error) console.error('Error saving annual OPEX:', error);
  }
}

export async function getOPEXProjections(
  scenarioId: string
): Promise<MonthlyOPEX[]> {
  const { data, error } = await supabase
    .from('monthly_opex_projections')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('month');

  if (error) throw error;

  return (data || []).map((row: MonthlyOpexProjectionRow) => ({
    month: row.month,
    personnelCost: row.personnel_cost,
    productDevelopment: row.infrastructure,
    marketingAndSales: row.marketing,
    legalAndProfessional: row.professional_services,
    officeAndEquipment: row.facilities,
    travelAndEvents: row.other,
    operatingSubtotal:
      row.infrastructure +
      row.marketing +
      row.professional_services +
      row.facilities +
      row.other,
    totalOPEX: row.total_opex,
  }));
}

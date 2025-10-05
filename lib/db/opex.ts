import { supabase } from '@/lib/supabase/client';
import {
  calculateMonthlyOPEX,
  calculateCumulativeOPEX,
  MonthlyOPEX,
} from '@/lib/calculations/opex';
import { PersonnelRole, calculateHeadcount } from '@/lib/calculations/personnel';

export async function saveOPEXProjections(
  scenarioId: string,
  roles: PersonnelRole[],
  startMonth: number,
  endMonth: number
): Promise<void> {
  const projections = [];

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

  // Delete existing projections
  const { error: deleteError } = await supabase
    .from('monthly_opex_projections')
    .delete()
    .eq('scenario_id', scenarioId);

  if (deleteError) throw deleteError;

  // Insert new projections
  const { error: insertError } = await supabase
    .from('monthly_opex_projections')
    .insert(projections);

  if (insertError) throw insertError;
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

  return (data || []).map(row => ({
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

import { supabase } from '@/lib/supabase/client';
import { PersonnelRole } from '@/lib/calculations/personnel';

export async function getPersonnelRoles(scenarioId: string): Promise<PersonnelRole[]> {
  const { data, error } = await supabase
    .from('personnel_roles')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('start_month');

  if (error) throw error;

  return (data || []).map(row => ({
    roleName: row.role_name,
    baseSalary: row.base_salary,
    startMonth: row.start_month,
    endMonth: row.end_month || undefined,
  }));
}

export async function upsertPersonnelRoles(
  scenarioId: string,
  roles: PersonnelRole[]
): Promise<void> {
  // Delete existing roles
  const { error: deleteError } = await supabase
    .from('personnel_roles')
    .delete()
    .eq('scenario_id', scenarioId);

  if (deleteError) throw deleteError;

  // Insert new roles
  const { error: insertError } = await supabase
    .from('personnel_roles')
    .insert(
      roles.map(role => ({
        scenario_id: scenarioId,
        role_name: role.roleName,
        base_salary: role.baseSalary,
        start_month: role.startMonth,
        end_month: role.endMonth || null,
      }))
    );

  if (insertError) throw insertError;
}

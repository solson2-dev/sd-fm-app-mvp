/**
 * Personnel Cost Calculations
 * Based on StudioDatum Excel Model - Personnel sheet
 */

export interface PersonnelRole {
  roleName: string;
  baseSalary: number;
  startMonth: number;
  endMonth?: number; // Optional, null = ongoing
}

export interface PersonnelCostBreakdown {
  baseSalary: number;
  payrollTaxes: number;
  benefits: number;
  total: number;
}

/**
 * Calculate monthly personnel cost for a single role
 * Includes base salary + overhead (taxes, benefits, etc.)
 */
export function calculatePersonnelCost(
  role: PersonnelRole,
  month: number
): number {
  // Check if role is active in this month
  if (month < role.startMonth) return 0;
  if (role.endMonth && month > role.endMonth) return 0;

  // Overhead multiplier from Excel model (OPEX_PersonnelCost sheet, Row 2)
  // Benefits multiplier: 1.4 (includes payroll taxes, benefits, insurance, etc.)
  const OVERHEAD_MULTIPLIER = 1.4;

  // Monthly cost = (annual salary * overhead) / 12
  const monthlyCost = (role.baseSalary * OVERHEAD_MULTIPLIER) / 12;

  return monthlyCost;
}

/**
 * Calculate detailed cost breakdown for a role
 */
export function calculatePersonnelCostBreakdown(
  role: PersonnelRole,
  month: number
): PersonnelCostBreakdown {
  if (month < role.startMonth || (role.endMonth && month > role.endMonth)) {
    return { baseSalary: 0, payrollTaxes: 0, benefits: 0, total: 0 };
  }

  const monthlyBaseSalary = role.baseSalary / 12;
  const payrollTaxes = monthlyBaseSalary * 0.0765; // 7.65% FICA
  const benefits = monthlyBaseSalary * 0.20; // 20% benefits
  const misc = monthlyBaseSalary * 0.0735; // 7.35% misc overhead

  return {
    baseSalary: monthlyBaseSalary,
    payrollTaxes,
    benefits: benefits + misc,
    total: monthlyBaseSalary + payrollTaxes + benefits + misc,
  };
}

/**
 * Calculate total monthly personnel cost across all roles
 */
export function calculateMonthlyPersonnelTotal(
  roles: PersonnelRole[],
  month: number
): number {
  return roles.reduce((total, role) => {
    return total + calculatePersonnelCost(role, month);
  }, 0);
}

/**
 * Calculate cumulative personnel cost from month 1 to target month
 */
export function calculateCumulativePersonnelCost(
  roles: PersonnelRole[],
  targetMonth: number
): number {
  let cumulative = 0;
  for (let month = 1; month <= targetMonth; month++) {
    cumulative += calculateMonthlyPersonnelTotal(roles, month);
  }
  return cumulative;
}

/**
 * Calculate headcount for a given month
 */
export function calculateHeadcount(
  roles: PersonnelRole[],
  month: number
): number {
  return roles.filter(role => {
    const isActive = month >= role.startMonth;
    const notEnded = !role.endMonth || month <= role.endMonth;
    return isActive && notEnded;
  }).length;
}

/**
 * Get default personnel roles from Excel model
 * ✅ UPDATED: Actual data from OPEX_PersonnelCost sheet
 *
 * These are the 8 active roles from the StudioDatum Excel model.
 * Benefits multiplier: 1.4x applied to all base salaries
 * Source: OPEX_PersonnelCost sheet, Rows 5-12
 */
export function getDefaultPersonnelRoles(): PersonnelRole[] {
  return [
    { roleName: 'CEO (Stephen)', baseSalary: 160000, startMonth: 6, endMonth: 120 },
    { roleName: 'CTO (Allen)', baseSalary: 160000, startMonth: 3, endMonth: 120 },
    { roleName: 'Sr. Full-Stack Developer', baseSalary: 140000, startMonth: 3, endMonth: 120 },
    { roleName: 'Product/Customer Success', baseSalary: 105000, startMonth: 13, endMonth: 120 },
    { roleName: 'Sales/Partnership Lead', baseSalary: 140000, startMonth: 25, endMonth: 120 },
    { roleName: 'UI/UX Designer', baseSalary: 100000, startMonth: 18, endMonth: 120 },
    { roleName: 'Backend Engineer', baseSalary: 120000, startMonth: 13, endMonth: 120 },
    { roleName: 'Marketing Manager', baseSalary: 110000, startMonth: 18, endMonth: 120 },
  ];
}

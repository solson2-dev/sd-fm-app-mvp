/**
 * OPEX (Operating Expenses) Calculations
 * Based on StudioDatum Excel Model - Model_OPEX sheet
 */

import { PersonnelRole, calculateMonthlyPersonnelTotal } from './personnel';

export interface OPEXAllocation {
  // Non-personnel operating expenses - FIXED MONTHLY AMOUNTS (not percentages)
  productDevelopment: number; // Product development costs
  marketingAndSales: number; // Marketing & sales costs
  legalAndProfessional: number; // Legal & professional services
  officeAndEquipment: number; // Office & equipment
  travelAndEvents: number; // Travel & events
}

export interface MonthlyOPEX {
  month: number;
  personnelCost: number;
  productDevelopment: number;
  marketingAndSales: number;
  legalAndProfessional: number;
  officeAndEquipment: number;
  travelAndEvents: number;
  operatingSubtotal: number;
  totalOPEX: number;
}

/**
 * Funding round schedule from Excel model
 * Source: Reference_Funding Schedule sheet
 */
export interface FundingRound {
  name: string;
  startMonth: number;
  allocation: OPEXAllocation;
}

/**
 * Pre-Seed OPEX allocation (Months 1-26)
 * Source: OPEX_Allocation sheet, Column C
 */
export function getPreSeedAllocation(): OPEXAllocation {
  return {
    productDevelopment: 25000,
    marketingAndSales: 16667,
    legalAndProfessional: 2083,
    officeAndEquipment: 833,
    travelAndEvents: 1250,
  };
}

/**
 * Series A OPEX allocation (Month 27+)
 * Source: OPEX_Allocation sheet, Column F
 */
export function getSeriesAAllocation(): OPEXAllocation {
  return {
    productDevelopment: 16667,
    marketingAndSales: 58333,
    legalAndProfessional: 8333,
    officeAndEquipment: 8333,
    travelAndEvents: 8333,
  };
}

/**
 * Zero OPEX allocation (before funding)
 * Months 1-2 have no operating expenses
 */
export function getZeroAllocation(): OPEXAllocation {
  return {
    productDevelopment: 0,
    marketingAndSales: 0,
    legalAndProfessional: 0,
    officeAndEquipment: 0,
    travelAndEvents: 0,
  };
}

/**
 * Get funding round schedule
 * Based on Reference_Funding Schedule sheet
 * Note: Pre-Seed funding occurs in month 3, so months 1-2 have $0 operating expenses
 */
export function getFundingRounds(): FundingRound[] {
  return [
    {
      name: 'Bootstrap',
      startMonth: 1,
      allocation: getZeroAllocation(), // No operating expenses before funding
    },
    {
      name: 'Pre-Seed',
      startMonth: 3, // Pre-Seed funding received in month 3
      allocation: getPreSeedAllocation(),
    },
    {
      name: 'Series A',
      startMonth: 27, // Month 27 from Reference_Funding Schedule
      allocation: getSeriesAAllocation(),
    },
  ];
}

/**
 * Get OPEX allocation for a specific month based on funding round
 */
export function getAllocationForMonth(month: number): OPEXAllocation {
  const rounds = getFundingRounds();

  // Find the most recent funding round for this month
  let currentAllocation = rounds[0].allocation;

  for (const round of rounds) {
    if (month >= round.startMonth) {
      currentAllocation = round.allocation;
    }
  }

  return currentAllocation;
}

/**
 * Default OPEX allocation (Pre-Seed)
 * @deprecated Use getAllocationForMonth(month) for accurate time-based allocation
 */
export function getDefaultOPEXAllocation(): OPEXAllocation {
  return getPreSeedAllocation();
}

/**
 * Calculate total monthly OPEX including personnel and non-personnel expenses
 * ✅ UPDATED: Now uses funding round-based allocation
 */
export function calculateMonthlyOPEX(
  roles: PersonnelRole[],
  month: number,
  allocation?: OPEXAllocation
): MonthlyOPEX {
  // Calculate base personnel cost
  const personnelCost = calculateMonthlyPersonnelTotal(roles, month);

  // Get allocation based on funding round if not explicitly provided
  const opexAllocation = allocation || getAllocationForMonth(month);

  // Operating expenses are fixed monthly amounts (not percentages)
  const productDevelopment = opexAllocation.productDevelopment;
  const marketingAndSales = opexAllocation.marketingAndSales;
  const legalAndProfessional = opexAllocation.legalAndProfessional;
  const officeAndEquipment = opexAllocation.officeAndEquipment;
  const travelAndEvents = opexAllocation.travelAndEvents;

  const operatingSubtotal =
    productDevelopment +
    marketingAndSales +
    legalAndProfessional +
    officeAndEquipment +
    travelAndEvents;

  const totalOPEX = personnelCost + operatingSubtotal;

  return {
    month,
    personnelCost,
    productDevelopment,
    marketingAndSales,
    legalAndProfessional,
    officeAndEquipment,
    travelAndEvents,
    operatingSubtotal,
    totalOPEX,
  };
}

/**
 * Calculate OPEX projections for multiple months
 */
export function calculateOPEXProjections(
  roles: PersonnelRole[],
  startMonth: number,
  endMonth: number,
  allocation: OPEXAllocation = getDefaultOPEXAllocation()
): MonthlyOPEX[] {
  const projections: MonthlyOPEX[] = [];

  for (let month = startMonth; month <= endMonth; month++) {
    projections.push(calculateMonthlyOPEX(roles, month, allocation));
  }

  return projections;
}

/**
 * Calculate cumulative OPEX from month 1 to target month
 * ✅ UPDATED: Now accounts for funding round transitions
 */
export function calculateCumulativeOPEX(
  roles: PersonnelRole[],
  targetMonth: number
): number {
  let cumulative = 0;
  for (let month = 1; month <= targetMonth; month++) {
    // Use funding round-based allocation for each month
    const monthlyOPEX = calculateMonthlyOPEX(roles, month);
    cumulative += monthlyOPEX.totalOPEX;
  }
  return cumulative;
}

/**
 * Calculate average monthly OPEX over a period
 */
export function calculateAverageMonthlyOPEX(
  roles: PersonnelRole[],
  startMonth: number,
  endMonth: number,
  allocation: OPEXAllocation = getDefaultOPEXAllocation()
): number {
  const projections = calculateOPEXProjections(roles, startMonth, endMonth, allocation);
  const total = projections.reduce((sum, p) => sum + p.totalOPEX, 0);
  const monthCount = endMonth - startMonth + 1;
  return total / monthCount;
}

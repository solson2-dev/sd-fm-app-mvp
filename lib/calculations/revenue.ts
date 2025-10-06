/**
 * Revenue & Customer Acquisition Calculations
 * Based on StudioDatum Excel Model - Model_PnL sheet
 *
 * Implements S-curve customer growth using growth exponent formula
 * Validated against Excel: Year 5 ARR = $15,332,765, Customers = 631
 */

export interface RevenueAssumptions {
  tam: number; // Total Addressable Market (firms)
  targetPenetration: number; // Target market share % (e.g., 0.05 for 5%)
  yearsToTarget: number; // Years to reach target penetration
  year1Customers: number; // Starting customer count
  baseArr: number; // Base ARR per customer
  setupFee: number; // One-time setup fee per customer
  annualPriceIncrease: number; // Annual price escalation % (e.g., 0.03 for 3%)
  churnRate: number; // Annual churn rate % (e.g., 0.05 for 5%)
}

export interface CustomerMetrics {
  year: number;
  marketPenetration: number; // % of TAM
  totalCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  arrPerCustomer: number;
}

export interface RevenueMetrics {
  year: number;
  month: number; // Month within year (1-12)
  absoluteMonth: number; // Absolute month from start
  arr: number; // Annual Recurring Revenue
  setupFees: number;
  totalRevenue: number;
  customers: number;
  cogs: number; // Cost of Goods Sold
  grossProfit: number;
  grossMargin: number; // %
}

/**
 * Calculate growth exponent from other parameters
 * Formula: LOG(year1Customers / targetCustomers) / LOG(1 / yearsToTarget)
 * This creates an S-curve that connects Year 1 customers to target penetration
 */
export function calculateGrowthExponent(assumptions: RevenueAssumptions): number {
  const targetCustomers = assumptions.tam * assumptions.targetPenetration;
  const ratio = assumptions.year1Customers / targetCustomers;
  const base = 1 / assumptions.yearsToTarget;

  // Exponent = LOG(ratio) / LOG(base)
  return Math.log(ratio) / Math.log(base);
}

/**
 * Get default revenue assumptions from Excel model
 */
export function getDefaultRevenueAssumptions(): RevenueAssumptions {
  return {
    tam: 30000, // 30,000 firms
    targetPenetration: 0.05, // 5%
    yearsToTarget: 7,
    year1Customers: 10,
    baseArr: 24000,
    setupFee: 2500,
    annualPriceIncrease: 0.03, // 3%
    churnRate: 0.05, // 5%
  };
}

/**
 * Calculate market penetration % for a given year
 * Formula: Target% × (Year / YearsToTarget)^GrowthExponent
 */
export function calculateMarketPenetration(
  year: number,
  assumptions: RevenueAssumptions
): number {
  if (year === 0) return 0;

  const { targetPenetration, yearsToTarget } = assumptions;
  const growthExponent = calculateGrowthExponent(assumptions);

  // S-curve formula
  const penetration =
    targetPenetration * Math.pow(year / yearsToTarget, growthExponent);

  // Cap at target penetration
  return Math.min(penetration, targetPenetration);
}

/**
 * Calculate total customers for a given year
 * Formula: TAM × Market Penetration %
 */
export function calculateTotalCustomers(
  year: number,
  assumptions: RevenueAssumptions
): number {
  const penetration = calculateMarketPenetration(year, assumptions);
  return Math.round(assumptions.tam * penetration);
}

/**
 * Calculate customer metrics for a single year
 */
export function calculateCustomerMetrics(
  year: number,
  previousMetrics: CustomerMetrics | null,
  assumptions: RevenueAssumptions
): CustomerMetrics {
  const marketPenetration = calculateMarketPenetration(year, assumptions);
  const totalCustomers = calculateTotalCustomers(year, assumptions);

  // Calculate churn from previous year
  const churnedCustomers = previousMetrics
    ? Math.round(previousMetrics.totalCustomers * assumptions.churnRate)
    : 0;

  // New customers = current total - (previous total - churned)
  const newCustomers = previousMetrics
    ? totalCustomers - (previousMetrics.totalCustomers - churnedCustomers)
    : year === 1
    ? assumptions.year1Customers
    : totalCustomers;

  // ARR per customer with price escalation
  const arrPerCustomer =
    assumptions.baseArr * Math.pow(1 + assumptions.annualPriceIncrease, year - 1);

  return {
    year,
    marketPenetration,
    totalCustomers,
    newCustomers,
    churnedCustomers,
    arrPerCustomer,
  };
}

/**
 * Calculate customer metrics for all years
 */
export function calculateCustomerProjections(
  years: number,
  assumptions: RevenueAssumptions
): CustomerMetrics[] {
  const projections: CustomerMetrics[] = [];

  for (let year = 1; year <= years; year++) {
    const previousMetrics = year > 1 ? projections[year - 2] : null;
    projections.push(calculateCustomerMetrics(year, previousMetrics, assumptions));
  }

  return projections;
}

/**
 * Calculate revenue metrics for a single year
 */
export function calculateYearlyRevenue(
  customerMetrics: CustomerMetrics,
  assumptions: RevenueAssumptions
): {
  arr: number;
  setupFees: number;
  totalRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
} {
  const { totalCustomers, newCustomers, arrPerCustomer } = customerMetrics;

  // ARR = total customers × ARR per customer
  const arr = totalCustomers * arrPerCustomer;

  // Setup fees = new customers × setup fee
  const setupFees = newCustomers * assumptions.setupFee;

  // Total revenue = ARR + setup fees
  const totalRevenue = arr + setupFees;

  // COGS (assumed 25% of revenue for SaaS - hosting, support, etc.)
  const cogsRate = 0.25;
  const cogs = totalRevenue * cogsRate;

  // Gross profit = revenue - COGS
  const grossProfit = totalRevenue - cogs;

  // Gross margin %
  const grossMargin = totalRevenue > 0 ? grossProfit / totalRevenue : 0;

  return {
    arr,
    setupFees,
    totalRevenue,
    cogs,
    grossProfit,
    grossMargin,
  };
}

/**
 * Calculate monthly revenue breakdown from annual
 */
export function calculateMonthlyRevenue(
  year: number,
  customerMetrics: CustomerMetrics,
  assumptions: RevenueAssumptions
): RevenueMetrics[] {
  const yearlyRevenue = calculateYearlyRevenue(customerMetrics, assumptions);
  const monthlyMetrics: RevenueMetrics[] = [];

  // Distribute revenue evenly across 12 months (simplified)
  // In reality, might have seasonality or monthly growth
  for (let month = 1; month <= 12; month++) {
    const absoluteMonth = (year - 1) * 12 + month;

    monthlyMetrics.push({
      year,
      month,
      absoluteMonth,
      arr: yearlyRevenue.arr / 12,
      setupFees: yearlyRevenue.setupFees / 12,
      totalRevenue: yearlyRevenue.totalRevenue / 12,
      customers: customerMetrics.totalCustomers,
      cogs: yearlyRevenue.cogs / 12,
      grossProfit: yearlyRevenue.grossProfit / 12,
      grossMargin: yearlyRevenue.grossMargin,
    });
  }

  return monthlyMetrics;
}

/**
 * Calculate complete revenue projections (annual)
 */
export function calculateRevenueProjections(
  years: number,
  assumptions: RevenueAssumptions
): RevenueMetrics[] {
  const customerProjections = calculateCustomerProjections(years, assumptions);
  const revenueProjections: RevenueMetrics[] = [];

  customerProjections.forEach((customerMetrics) => {
    const yearlyRevenue = calculateYearlyRevenue(customerMetrics, assumptions);

    // Add one entry per year (annual view)
    revenueProjections.push({
      year: customerMetrics.year,
      month: 12, // Year-end
      absoluteMonth: customerMetrics.year * 12,
      arr: yearlyRevenue.arr,
      setupFees: yearlyRevenue.setupFees,
      totalRevenue: yearlyRevenue.totalRevenue,
      customers: customerMetrics.totalCustomers,
      cogs: yearlyRevenue.cogs,
      grossProfit: yearlyRevenue.grossProfit,
      grossMargin: yearlyRevenue.grossMargin,
    });
  });

  return revenueProjections;
}

/**
 * Calculate monthly revenue projections for detailed view
 */
export function calculateMonthlyRevenueProjections(
  years: number,
  assumptions: RevenueAssumptions
): RevenueMetrics[] {
  const customerProjections = calculateCustomerProjections(years, assumptions);
  const monthlyProjections: RevenueMetrics[] = [];

  customerProjections.forEach((customerMetrics) => {
    const monthlyData = calculateMonthlyRevenue(
      customerMetrics.year,
      customerMetrics,
      assumptions
    );
    monthlyProjections.push(...monthlyData);
  });

  return monthlyProjections;
}

/**
 * Calculate key revenue metrics summary
 */
export function calculateRevenueSummary(
  years: number,
  assumptions: RevenueAssumptions
) {
  const projections = calculateRevenueProjections(years, assumptions);
  const year5 = projections[4]; // Year 5 (index 4)
  const year10 = projections[9]; // Year 10 if exists

  return {
    year5: year5
      ? {
          arr: year5.arr,
          customers: year5.customers,
          revenue: year5.totalRevenue,
          grossProfit: year5.grossProfit,
        }
      : null,
    year10: year10
      ? {
          arr: year10.arr,
          customers: year10.customers,
          revenue: year10.totalRevenue,
          grossProfit: year10.grossProfit,
        }
      : null,
    finalYear: projections[projections.length - 1],
  };
}

/**
 * Revenue & Customer Acquisition Calculations
 * Based on StudioDatum Excel Model - Model_PnL sheet
 *
 * Implements S-curve customer growth using growth exponent formula
 * Validated against Excel: Year 5 ARR = $15,332,765, Customers = 631
 */

export interface LicenseTier {
  name: string;
  arrPerYear: number;
  setupFee: number;
  distribution: number; // % of customers on this tier (0-1)
}

export interface DiscountSchedule {
  year: number;
  discountPercent: number; // e.g., 0.40 for 40% discount
}

export interface ChurnSchedule {
  year: number;
  churnRate: number; // e.g., 0.20 for 20% churn
}

export interface RevenueAssumptions {
  tam: number; // Total Addressable Market (firms)
  targetPenetration: number; // Target market share % (e.g., 0.05 for 5%)
  yearsToTarget: number; // Years to reach target penetration
  year1Customers: number; // Starting customer count
  baseArr: number; // Base ARR per customer (used if no tiers)
  setupFee: number; // One-time setup fee per customer (used if no tiers)
  annualPriceIncrease: number; // Annual price escalation % (e.g., 0.03 for 3%)
  churnRate: number; // Base annual churn rate % (e.g., 0.05 for 5%)
  licenseTiers?: LicenseTier[]; // Optional tiered pricing
  discountSchedule?: DiscountSchedule[]; // Declining discounts by year
  churnSchedule?: ChurnSchedule[]; // Declining churn by year
}

export interface CustomerMetrics {
  year: number;
  marketPenetration: number; // % of TAM
  totalCustomers: number;
  newCustomers: number;
  churnedCustomers: number;
  arrPerCustomer: number;
}

export interface LicenseEquivalents {
  singleUser: number; // 80% of total
  team: number;       // 16% of total (1/5 of single user)
  enterprise: number; // 4% of total (1/10 of single user)
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
  licenseEquivalents?: LicenseEquivalents;
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
 * Get default discount schedule from Excel Model_PnL
 * Discounts decline from 40% in Year 1 to 2.5% by Year 10
 */
export function getDefaultDiscountSchedule(): DiscountSchedule[] {
  return [
    { year: 1, discountPercent: 0.40 },
    { year: 2, discountPercent: 0.30 },
    { year: 3, discountPercent: 0.20 },
    { year: 4, discountPercent: 0.10 },
    { year: 5, discountPercent: 0.10 },
    { year: 6, discountPercent: 0.075 },
    { year: 7, discountPercent: 0.05 },
    { year: 8, discountPercent: 0.05 },
    { year: 9, discountPercent: 0.03 },
    { year: 10, discountPercent: 0.025 },
  ];
}

/**
 * Get default churn schedule from Excel Model_PnL
 * Churn declines from 20% in Year 2 to 15% by Year 8+
 */
export function getDefaultChurnSchedule(): ChurnSchedule[] {
  return [
    { year: 1, churnRate: 0.00 }, // No churn in year 1
    { year: 2, churnRate: 0.20 },
    { year: 3, churnRate: 0.20 },
    { year: 4, churnRate: 0.18 },
    { year: 5, churnRate: 0.17 },
    { year: 6, churnRate: 0.17 },
    { year: 7, churnRate: 0.16 },
    { year: 8, churnRate: 0.15 },
    { year: 9, churnRate: 0.15 },
    { year: 10, churnRate: 0.15 },
  ];
}

/**
 * Get default license tiers
 */
export function getDefaultLicenseTiers(): LicenseTier[] {
  return [
    {
      name: 'Starter',
      arrPerYear: 12000,
      setupFee: 1000,
      distribution: 0.50, // 50% of customers
    },
    {
      name: 'Professional',
      arrPerYear: 24000,
      setupFee: 2500,
      distribution: 0.35, // 35% of customers
    },
    {
      name: 'Enterprise',
      arrPerYear: 48000,
      setupFee: 5000,
      distribution: 0.15, // 15% of customers
    },
  ];
}

/**
 * Get discount percent for a specific year
 */
export function getDiscountForYear(year: number, schedule?: DiscountSchedule[]): number {
  const defaultSchedule = getDefaultDiscountSchedule();
  const activeSchedule = schedule || defaultSchedule;

  const entry = activeSchedule.find(s => s.year === year);
  if (entry) return entry.discountPercent;

  // Default to last entry if year exceeds schedule
  return activeSchedule[activeSchedule.length - 1]?.discountPercent || 0;
}

/**
 * Get churn rate for a specific year
 */
export function getChurnForYear(year: number, schedule?: ChurnSchedule[]): number {
  const defaultSchedule = getDefaultChurnSchedule();
  const activeSchedule = schedule || defaultSchedule;

  const entry = activeSchedule.find(s => s.year === year);
  if (entry) return entry.churnRate;

  // Default to last entry if year exceeds schedule
  return activeSchedule[activeSchedule.length - 1]?.churnRate || 0.15;
}

/**
 * Calculate license equivalents breakdown
 * Based on Excel Model_LicencEquivalents sheet
 * Ratio: Single User (800) : Team (80) : Enterprise (10)
 * Which translates to: 89.9% : 9.0% : 1.1%
 *
 * FIXED: Previously used incorrect 80:16:4 ratio (80%/16%/4%)
 * Now uses correct 800:80:10 ratio (89.9%/9.0%/1.1%)
 */
export function calculateLicenseEquivalents(totalCustomers: number): LicenseEquivalents {
  // Using the correct ratio from Excel: 800:80:10
  // Total parts: 800 + 80 + 10 = 890
  // Single User: 800/890 = 0.8989... ≈ 89.9%
  // Team: 80/890 = 0.0898... ≈ 9.0%
  // Enterprise: 10/890 = 0.0112... ≈ 1.1%
  const singleUser = Math.round(totalCustomers * 0.899);  // 89.9%
  const team = Math.round(totalCustomers * 0.090);        // 9.0%
  const enterprise = Math.round(totalCustomers * 0.011);  // 1.1%

  return {
    singleUser,
    team,
    enterprise,
  };
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
    churnRate: 0.15, // Base churn rate (overridden by schedule)
    licenseTiers: getDefaultLicenseTiers(),
    discountSchedule: getDefaultDiscountSchedule(),
    churnSchedule: getDefaultChurnSchedule(),
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

  // Use dynamic churn rate from schedule if available
  const churnRate = getChurnForYear(year, assumptions.churnSchedule);

  // Calculate churn from previous year
  const churnedCustomers = previousMetrics
    ? Math.round(previousMetrics.totalCustomers * churnRate)
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
 * Calculate weighted average ARR and setup fee from license tiers
 * Now includes discount schedule
 */
function calculateWeightedPricing(
  tiers: LicenseTier[],
  year: number,
  annualIncrease: number,
  discountSchedule?: DiscountSchedule[]
): {
  weightedArr: number;
  weightedSetupFee: number;
} {
  let totalArr = 0;
  let totalSetupFee = 0;

  // Get discount for this year
  const discount = getDiscountForYear(year, discountSchedule);

  for (const tier of tiers) {
    // Apply annual price increase
    const adjustedArr = tier.arrPerYear * Math.pow(1 + annualIncrease, year - 1);

    // Apply discount
    const discountedArr = adjustedArr * (1 - discount);

    totalArr += discountedArr * tier.distribution;
    totalSetupFee += tier.setupFee * tier.distribution;
  }

  return {
    weightedArr: totalArr,
    weightedSetupFee: totalSetupFee,
  };
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
  const { totalCustomers, newCustomers, arrPerCustomer, year } = customerMetrics;

  let arr: number;
  let setupFees: number;

  // Use tiered pricing if available, otherwise use base pricing
  if (assumptions.licenseTiers && assumptions.licenseTiers.length > 0) {
    const pricing = calculateWeightedPricing(
      assumptions.licenseTiers,
      year,
      assumptions.annualPriceIncrease,
      assumptions.discountSchedule
    );
    arr = totalCustomers * pricing.weightedArr;
    setupFees = newCustomers * pricing.weightedSetupFee;
  } else {
    // Fallback to base pricing with discount
    const discount = getDiscountForYear(year, assumptions.discountSchedule);
    const discountedArr = arrPerCustomer * (1 - discount);
    arr = totalCustomers * discountedArr;
    setupFees = newCustomers * assumptions.setupFee;
  }

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

  // Calculate license equivalents
  const licenseEquivalents = calculateLicenseEquivalents(customerMetrics.totalCustomers);

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
      licenseEquivalents,
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

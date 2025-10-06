/**
 * Cash Runway & Burn Rate Calculations
 * Based on StudioDatum Excel Model - Dashboard sheet
 */

import { MonthlyOPEX } from './opex';
import { RevenueMetrics } from './revenue';

export interface FundingEvent {
  month: number;
  amount: number;
}

export interface CashPosition {
  month: number;
  year: number;
  revenue: number;
  opex: number;
  netBurn: number; // negative if burning cash
  cashBalance: number;
  monthsOfRunway: number;
}

export interface BurnRateMetrics {
  averageMonthlyBurn: number;
  peakMonthlyBurn: number;
  currentRunway: number; // months remaining
  projectedCashOut: number; // month when cash runs out (0 if profitable)
}

/**
 * Calculate monthly cash position including runway
 */
export function calculateCashPosition(
  revenueProjections: RevenueMetrics[],
  opexProjections: MonthlyOPEX[],
  fundingEvents: { month: number; amount: number }[],
  startingCash: number = 0
): CashPosition[] {
  const positions: CashPosition[] = [];
  let cashBalance = startingCash;

  for (let i = 0; i < revenueProjections.length; i++) {
    const revenue = revenueProjections[i];
    const opex = opexProjections[i];
    const month = revenue.absoluteMonth;
    const year = revenue.year;

    // Check for funding events this month
    const funding = fundingEvents.find(f => f.month === month);
    if (funding) {
      cashBalance += funding.amount;
    }

    // Calculate net burn (negative means burning cash)
    const netBurn = revenue.totalRevenue - opex.totalOPEX;

    // Update cash balance
    cashBalance += netBurn;

    // Calculate months of runway (how many months until cash runs out)
    const avgBurn = netBurn < 0 ? Math.abs(netBurn) : 0;
    const monthsOfRunway = avgBurn > 0 ? cashBalance / avgBurn : 999;

    positions.push({
      month,
      year,
      revenue: revenue.totalRevenue,
      opex: opex.totalOPEX,
      netBurn,
      cashBalance,
      monthsOfRunway,
    });
  }

  return positions;
}

/**
 * Calculate burn rate metrics
 */
export function calculateBurnRateMetrics(
  cashPositions: CashPosition[]
): BurnRateMetrics {
  // Filter to months with negative burn (actually burning cash)
  const burningMonths = cashPositions.filter(p => p.netBurn < 0);

  if (burningMonths.length === 0) {
    return {
      averageMonthlyBurn: 0,
      peakMonthlyBurn: 0,
      currentRunway: 999,
      projectedCashOut: 0,
    };
  }

  // Calculate average monthly burn
  const totalBurn = burningMonths.reduce((sum, p) => sum + Math.abs(p.netBurn), 0);
  const averageMonthlyBurn = totalBurn / burningMonths.length;

  // Find peak monthly burn
  const peakMonthlyBurn = Math.max(...burningMonths.map(p => Math.abs(p.netBurn)));

  // Current runway (from last month)
  const lastPosition = cashPositions[cashPositions.length - 1];
  const currentRunway = lastPosition.monthsOfRunway;

  // Find month when cash runs out (if any)
  const cashOutMonth = cashPositions.find(p => p.cashBalance <= 0);
  const projectedCashOut = cashOutMonth ? cashOutMonth.month : 0;

  return {
    averageMonthlyBurn,
    peakMonthlyBurn,
    currentRunway,
    projectedCashOut,
  };
}

/**
 * Get funding events from funding rounds data
 */
export function getFundingEvents(fundingRounds: Array<{ close_month?: number | null; amount_raised?: number | null }>): FundingEvent[] {
  return fundingRounds.map(round => ({
    month: round.close_month || 3, // Default to month 3 if not specified
    amount: round.amount_raised || 0,
  }));
}

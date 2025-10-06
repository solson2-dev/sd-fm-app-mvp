/**
 * Equity & Cap Table Calculations
 * Tracks founder equity, ESOP, dilution across funding rounds
 */

export interface FounderEquity {
  name: string;
  initialOwnership: number; // % (0-1)
  currentOwnership: number; // % after dilution
  shares: number;
}

export interface ESOPPool {
  poolSize: number; // % (0-1)
  allocated: number; // % allocated
  available: number; // % available
  shares: number;
}

export interface FundingRoundEquity {
  roundName: string;
  amount: number;
  valuation: number; // Post-money
  investorOwnership: number; // % (0-1)
  pricePerShare: number;
  sharesIssued: number;
}

export interface CapTableEntry {
  stakeholder: string;
  type: 'Founder' | 'ESOP' | 'Investor';
  shares: number;
  ownership: number; // % (0-1)
  roundName?: string;
}

export interface ExitScenario {
  exitYear: number;
  arrMultiple: number; // e.g., 10x ARR
  ebitdaMultiple: number; // e.g., 15x EBITDA
  exitValuation: number;
  roundName: string;
  investmentAmount: number;
  equityOwnership: number;
  investorReturn: number;
  roi: number; // Multiple (e.g., 5.2x)
  roiPercent: number; // % (e.g., 420%)
  cagr: number; // % annual growth
}

/**
 * Calculate initial cap table with founders and ESOP
 */
export function initializeCapTable(
  founders: { name: string; ownership: number }[],
  esopPoolSize: number, // % (0-1)
  authorizedShares: number = 10000000
): {
  founders: FounderEquity[];
  esop: ESOPPool;
  totalShares: number;
} {
  // ESOP comes from founder dilution
  const founderTotalOwnership = 1 - esopPoolSize;
  const esopShares = Math.round(authorizedShares * esopPoolSize);

  const foundersData: FounderEquity[] = founders.map((f) => ({
    name: f.name,
    initialOwnership: f.ownership * founderTotalOwnership,
    currentOwnership: f.ownership * founderTotalOwnership,
    shares: Math.round(authorizedShares * f.ownership * founderTotalOwnership),
  }));

  const founderShares = foundersData.reduce((sum, f) => sum + f.shares, 0);
  const totalShares = founderShares + esopShares;

  return {
    founders: foundersData,
    esop: {
      poolSize: esopPoolSize,
      allocated: 0,
      available: esopPoolSize,
      shares: esopShares,
    },
    totalShares,
  };
}

/**
 * Calculate dilution from a funding round
 */
export function calculateFundingRoundDilution(
  currentCapTable: CapTableEntry[],
  fundingAmount: number,
  postMoneyValuation: number
): {
  newInvestorOwnership: number;
  dilutionFactor: number; // Multiply existing ownership by this
  pricePerShare: number;
  sharesIssued: number;
  updatedCapTable: CapTableEntry[];
} {
  const currentShares = currentCapTable.reduce((sum, entry) => sum + entry.shares, 0);

  // New investor ownership = investment / post-money valuation
  const newInvestorOwnership = fundingAmount / postMoneyValuation;

  // Dilution factor for existing shareholders
  const dilutionFactor = 1 - newInvestorOwnership;

  // Price per share = post-money valuation / total shares after round
  // Total shares after = current shares / (1 - new investor %)
  const totalSharesAfter = currentShares / dilutionFactor;
  const sharesIssued = totalSharesAfter - currentShares;
  const pricePerShare = postMoneyValuation / totalSharesAfter;

  // Update existing cap table with dilution
  const updatedCapTable: CapTableEntry[] = currentCapTable.map((entry) => ({
    ...entry,
    ownership: entry.ownership * dilutionFactor,
  }));

  return {
    newInvestorOwnership,
    dilutionFactor,
    pricePerShare,
    sharesIssued,
    updatedCapTable,
  };
}

/**
 * Calculate exit scenario returns
 */
export function calculateExitReturns(
  exitYear: number,
  exitValuation: number,
  investmentAmount: number,
  equityOwnership: number,
  investmentYear: number = 1
): {
  equityValue: number;
  roi: number;
  roiPercent: number;
  cagr: number;
} {
  const equityValue = exitValuation * equityOwnership;
  const roi = equityValue / investmentAmount;
  const roiPercent = (roi - 1) * 100;

  // CAGR = (Ending Value / Beginning Value)^(1/years) - 1
  const yearsHeld = exitYear - investmentYear;
  const cagr = yearsHeld > 0
    ? (Math.pow(roi, 1 / yearsHeld) - 1) * 100
    : 0;

  return {
    equityValue,
    roi,
    roiPercent,
    cagr,
  };
}

/**
 * Calculate exit valuation based on ARR or EBITDA multiples
 */
export function calculateExitValuation(
  arr: number,
  ebitda: number,
  arrMultiple: number,
  ebitdaMultiple: number,
  method: 'arr' | 'ebitda' | 'average' = 'average'
): number {
  const arrValuation = arr * arrMultiple;
  const ebitdaValuation = ebitda * ebitdaMultiple;

  switch (method) {
    case 'arr':
      return arrValuation;
    case 'ebitda':
      return ebitdaValuation;
    case 'average':
    default:
      return (arrValuation + ebitdaValuation) / 2;
  }
}

/**
 * Generate complete cap table across multiple rounds
 */
export function generateCapTable(
  founders: { name: string; ownership: number }[],
  esopPoolSize: number,
  fundingRounds: { roundName: string; amount: number; valuation: number }[]
): CapTableEntry[] {
  // Initialize with founders and ESOP
  const initial = initializeCapTable(founders, esopPoolSize);

  let capTable: CapTableEntry[] = [
    ...initial.founders.map((f) => ({
      stakeholder: f.name,
      type: 'Founder' as const,
      shares: f.shares,
      ownership: f.currentOwnership,
    })),
    {
      stakeholder: 'ESOP Pool',
      type: 'ESOP' as const,
      shares: initial.esop.shares,
      ownership: initial.esop.poolSize,
    },
  ];

  // Apply each funding round
  for (const round of fundingRounds) {
    const dilution = calculateFundingRoundDilution(
      capTable,
      round.amount,
      round.valuation
    );

    capTable = dilution.updatedCapTable;

    // Add new investor
    capTable.push({
      stakeholder: `${round.roundName} Investors`,
      type: 'Investor',
      shares: dilution.sharesIssued,
      ownership: dilution.newInvestorOwnership,
      roundName: round.roundName,
    });
  }

  return capTable;
}

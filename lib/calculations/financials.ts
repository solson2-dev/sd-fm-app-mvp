/**
 * Financial Statements Calculations
 * Generates Income Statement, Cash Flow, and Balance Sheet
 */

export interface IncomeStatement {
  year: number;
  revenue: number;
  cogs: number;
  grossProfit: number;
  grossMargin: number;
  opex: number;
  ebitda: number;
  ebitdaMargin: number;
  depreciation: number;
  ebit: number;
  interestExpense: number;
  ebt: number;
  taxes: number;
  netIncome: number;
  netMargin: number;
}

export interface CashFlowStatement {
  year: number;
  netIncome: number;
  depreciation: number;
  operatingCashFlow: number;
  capex: number;
  investingCashFlow: number;
  debtProceeds: number;
  equityProceeds: number;
  financingCashFlow: number;
  netCashFlow: number;
  cashBalance: number;
}

export interface BalanceSheet {
  year: number;
  cash: number;
  accountsReceivable: number;
  totalAssets: number;
  accountsPayable: number;
  totalLiabilities: number;
  equity: number;
}

/**
 * Calculate Income Statement for a given year
 */
export function calculateIncomeStatement(
  year: number,
  revenue: number,
  cogs: number,
  opex: number,
  options: {
    depreciationRate?: number;
    taxRate?: number;
    interestExpense?: number;
  } = {}
): IncomeStatement {
  const {
    depreciationRate = 0.1, // 10% of revenue
    taxRate = 0.21, // 21% federal tax
    interestExpense = 0,
  } = options;

  const grossProfit = revenue - cogs;
  const grossMargin = revenue > 0 ? grossProfit / revenue : 0;

  const ebitda = grossProfit - opex;
  const ebitdaMargin = revenue > 0 ? ebitda / revenue : 0;

  const depreciation = revenue * depreciationRate;
  const ebit = ebitda - depreciation;

  const ebt = ebit - interestExpense;
  const taxes = ebt > 0 ? ebt * taxRate : 0;
  const netIncome = ebt - taxes;
  const netMargin = revenue > 0 ? netIncome / revenue : 0;

  return {
    year,
    revenue,
    cogs,
    grossProfit,
    grossMargin,
    opex,
    ebitda,
    ebitdaMargin,
    depreciation,
    ebit,
    interestExpense,
    ebt,
    taxes,
    netIncome,
    netMargin,
  };
}

/**
 * Calculate Cash Flow Statement for a given year
 */
export function calculateCashFlow(
  year: number,
  incomeStatement: IncomeStatement,
  previousCashBalance: number,
  options: {
    capexRate?: number;
    debtProceeds?: number;
    equityProceeds?: number;
  } = {}
): CashFlowStatement {
  const {
    capexRate = 0.05, // 5% of revenue
    debtProceeds = 0,
    equityProceeds = 0,
  } = options;

  const { netIncome, depreciation, revenue } = incomeStatement;

  // Operating cash flow = Net income + Depreciation (non-cash expense)
  const operatingCashFlow = netIncome + depreciation;

  // Investing activities
  const capex = -revenue * capexRate; // Negative = cash outflow
  const investingCashFlow = capex;

  // Financing activities
  const financingCashFlow = debtProceeds + equityProceeds;

  // Net cash flow
  const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow;
  const cashBalance = previousCashBalance + netCashFlow;

  return {
    year,
    netIncome,
    depreciation,
    operatingCashFlow,
    capex,
    investingCashFlow,
    debtProceeds,
    equityProceeds,
    financingCashFlow,
    netCashFlow,
    cashBalance,
  };
}

/**
 * Calculate Balance Sheet for a given year
 */
export function calculateBalanceSheet(
  year: number,
  cashBalance: number,
  revenue: number,
  opex: number,
  cumulativeEquity: number
): BalanceSheet {
  // Accounts Receivable = ~8% of revenue (1 month)
  const accountsReceivable = revenue * 0.0833;

  // Total Assets = Cash + AR
  const totalAssets = cashBalance + accountsReceivable;

  // Accounts Payable = ~8% of OPEX (1 month)
  const accountsPayable = opex * 0.0833;

  // Total Liabilities (simplified - just AP for now)
  const totalLiabilities = accountsPayable;

  // Equity = Assets - Liabilities
  const equity = totalAssets - totalLiabilities;

  return {
    year,
    cash: cashBalance,
    accountsReceivable,
    totalAssets,
    accountsPayable,
    totalLiabilities,
    equity,
  };
}

/**
 * Generate complete financial statements for multiple years
 */
export function generateFinancialStatements(
  years: number,
  revenueData: { year: number; revenue: number; cogs: number }[],
  opexData: { year: number; opex: number }[],
  fundingRounds: { year: number; amount: number }[] = []
): {
  incomeStatements: IncomeStatement[];
  cashFlows: CashFlowStatement[];
  balanceSheets: BalanceSheet[];
} {
  const incomeStatements: IncomeStatement[] = [];
  const cashFlows: CashFlowStatement[] = [];
  const balanceSheets: BalanceSheet[] = [];

  let cashBalance = 0;
  let cumulativeEquity = 0;

  for (let year = 1; year <= years; year++) {
    // Find revenue and opex for this year
    const revenueYear = revenueData.find((r) => r.year === year);
    const opexYear = opexData.find((o) => o.year === year);
    const funding = fundingRounds.find((f) => f.year === year);

    const revenue = revenueYear?.revenue || 0;
    const cogs = revenueYear?.cogs || 0;
    const opex = opexYear?.opex || 0;
    const equityProceeds = funding?.amount || 0;

    // Income Statement
    const is = calculateIncomeStatement(year, revenue, cogs, opex);
    incomeStatements.push(is);

    // Cash Flow
    const cf = calculateCashFlow(year, is, cashBalance, { equityProceeds });
    cashFlows.push(cf);
    cashBalance = cf.cashBalance;
    cumulativeEquity += equityProceeds;

    // Balance Sheet
    const bs = calculateBalanceSheet(year, cashBalance, revenue, opex, cumulativeEquity);
    balanceSheets.push(bs);
  }

  return { incomeStatements, cashFlows, balanceSheets };
}

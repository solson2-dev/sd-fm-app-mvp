import * as XLSX from 'xlsx';
import type { IncomeStatement, CashFlowStatement, BalanceSheet } from '@/lib/calculations/financials';
import type { CapTableEntry } from '@/lib/calculations/equity';
import type { RevenueMetrics } from '@/lib/calculations/revenue';
import type { FundingRoundExportData } from '@/lib/types/database';

export interface ExcelExportOptions {
  companyName?: string;
  scenarioName?: string;
}

export function exportFinancialsToExcel(
  incomeStatements: IncomeStatement[],
  cashFlows: CashFlowStatement[],
  balanceSheets: BalanceSheet[],
  revenueProjections: RevenueMetrics[] = [],
  options: ExcelExportOptions = {}
) {
  const { companyName = 'Studio Datum', scenarioName = 'Base Case' } = options;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Income Statement Sheet
  const isData = [
    [`${companyName} - ${scenarioName}`],
    ['Income Statement'],
    [],
    [
      'Year',
      'Revenue',
      'COGS',
      'Gross Profit',
      'Gross Margin %',
      'OPEX',
      'EBITDA',
      'EBITDA Margin %',
      'Depreciation',
      'EBIT',
      'Interest',
      'EBT',
      'Taxes',
      'Net Income',
      'Net Margin %',
    ],
    ...incomeStatements.map((is) => [
      is.year,
      is.revenue,
      is.cogs,
      is.grossProfit,
      is.grossMargin,
      is.opex,
      is.ebitda,
      is.ebitdaMargin,
      is.depreciation,
      is.ebit,
      is.interestExpense,
      is.ebt,
      is.taxes,
      is.netIncome,
      is.netMargin,
    ]),
  ];
  const isSheet = XLSX.utils.aoa_to_sheet(isData);

  // Format currency columns
  const currencyCols = ['B', 'C', 'D', 'F', 'G', 'I', 'J', 'K', 'L', 'M', 'N'];
  const percentCols = ['E', 'H', 'O'];

  for (let row = 4; row < isData.length + 1; row++) {
    currencyCols.forEach((col) => {
      const cell = `${col}${row}`;
      if (isSheet[cell]) {
        isSheet[cell].z = '$#,##0';
      }
    });
    percentCols.forEach((col) => {
      const cell = `${col}${row}`;
      if (isSheet[cell]) {
        isSheet[cell].z = '0.0%';
      }
    });
  }

  XLSX.utils.book_append_sheet(wb, isSheet, 'Income Statement');

  // Cash Flow Sheet
  const cfData = [
    [`${companyName} - ${scenarioName}`],
    ['Cash Flow Statement'],
    [],
    [
      'Year',
      'Net Income',
      'Depreciation',
      'Operating CF',
      'CapEx',
      'Investing CF',
      'Debt Proceeds',
      'Equity Proceeds',
      'Financing CF',
      'Net Cash Flow',
      'Cash Balance',
    ],
    ...cashFlows.map((cf) => [
      cf.year,
      cf.netIncome,
      cf.depreciation,
      cf.operatingCashFlow,
      cf.capex,
      cf.investingCashFlow,
      cf.debtProceeds,
      cf.equityProceeds,
      cf.financingCashFlow,
      cf.netCashFlow,
      cf.cashBalance,
    ]),
  ];
  const cfSheet = XLSX.utils.aoa_to_sheet(cfData);
  XLSX.utils.book_append_sheet(wb, cfSheet, 'Cash Flow');

  // Balance Sheet
  const bsData = [
    [`${companyName} - ${scenarioName}`],
    ['Balance Sheet'],
    [],
    ['Year', 'Cash', 'A/R', 'Total Assets', 'A/P', 'Total Liabilities', 'Equity'],
    ...balanceSheets.map((bs) => [
      bs.year,
      bs.cash,
      bs.accountsReceivable,
      bs.totalAssets,
      bs.accountsPayable,
      bs.totalLiabilities,
      bs.equity,
    ]),
  ];
  const bsSheet = XLSX.utils.aoa_to_sheet(bsData);
  XLSX.utils.book_append_sheet(wb, bsSheet, 'Balance Sheet');

  // Revenue Projections (if provided)
  if (revenueProjections.length > 0) {
    const revData = [
      [`${companyName} - ${scenarioName}`],
      ['Revenue Projections'],
      [],
      [
        'Year',
        'Total Customers',
        'New Customers',
        'Churned Customers',
        'Total Revenue',
        'ARR',
        'Setup Fees',
        'Market Penetration %',
      ],
      ...revenueProjections.map((rev) => [
        rev.year,
        rev.totalCustomers,
        rev.newCustomers,
        rev.churnedCustomers,
        rev.totalRevenue,
        rev.arr,
        rev.setupFees,
        rev.marketPenetration,
      ]),
    ];
    const revSheet = XLSX.utils.aoa_to_sheet(revData);
    XLSX.utils.book_append_sheet(wb, revSheet, 'Revenue');
  }

  return wb;
}

export function exportCapTableToExcel(
  capTable: CapTableEntry[],
  fundingRounds: FundingRoundExportData[] = [],
  options: ExcelExportOptions = {}
) {
  const { companyName = 'Studio Datum', scenarioName = 'Base Case' } = options;

  const wb = XLSX.utils.book_new();

  // Cap Table Sheet
  const capData = [
    [`${companyName} - ${scenarioName}`],
    ['Capitalization Table'],
    [],
    ['Stakeholder', 'Type', 'Shares', 'Ownership %', 'Round'],
    ...capTable.map((entry) => [
      entry.stakeholder,
      entry.type,
      entry.shares,
      entry.ownership,
      entry.roundName || '',
    ]),
  ];
  const capSheet = XLSX.utils.aoa_to_sheet(capData);
  XLSX.utils.book_append_sheet(wb, capSheet, 'Cap Table');

  // Funding Rounds Sheet
  if (fundingRounds.length > 0) {
    const fundingData = [
      [`${companyName} - ${scenarioName}`],
      ['Funding Rounds'],
      [],
      [
        'Round',
        'Date',
        'Amount Raised',
        'Pre-Money Valuation',
        'Post-Money Valuation',
        'Price per Share',
        'Shares Issued',
        'Investor Ownership %',
      ],
      ...fundingRounds.map((round) => [
        round.roundName,
        round.date,
        round.amount,
        round.preMoneyValuation,
        round.postMoneyValuation,
        round.pricePerShare,
        round.sharesIssued,
        round.investorOwnership,
      ]),
    ];
    const fundingSheet = XLSX.utils.aoa_to_sheet(fundingData);
    XLSX.utils.book_append_sheet(wb, fundingSheet, 'Funding Rounds');
  }

  return wb;
}

export function downloadExcel(workbook: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(workbook, filename);
}

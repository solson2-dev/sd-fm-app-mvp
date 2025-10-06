import { describe, it, expect } from 'vitest';
import {
  calculateIncomeStatement,
  calculateCashFlow,
  calculateBalanceSheet,
  generateFinancialStatements,
  type IncomeStatement,
  type CashFlowStatement,
} from '../financials';

describe('Financial Statements Calculations', () => {
  describe('calculateIncomeStatement', () => {
    it('should calculate basic income statement', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);

      expect(is.year).toBe(1);
      expect(is.revenue).toBe(1000000);
      expect(is.cogs).toBe(250000);
      expect(is.opex).toBe(500000);
    });

    it('should calculate gross profit correctly', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);

      expect(is.grossProfit).toBe(750000); // 1M - 250k
      expect(is.grossMargin).toBeCloseTo(0.75, 5); // 75%
    });

    it('should calculate EBITDA correctly', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);

      expect(is.ebitda).toBe(250000); // Gross profit - OPEX
      expect(is.ebitdaMargin).toBeCloseTo(0.25, 5); // 25%
    });

    it('should apply depreciation', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000, {
        depreciationRate: 0.1,
      });

      expect(is.depreciation).toBe(100000); // 10% of 1M
      expect(is.ebit).toBe(150000); // EBITDA - depreciation
    });

    it('should calculate taxes on positive EBT only', () => {
      const profitableIS = calculateIncomeStatement(1, 2000000, 400000, 500000);
      const lossIS = calculateIncomeStatement(1, 500000, 200000, 600000);

      expect(profitableIS.taxes).toBeGreaterThan(0);
      expect(lossIS.taxes).toBe(0); // No tax on losses
    });

    it('should apply 21% tax rate by default', () => {
      const is = calculateIncomeStatement(1, 2000000, 400000, 500000);

      // EBT = Revenue - COGS - OPEX - Depreciation - Interest
      const expectedTax = is.ebt * 0.21;
      expect(is.taxes).toBeCloseTo(expectedTax, 2);
    });

    it('should calculate net income correctly', () => {
      const is = calculateIncomeStatement(1, 2000000, 400000, 500000);

      expect(is.netIncome).toBe(is.ebt - is.taxes);
      expect(is.netMargin).toBeCloseTo(is.netIncome / is.revenue, 5);
    });

    it('should handle zero revenue', () => {
      const is = calculateIncomeStatement(1, 0, 0, 100000);

      expect(is.grossMargin).toBe(0);
      expect(is.ebitdaMargin).toBe(0);
      expect(is.netMargin).toBe(0);
    });

    it('should include interest expense in EBT', () => {
      const withInterest = calculateIncomeStatement(1, 1000000, 200000, 300000, {
        interestExpense: 50000,
      });
      const withoutInterest = calculateIncomeStatement(1, 1000000, 200000, 300000);

      expect(withInterest.ebt).toBe(withoutInterest.ebt - 50000);
    });

    it('should handle custom tax rate', () => {
      const is = calculateIncomeStatement(1, 1000000, 200000, 300000, {
        taxRate: 0.25,
      });

      if (is.ebt > 0) {
        expect(is.taxes).toBeCloseTo(is.ebt * 0.25, 2);
      }
    });
  });

  describe('calculateCashFlow', () => {
    let sampleIS: IncomeStatement;

    beforeEach(() => {
      sampleIS = calculateIncomeStatement(1, 1000000, 250000, 500000);
    });

    it('should calculate operating cash flow', () => {
      const cf = calculateCashFlow(1, sampleIS, 0);

      // Operating CF = Net Income + Depreciation (non-cash)
      expect(cf.operatingCashFlow).toBe(
        sampleIS.netIncome + sampleIS.depreciation
      );
    });

    it('should calculate investing cash flow (CAPEX)', () => {
      const cf = calculateCashFlow(1, sampleIS, 0, { capexRate: 0.05 });

      // CAPEX = -5% of revenue
      expect(cf.capex).toBe(-50000);
      expect(cf.investingCashFlow).toBe(cf.capex);
    });

    it('should include equity and debt financing', () => {
      const cf = calculateCashFlow(1, sampleIS, 0, {
        equityProceeds: 1000000,
        debtProceeds: 500000,
      });

      expect(cf.equityProceeds).toBe(1000000);
      expect(cf.debtProceeds).toBe(500000);
      expect(cf.financingCashFlow).toBe(1500000);
    });

    it('should calculate net cash flow', () => {
      const cf = calculateCashFlow(1, sampleIS, 0);

      expect(cf.netCashFlow).toBe(
        cf.operatingCashFlow + cf.investingCashFlow + cf.financingCashFlow
      );
    });

    it('should update cash balance', () => {
      const previousBalance = 500000;
      const cf = calculateCashFlow(1, sampleIS, previousBalance);

      expect(cf.cashBalance).toBe(previousBalance + cf.netCashFlow);
    });

    it('should handle negative cash flow (burning cash)', () => {
      const lossIS = calculateIncomeStatement(1, 100000, 50000, 200000);
      const cf = calculateCashFlow(1, lossIS, 500000);

      expect(cf.netCashFlow).toBeLessThan(0);
      expect(cf.cashBalance).toBeLessThan(500000);
    });

    it('should add back depreciation as non-cash expense', () => {
      const cf = calculateCashFlow(1, sampleIS, 0);

      // Depreciation should be added back to net income
      expect(cf.operatingCashFlow).toBeGreaterThan(sampleIS.netIncome);
    });
  });

  describe('calculateBalanceSheet', () => {
    it('should calculate accounts receivable as % of revenue', () => {
      const bs = calculateBalanceSheet(1, 500000, 1200000, 600000, 1000000);

      // AR = 8.33% of revenue (1 month)
      expect(bs.accountsReceivable).toBeCloseTo(1200000 * 0.0833, 0);
    });

    it('should calculate accounts payable as % of OPEX', () => {
      const bs = calculateBalanceSheet(1, 500000, 1200000, 600000, 1000000);

      // AP = 8.33% of OPEX (1 month)
      expect(bs.accountsPayable).toBeCloseTo(600000 * 0.0833, 0);
    });

    it('should calculate total assets', () => {
      const bs = calculateBalanceSheet(1, 500000, 1200000, 600000, 1000000);

      expect(bs.totalAssets).toBe(bs.cash + bs.accountsReceivable);
    });

    it('should calculate equity from balance sheet equation', () => {
      const bs = calculateBalanceSheet(1, 500000, 1200000, 600000, 1000000);

      // Assets = Liabilities + Equity
      expect(bs.equity).toBe(bs.totalAssets - bs.totalLiabilities);
    });

    it('should handle zero revenue and OPEX', () => {
      const bs = calculateBalanceSheet(1, 100000, 0, 0, 100000);

      expect(bs.accountsReceivable).toBe(0);
      expect(bs.accountsPayable).toBe(0);
      expect(bs.totalAssets).toBe(100000);
    });

    it('should maintain accounting equation: Assets = Liabilities + Equity', () => {
      const bs = calculateBalanceSheet(1, 500000, 1200000, 600000, 1000000);

      expect(bs.totalAssets).toBeCloseTo(bs.totalLiabilities + bs.equity, 2);
    });
  });

  describe('generateFinancialStatements', () => {
    const revenueData = [
      { year: 1, revenue: 1000000, cogs: 250000 },
      { year: 2, revenue: 2000000, cogs: 500000 },
      { year: 3, revenue: 4000000, cogs: 1000000 },
    ];

    const opexData = [
      { year: 1, opex: 800000 },
      { year: 2, opex: 1200000 },
      { year: 3, opex: 1800000 },
    ];

    const fundingRounds = [{ year: 1, amount: 2000000 }];

    it('should generate statements for all years', () => {
      const statements = generateFinancialStatements(
        3,
        revenueData,
        opexData,
        fundingRounds
      );

      expect(statements.incomeStatements).toHaveLength(3);
      expect(statements.cashFlows).toHaveLength(3);
      expect(statements.balanceSheets).toHaveLength(3);
    });

    it('should maintain cash balance continuity', () => {
      const statements = generateFinancialStatements(
        3,
        revenueData,
        opexData,
        fundingRounds
      );

      // Year 2 starting cash = Year 1 ending cash
      expect(statements.cashFlows[1].cashBalance).toBeCloseTo(
        statements.cashFlows[0].cashBalance +
          statements.cashFlows[1].netCashFlow,
        2
      );
    });

    it('should apply funding in correct year', () => {
      const statements = generateFinancialStatements(
        3,
        revenueData,
        opexData,
        fundingRounds
      );

      expect(statements.cashFlows[0].equityProceeds).toBe(2000000);
      expect(statements.cashFlows[1].equityProceeds).toBe(0);
    });

    it('should handle missing revenue/opex data gracefully', () => {
      const incompleteRevenue = [{ year: 1, revenue: 1000000, cogs: 250000 }];
      const incompleteOpex = [{ year: 1, opex: 500000 }];

      const statements = generateFinancialStatements(
        2,
        incompleteRevenue,
        incompleteOpex
      );

      expect(statements.incomeStatements[1].revenue).toBe(0);
      expect(statements.incomeStatements[1].opex).toBe(0);
    });

    it('should generate consistent statements', () => {
      const statements = generateFinancialStatements(
        3,
        revenueData,
        opexData,
        fundingRounds
      );

      statements.incomeStatements.forEach((is, index) => {
        expect(is.year).toBe(index + 1);
      });

      statements.cashFlows.forEach((cf, index) => {
        expect(cf.year).toBe(index + 1);
      });

      statements.balanceSheets.forEach((bs, index) => {
        expect(bs.year).toBe(index + 1);
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero revenue scenario', () => {
      const is = calculateIncomeStatement(1, 0, 0, 100000);

      expect(is.revenue).toBe(0);
      expect(is.grossProfit).toBe(0);
      expect(is.ebitda).toBe(-100000);
      expect(is.netIncome).toBe(-100000);
    });

    it('should handle loss scenario (negative net income)', () => {
      const is = calculateIncomeStatement(1, 500000, 200000, 600000);

      expect(is.netIncome).toBeLessThan(0);
      expect(is.taxes).toBe(0); // No tax on losses
    });

    it('should handle zero OPEX scenario', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 0);

      expect(is.ebitda).toBe(is.grossProfit);
      expect(is.netIncome).toBeGreaterThan(0);
    });

    it('should handle negative cash balance', () => {
      const lossIS = calculateIncomeStatement(1, 100000, 50000, 500000);
      const cf = calculateCashFlow(1, lossIS, 100000);

      // Company is burning more than it has
      if (cf.netCashFlow < -100000) {
        expect(cf.cashBalance).toBeLessThan(0);
      }
    });

    it('should never have negative gross margin greater than 100%', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);

      expect(is.grossMargin).toBeGreaterThanOrEqual(-1);
      expect(is.grossMargin).toBeLessThanOrEqual(1);
    });
  });

  describe('Property-Based Tests', () => {
    it('gross profit should equal revenue minus COGS', () => {
      const revenue = 1000000;
      const cogs = 250000;
      const is = calculateIncomeStatement(1, revenue, cogs, 500000);

      expect(is.grossProfit).toBe(revenue - cogs);
    });

    it('EBITDA should equal gross profit minus OPEX', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);

      expect(is.ebitda).toBe(is.grossProfit - is.opex);
    });

    it('EBIT should equal EBITDA minus depreciation', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);

      expect(is.ebit).toBeCloseTo(is.ebitda - is.depreciation, 2);
    });

    it('net income should equal EBT minus taxes', () => {
      const is = calculateIncomeStatement(1, 2000000, 400000, 500000);

      expect(is.netIncome).toBeCloseTo(is.ebt - is.taxes, 2);
    });

    it('margins should be calculated correctly', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);

      if (is.revenue > 0) {
        expect(is.grossMargin).toBeCloseTo(is.grossProfit / is.revenue, 5);
        expect(is.ebitdaMargin).toBeCloseTo(is.ebitda / is.revenue, 5);
        expect(is.netMargin).toBeCloseTo(is.netIncome / is.revenue, 5);
      }
    });

    it('balance sheet should always balance', () => {
      const bs = calculateBalanceSheet(1, 500000, 1200000, 600000, 1000000);

      expect(bs.totalAssets).toBeCloseTo(bs.totalLiabilities + bs.equity, 2);
    });

    it('cash flow should be consistent with cash balance', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);
      const previousBalance = 500000;
      const cf = calculateCashFlow(1, is, previousBalance);

      expect(cf.cashBalance).toBe(previousBalance + cf.netCashFlow);
    });

    it('operating cash flow should include non-cash adjustments', () => {
      const is = calculateIncomeStatement(1, 1000000, 250000, 500000);
      const cf = calculateCashFlow(1, is, 0);

      // Operating CF = Net Income + Depreciation
      expect(cf.operatingCashFlow).toBeCloseTo(
        is.netIncome + is.depreciation,
        2
      );
    });
  });

  describe('Multi-Year Validation', () => {
    it('should show revenue growth impact on statements', () => {
      const revenueData = [
        { year: 1, revenue: 1000000, cogs: 250000 },
        { year: 2, revenue: 2000000, cogs: 500000 },
        { year: 3, revenue: 4000000, cogs: 1000000 },
      ];
      const opexData = [
        { year: 1, opex: 800000 },
        { year: 2, opex: 900000 },
        { year: 3, opex: 1000000 },
      ];

      const statements = generateFinancialStatements(3, revenueData, opexData);

      // Revenue should grow year over year
      expect(statements.incomeStatements[1].revenue).toBeGreaterThan(
        statements.incomeStatements[0].revenue
      );
      expect(statements.incomeStatements[2].revenue).toBeGreaterThan(
        statements.incomeStatements[1].revenue
      );
    });

    it('should show improving profitability as company scales', () => {
      const revenueData = [
        { year: 1, revenue: 500000, cogs: 125000 },
        { year: 2, revenue: 2000000, cogs: 500000 },
        { year: 3, revenue: 5000000, cogs: 1250000 },
      ];
      const opexData = [
        { year: 1, opex: 800000 },
        { year: 2, opex: 1000000 },
        { year: 3, opex: 1200000 },
      ];

      const statements = generateFinancialStatements(3, revenueData, opexData);

      // Year 1 likely loss, Year 3 should be profitable
      expect(statements.incomeStatements[2].netIncome).toBeGreaterThan(
        statements.incomeStatements[0].netIncome
      );
    });

    it('should accumulate cash over profitable years', () => {
      const revenueData = [
        { year: 1, revenue: 2000000, cogs: 400000 },
        { year: 2, revenue: 4000000, cogs: 800000 },
        { year: 3, revenue: 6000000, cogs: 1200000 },
      ];
      const opexData = [
        { year: 1, opex: 500000 },
        { year: 2, opex: 600000 },
        { year: 3, opex: 700000 },
      ];
      const fundingRounds = [{ year: 1, amount: 1000000 }];

      const statements = generateFinancialStatements(
        3,
        revenueData,
        opexData,
        fundingRounds
      );

      // Cash should accumulate if profitable
      expect(statements.cashFlows[2].cashBalance).toBeGreaterThan(
        statements.cashFlows[0].cashBalance
      );
    });
  });
});

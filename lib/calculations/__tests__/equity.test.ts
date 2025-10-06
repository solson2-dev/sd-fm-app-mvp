import { describe, it, expect } from 'vitest';
import {
  initializeCapTable,
  calculateFundingRoundDilution,
  calculateExitReturns,
  calculateExitValuation,
  calculateESOPRefresh,
  generateCapTable,
  type CapTableEntry,
} from '../equity';

describe('Equity & Cap Table Calculations', () => {
  describe('initializeCapTable', () => {
    it('should create initial cap table with founders and ESOP', () => {
      const founders = [
        { name: 'Founder A', ownership: 0.6 },
        { name: 'Founder B', ownership: 0.4 },
      ];
      const esopPoolSize = 0.1;

      const capTable = initializeCapTable(founders, esopPoolSize);

      expect(capTable.founders).toHaveLength(2);
      expect(capTable.esop.poolSize).toBe(0.1);
    });

    it('should allocate ESOP from founder dilution', () => {
      const founders = [{ name: 'Founder A', ownership: 1.0 }];
      const esopPoolSize = 0.1;

      const capTable = initializeCapTable(founders, esopPoolSize);

      // Founder should have 90% after ESOP carved out
      expect(capTable.founders[0].currentOwnership).toBeCloseTo(0.9, 5);
      expect(capTable.esop.poolSize).toBe(0.1);
    });

    it('should distribute ownership proportionally among founders', () => {
      const founders = [
        { name: 'Founder A', ownership: 0.6 },
        { name: 'Founder B', ownership: 0.4 },
      ];
      const esopPoolSize = 0.1;

      const capTable = initializeCapTable(founders, esopPoolSize);

      // After 10% ESOP, Founder A should have 54% (60% of 90%)
      // Founder B should have 36% (40% of 90%)
      expect(capTable.founders[0].currentOwnership).toBeCloseTo(0.54, 5);
      expect(capTable.founders[1].currentOwnership).toBeCloseTo(0.36, 5);
    });

    it('should create correct number of shares', () => {
      const founders = [{ name: 'Founder A', ownership: 1.0 }];
      const esopPoolSize = 0.15;
      const authorizedShares = 10000000;

      const capTable = initializeCapTable(
        founders,
        esopPoolSize,
        authorizedShares
      );

      expect(capTable.totalShares).toBeLessThanOrEqual(authorizedShares);
      expect(capTable.founders[0].shares + capTable.esop.shares).toBeCloseTo(
        capTable.totalShares,
        0
      );
    });

    it('should have total ownership equal to 100%', () => {
      const founders = [
        { name: 'Founder A', ownership: 0.5 },
        { name: 'Founder B', ownership: 0.5 },
      ];
      const esopPoolSize = 0.1;

      const capTable = initializeCapTable(founders, esopPoolSize);

      const totalOwnership =
        capTable.founders.reduce((sum, f) => sum + f.currentOwnership, 0) +
        capTable.esop.poolSize;

      expect(totalOwnership).toBeCloseTo(1.0, 5);
    });
  });

  describe('calculateFundingRoundDilution', () => {
    let initialCapTable: CapTableEntry[];

    beforeEach(() => {
      const init = initializeCapTable(
        [{ name: 'Founder', ownership: 1.0 }],
        0.1
      );

      initialCapTable = [
        {
          stakeholder: 'Founder',
          type: 'Founder',
          shares: init.founders[0].shares,
          ownership: init.founders[0].currentOwnership,
        },
        {
          stakeholder: 'ESOP',
          type: 'ESOP',
          shares: init.esop.shares,
          ownership: init.esop.poolSize,
        },
      ];
    });

    it('should calculate investor ownership correctly', () => {
      const fundingAmount = 2000000;
      const postMoneyValuation = 10000000;

      const result = calculateFundingRoundDilution(
        initialCapTable,
        fundingAmount,
        postMoneyValuation
      );

      // 2M / 10M = 20% ownership
      expect(result.newInvestorOwnership).toBeCloseTo(0.2, 5);
    });

    it('should dilute existing shareholders proportionally', () => {
      const fundingAmount = 2000000;
      const postMoneyValuation = 10000000;

      const result = calculateFundingRoundDilution(
        initialCapTable,
        fundingAmount,
        postMoneyValuation
      );

      // Dilution factor should be 80% (1 - 20% new investment)
      expect(result.dilutionFactor).toBeCloseTo(0.8, 5);

      // All existing shareholders should be diluted by same factor
      result.updatedCapTable.forEach((entry, index) => {
        expect(entry.ownership).toBeCloseTo(
          initialCapTable[index].ownership * 0.8,
          5
        );
      });
    });

    it('should calculate price per share', () => {
      const fundingAmount = 2000000;
      const postMoneyValuation = 10000000;

      const result = calculateFundingRoundDilution(
        initialCapTable,
        fundingAmount,
        postMoneyValuation
      );

      expect(result.pricePerShare).toBeGreaterThan(0);
    });

    it('should issue correct number of new shares', () => {
      const fundingAmount = 2000000;
      const postMoneyValuation = 10000000;

      const result = calculateFundingRoundDilution(
        initialCapTable,
        fundingAmount,
        postMoneyValuation
      );

      // Shares issued * price per share should equal funding amount
      const impliedInvestment = result.sharesIssued * result.pricePerShare;
      expect(impliedInvestment).toBeCloseTo(fundingAmount, 0);
    });

    it('should maintain total ownership at 100%', () => {
      const fundingAmount = 3000000;
      const postMoneyValuation = 15000000;

      const result = calculateFundingRoundDilution(
        initialCapTable,
        fundingAmount,
        postMoneyValuation
      );

      const totalOwnership =
        result.updatedCapTable.reduce((sum, entry) => sum + entry.ownership, 0) +
        result.newInvestorOwnership;

      expect(totalOwnership).toBeCloseTo(1.0, 5);
    });
  });

  describe('calculateExitReturns', () => {
    it('should calculate equity value at exit', () => {
      const exitValuation = 100000000;
      const equityOwnership = 0.2;
      const investmentAmount = 5000000;

      const returns = calculateExitReturns(
        5,
        exitValuation,
        investmentAmount,
        equityOwnership,
        1
      );

      expect(returns.equityValue).toBe(20000000); // 20% of 100M
    });

    it('should calculate ROI correctly', () => {
      const returns = calculateExitReturns(5, 100000000, 5000000, 0.2, 1);

      // 20M equity value / 5M investment = 4x ROI
      expect(returns.roi).toBeCloseTo(4.0, 2);
      expect(returns.roiPercent).toBeCloseTo(300, 1); // 300% gain
    });

    it('should calculate CAGR correctly', () => {
      const returns = calculateExitReturns(5, 100000000, 5000000, 0.2, 1);

      // 4x return over 4 years (year 5 - year 1)
      // CAGR = (4^(1/4)) - 1 ≈ 41.4%
      expect(returns.cagr).toBeGreaterThan(40);
      expect(returns.cagr).toBeLessThan(42);
    });

    it('should handle same year exit (0 years held)', () => {
      const returns = calculateExitReturns(1, 20000000, 5000000, 0.25, 1);

      expect(returns.cagr).toBe(0);
    });

    it('should handle loss scenario', () => {
      const returns = calculateExitReturns(5, 10000000, 5000000, 0.2, 1);

      // 2M equity value / 5M investment = 0.4x ROI (60% loss)
      expect(returns.roi).toBeLessThan(1);
      expect(returns.roiPercent).toBeLessThan(0);
    });

    it('should handle 10x return correctly', () => {
      const returns = calculateExitReturns(5, 200000000, 4000000, 0.2, 1);

      // 40M equity value / 4M investment = 10x ROI
      expect(returns.roi).toBeCloseTo(10, 2);
      expect(returns.roiPercent).toBeCloseTo(900, 1);
    });
  });

  describe('calculateExitValuation', () => {
    it('should calculate valuation based on ARR multiple', () => {
      const arr = 10000000;
      const ebitda = 2000000;
      const arrMultiple = 10;
      const ebitdaMultiple = 15;

      const valuation = calculateExitValuation(
        arr,
        ebitda,
        arrMultiple,
        ebitdaMultiple,
        'arr'
      );

      expect(valuation).toBe(100000000); // 10M ARR * 10x
    });

    it('should calculate valuation based on EBITDA multiple', () => {
      const arr = 10000000;
      const ebitda = 2000000;
      const arrMultiple = 10;
      const ebitdaMultiple = 15;

      const valuation = calculateExitValuation(
        arr,
        ebitda,
        arrMultiple,
        ebitdaMultiple,
        'ebitda'
      );

      expect(valuation).toBe(30000000); // 2M EBITDA * 15x
    });

    it('should calculate average of both methods by default', () => {
      const arr = 10000000;
      const ebitda = 2000000;
      const arrMultiple = 10;
      const ebitdaMultiple = 15;

      const valuation = calculateExitValuation(
        arr,
        ebitda,
        arrMultiple,
        ebitdaMultiple,
        'average'
      );

      // (100M + 30M) / 2 = 65M
      expect(valuation).toBe(65000000);
    });

    it('should handle different ARR multiples (5x-15x range)', () => {
      const arr = 15000000;
      const ebitda = 3000000;

      const conservative = calculateExitValuation(arr, ebitda, 5, 10, 'arr');
      const moderate = calculateExitValuation(arr, ebitda, 10, 10, 'arr');
      const aggressive = calculateExitValuation(arr, ebitda, 15, 10, 'arr');

      expect(conservative).toBe(75000000);
      expect(moderate).toBe(150000000);
      expect(aggressive).toBe(225000000);
    });
  });

  describe('calculateESOPRefresh', () => {
    it('should calculate refresh shares needed', () => {
      const capTable: CapTableEntry[] = [
        { stakeholder: 'Founder', type: 'Founder', shares: 8000000, ownership: 0.8 },
        { stakeholder: 'ESOP', type: 'ESOP', shares: 1000000, ownership: 0.1 },
        {
          stakeholder: 'Series A',
          type: 'Investor',
          shares: 1000000,
          ownership: 0.1,
        },
      ];

      const result = calculateESOPRefresh(capTable, 0.15);

      expect(result.refreshShares).toBeGreaterThan(0);
      expect(result.refreshOwnership).toBeCloseTo(0.05, 5); // 15% target - 10% current
    });

    it('should not refresh if ESOP already at target', () => {
      const capTable: CapTableEntry[] = [
        { stakeholder: 'Founder', type: 'Founder', shares: 8500000, ownership: 0.85 },
        { stakeholder: 'ESOP', type: 'ESOP', shares: 1500000, ownership: 0.15 },
      ];

      const result = calculateESOPRefresh(capTable, 0.15);

      expect(result.refreshShares).toBe(0);
      expect(result.refreshOwnership).toBe(0);
    });

    it('should dilute all shareholders proportionally', () => {
      const capTable: CapTableEntry[] = [
        { stakeholder: 'Founder', type: 'Founder', shares: 8000000, ownership: 0.8 },
        { stakeholder: 'ESOP', type: 'ESOP', shares: 1000000, ownership: 0.1 },
        {
          stakeholder: 'Series A',
          type: 'Investor',
          shares: 1000000,
          ownership: 0.1,
        },
      ];

      const result = calculateESOPRefresh(capTable, 0.15);

      const dilutionFactor = 1 - result.refreshOwnership;

      result.updatedCapTable.forEach((entry, index) => {
        expect(entry.ownership).toBeCloseTo(
          capTable[index].ownership * dilutionFactor,
          5
        );
      });
    });
  });

  describe('generateCapTable', () => {
    it('should generate complete cap table through multiple rounds', () => {
      const founders = [
        { name: 'Founder A', ownership: 0.6 },
        { name: 'Founder B', ownership: 0.4 },
      ];
      const esopPoolSize = 0.1;
      const fundingRounds = [
        { roundName: 'Seed', amount: 2000000, valuation: 10000000 },
        { roundName: 'Series A', amount: 10000000, valuation: 50000000 },
      ];

      const capTable = generateCapTable(founders, esopPoolSize, fundingRounds);

      // Should have: 2 founders + ESOP + 2 investor groups
      expect(capTable.length).toBeGreaterThanOrEqual(5);
    });

    it('should maintain 100% ownership throughout rounds', () => {
      const founders = [{ name: 'Founder', ownership: 1.0 }];
      const esopPoolSize = 0.1;
      const fundingRounds = [
        { roundName: 'Seed', amount: 1000000, valuation: 5000000 },
        { roundName: 'Series A', amount: 5000000, valuation: 25000000 },
        { roundName: 'Series B', amount: 15000000, valuation: 75000000 },
      ];

      const capTable = generateCapTable(founders, esopPoolSize, fundingRounds);

      const totalOwnership = capTable.reduce(
        (sum, entry) => sum + entry.ownership,
        0
      );

      expect(totalOwnership).toBeCloseTo(1.0, 5);
    });

    it('should dilute founders progressively', () => {
      const founders = [{ name: 'Founder', ownership: 1.0 }];
      const esopPoolSize = 0.1;
      const fundingRounds = [
        { roundName: 'Seed', amount: 2000000, valuation: 10000000 },
        { roundName: 'Series A', amount: 10000000, valuation: 50000000 },
      ];

      const capTable = generateCapTable(founders, esopPoolSize, fundingRounds);

      const founderEntry = capTable.find(
        (e) => e.type === 'Founder' && e.stakeholder === 'Founder'
      );

      // Founder should be diluted from initial 90% (after ESOP)
      expect(founderEntry?.ownership).toBeLessThan(0.9);
    });

    it('should handle ESOP refresh', () => {
      const founders = [{ name: 'Founder', ownership: 1.0 }];
      const esopPoolSize = 0.1;
      const fundingRounds = [
        { roundName: 'Series A', amount: 5000000, valuation: 25000000, esopRefresh: 0.15 },
      ];

      const capTable = generateCapTable(founders, esopPoolSize, fundingRounds);

      const esopEntries = capTable.filter(
        (e) => e.type === 'ESOP' || e.type === 'ESOP Refresh'
      );
      const totalESOPOwnership = esopEntries.reduce(
        (sum, entry) => sum + entry.ownership,
        0
      );

      // ESOP refresh gets diluted by investor, so total may be slightly less than 15%
      expect(totalESOPOwnership).toBeGreaterThan(0.12);
      expect(totalESOPOwnership).toBeLessThanOrEqual(0.15);
    });

    it('should create investor entries with correct round names', () => {
      const founders = [{ name: 'Founder', ownership: 1.0 }];
      const esopPoolSize = 0.1;
      const fundingRounds = [
        { roundName: 'Seed', amount: 1000000, valuation: 5000000 },
        { roundName: 'Series A', amount: 5000000, valuation: 25000000 },
      ];

      const capTable = generateCapTable(founders, esopPoolSize, fundingRounds);

      const seedInvestor = capTable.find((e) => e.roundName === 'Seed');
      const seriesAInvestor = capTable.find((e) => e.roundName === 'Series A');

      expect(seedInvestor).toBeDefined();
      expect(seriesAInvestor).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle 0% ESOP pool', () => {
      const founders = [{ name: 'Founder', ownership: 1.0 }];
      const capTable = initializeCapTable(founders, 0);

      expect(capTable.esop.poolSize).toBe(0);
      expect(capTable.founders[0].currentOwnership).toBe(1.0);
    });

    it('should handle 100% ownership transfer to investor', () => {
      const initialCapTable: CapTableEntry[] = [
        { stakeholder: 'Founder', type: 'Founder', shares: 10000000, ownership: 1.0 },
      ];

      const result = calculateFundingRoundDilution(
        initialCapTable,
        10000000,
        10000000
      );

      // This would be acquisition scenario
      expect(result.newInvestorOwnership).toBeCloseTo(1.0, 5);
    });

    it('should handle very small equity ownership', () => {
      const returns = calculateExitReturns(5, 100000000, 5000000, 0.001, 1);

      expect(returns.equityValue).toBe(100000); // 0.1% of 100M
      expect(returns.roi).toBeLessThan(1);
    });

    it('should handle zero exit valuation', () => {
      const returns = calculateExitReturns(5, 0, 5000000, 0.2, 1);

      expect(returns.equityValue).toBe(0);
      expect(returns.roi).toBe(0);
      expect(returns.roiPercent).toBe(-100);
    });
  });

  describe('Property-Based Tests', () => {
    it('dilution should be inverse of new investor ownership', () => {
      const capTable: CapTableEntry[] = [
        { stakeholder: 'Founder', type: 'Founder', shares: 10000000, ownership: 1.0 },
      ];

      const result = calculateFundingRoundDilution(
        capTable,
        2000000,
        10000000
      );

      expect(result.dilutionFactor).toBeCloseTo(
        1 - result.newInvestorOwnership,
        5
      );
    });

    it('total ownership should always equal 100% after dilution', () => {
      const capTable: CapTableEntry[] = [
        { stakeholder: 'Founder A', type: 'Founder', shares: 6000000, ownership: 0.6 },
        { stakeholder: 'Founder B', type: 'Founder', shares: 3000000, ownership: 0.3 },
        { stakeholder: 'ESOP', type: 'ESOP', shares: 1000000, ownership: 0.1 },
      ];

      const result = calculateFundingRoundDilution(
        capTable,
        5000000,
        25000000
      );

      const totalOwnership =
        result.updatedCapTable.reduce((sum, e) => sum + e.ownership, 0) +
        result.newInvestorOwnership;

      expect(totalOwnership).toBeCloseTo(1.0, 5);
    });

    it('ROI should be equity value divided by investment', () => {
      const exitValuation = 100000000;
      const ownership = 0.25;
      const investment = 10000000;

      const returns = calculateExitReturns(5, exitValuation, investment, ownership, 1);

      expect(returns.roi).toBeCloseTo(returns.equityValue / investment, 5);
    });

    it('CAGR should compound correctly over years', () => {
      const returns = calculateExitReturns(5, 100000000, 5000000, 0.2, 1);
      const yearsHeld = 4;

      // Verify CAGR formula: (ROI^(1/years)) - 1
      const expectedCAGR = (Math.pow(returns.roi, 1 / yearsHeld) - 1) * 100;

      expect(returns.cagr).toBeCloseTo(expectedCAGR, 2);
    });
  });

  describe('Realistic Startup Scenarios', () => {
    it('should model typical startup dilution through Series B', () => {
      const founders = [
        { name: 'CEO', ownership: 0.6 },
        { name: 'CTO', ownership: 0.4 },
      ];
      const esopPoolSize = 0.15;
      const fundingRounds = [
        { roundName: 'Seed', amount: 2000000, valuation: 8000000 },
        { roundName: 'Series A', amount: 10000000, valuation: 40000000 },
        { roundName: 'Series B', amount: 30000000, valuation: 150000000 },
      ];

      const capTable = generateCapTable(founders, esopPoolSize, fundingRounds);

      const ceo = capTable.find((e) => e.stakeholder === 'CEO');
      const cto = capTable.find((e) => e.stakeholder === 'CTO');

      // CEO should maintain relative advantage
      expect(ceo!.ownership).toBeGreaterThan(cto!.ownership);

      // Both should be diluted but still have meaningful ownership
      expect(ceo!.ownership).toBeGreaterThan(0.1);
      expect(ceo!.ownership).toBeLessThan(0.6);
    });

    it('should calculate realistic exit returns for early investor', () => {
      // Seed investor: $2M at $8M post-money = 25% ownership
      // Exit: $150M at Series B
      const returns = calculateExitReturns(4, 150000000, 2000000, 0.25, 1);

      // 25% of $150M = $37.5M
      // $37.5M / $2M = 18.75x ROI
      expect(returns.roi).toBeCloseTo(18.75, 2);
      expect(returns.equityValue).toBe(37500000);
    });

    it('should show dilution impact on late-stage founder ownership', () => {
      const founders = [{ name: 'Founder', ownership: 1.0 }];
      const esopPoolSize = 0.15;
      const fundingRounds = [
        { roundName: 'Seed', amount: 2000000, valuation: 8000000 },
        { roundName: 'Series A', amount: 10000000, valuation: 40000000, esopRefresh: 0.15 },
        { roundName: 'Series B', amount: 30000000, valuation: 150000000, esopRefresh: 0.15 },
        { roundName: 'Series C', amount: 60000000, valuation: 300000000, esopRefresh: 0.15 },
      ];

      const capTable = generateCapTable(founders, esopPoolSize, fundingRounds);

      const founder = capTable.find((e) => e.stakeholder === 'Founder');

      // After 4 rounds with ESOP refreshes, founder should have ~20-40% ownership
      expect(founder!.ownership).toBeGreaterThan(0.15);
      expect(founder!.ownership).toBeLessThan(0.50);
    });
  });
});

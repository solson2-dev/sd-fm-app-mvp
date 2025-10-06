import { describe, it, expect } from 'vitest';
import {
  calculateCashPosition,
  calculateBurnRateMetrics,
  getFundingEvents,
  type CashPosition,
  type FundingEvent,
} from '../cash';
import { calculateMonthlyRevenueProjections } from '../revenue';
import { calculateOPEXProjections } from '../opex';
import { getDefaultRevenueAssumptions } from '../revenue';
import { getDefaultPersonnelRoles } from '../personnel';

describe('Cash & Burn Rate Calculations', () => {
  describe('calculateCashPosition', () => {
    it('should calculate cash position for each month', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        2,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        24
      );
      const fundingEvents: FundingEvent[] = [{ month: 3, amount: 1000000 }];

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        fundingEvents,
        100000
      );

      expect(positions).toHaveLength(24);
      expect(positions[0].month).toBe(1);
    });

    it('should add funding events to cash balance', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );
      const fundingEvents: FundingEvent[] = [{ month: 6, amount: 2000000 }];

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        fundingEvents,
        0
      );

      const month5 = positions[4];
      const month6 = positions[5];

      // Month 6 should have funding added
      expect(month6.cashBalance).toBeGreaterThan(month5.cashBalance + 1500000);
    });

    it('should calculate net burn (revenue - opex)', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        1000000
      );

      positions.forEach((position, index) => {
        const expectedBurn =
          revenueProjections[index].totalRevenue - opexProjections[index].totalOPEX;
        expect(position.netBurn).toBeCloseTo(expectedBurn, 2);
      });
    });

    it('should update cash balance based on net burn', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const startingCash = 1000000;
      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        startingCash
      );

      // Verify cash balance continuity
      expect(positions[0].cashBalance).toBeCloseTo(
        startingCash + positions[0].netBurn,
        2
      );

      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].cashBalance).toBeCloseTo(
          positions[i - 1].cashBalance + positions[i].netBurn,
          2
        );
      }
    });

    it('should calculate months of runway', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        500000
      );

      positions.forEach((position) => {
        if (position.netBurn < 0) {
          const monthlyBurn = Math.abs(position.netBurn);
          const expectedRunway = position.cashBalance / monthlyBurn;
          expect(position.monthsOfRunway).toBeCloseTo(expectedRunway, 1);
        } else {
          expect(position.monthsOfRunway).toBe(999);
        }
      });
    });

    it('should handle zero starting cash', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        0
      );

      expect(positions[0].cashBalance).toBeDefined();
    });

    it('should handle multiple funding events', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        2,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        24
      );
      const fundingEvents: FundingEvent[] = [
        { month: 3, amount: 1000000 },
        { month: 15, amount: 5000000 },
      ];

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        fundingEvents,
        0
      );

      // Verify funding events are applied
      expect(positions[2].cashBalance).toBeGreaterThan(positions[1].cashBalance + 900000);
      expect(positions[14].cashBalance).toBeGreaterThan(positions[13].cashBalance + 4900000);
    });
  });

  describe('calculateBurnRateMetrics', () => {
    it('should calculate average monthly burn', () => {
      const mockPositions: CashPosition[] = [
        {
          month: 1,
          year: 1,
          revenue: 10000,
          opex: 100000,
          netBurn: -90000,
          cashBalance: 910000,
          monthsOfRunway: 10,
        },
        {
          month: 2,
          year: 1,
          revenue: 15000,
          opex: 105000,
          netBurn: -90000,
          cashBalance: 820000,
          monthsOfRunway: 9,
        },
        {
          month: 3,
          year: 1,
          revenue: 20000,
          opex: 110000,
          netBurn: -90000,
          cashBalance: 730000,
          monthsOfRunway: 8,
        },
      ];

      const metrics = calculateBurnRateMetrics(mockPositions);

      expect(metrics.averageMonthlyBurn).toBeCloseTo(90000, 0);
    });

    it('should find peak monthly burn', () => {
      const mockPositions: CashPosition[] = [
        {
          month: 1,
          year: 1,
          revenue: 10000,
          opex: 100000,
          netBurn: -90000,
          cashBalance: 1000000,
          monthsOfRunway: 11,
        },
        {
          month: 2,
          year: 1,
          revenue: 15000,
          opex: 150000,
          netBurn: -135000,
          cashBalance: 865000,
          monthsOfRunway: 6,
        },
        {
          month: 3,
          year: 1,
          revenue: 20000,
          opex: 110000,
          netBurn: -90000,
          cashBalance: 775000,
          monthsOfRunway: 8,
        },
      ];

      const metrics = calculateBurnRateMetrics(mockPositions);

      expect(metrics.peakMonthlyBurn).toBe(135000);
    });

    it('should calculate current runway from last position', () => {
      const mockPositions: CashPosition[] = [
        {
          month: 1,
          year: 1,
          revenue: 10000,
          opex: 100000,
          netBurn: -90000,
          cashBalance: 910000,
          monthsOfRunway: 10,
        },
        {
          month: 2,
          year: 1,
          revenue: 15000,
          opex: 105000,
          netBurn: -90000,
          cashBalance: 820000,
          monthsOfRunway: 9,
        },
      ];

      const metrics = calculateBurnRateMetrics(mockPositions);

      expect(metrics.currentRunway).toBe(9);
    });

    it('should detect when cash runs out', () => {
      const mockPositions: CashPosition[] = [
        {
          month: 1,
          year: 1,
          revenue: 10000,
          opex: 100000,
          netBurn: -90000,
          cashBalance: 100000,
          monthsOfRunway: 1,
        },
        {
          month: 2,
          year: 1,
          revenue: 10000,
          opex: 100000,
          netBurn: -90000,
          cashBalance: 10000,
          monthsOfRunway: 0,
        },
        {
          month: 3,
          year: 1,
          revenue: 10000,
          opex: 100000,
          netBurn: -90000,
          cashBalance: -80000,
          monthsOfRunway: 0,
        },
      ];

      const metrics = calculateBurnRateMetrics(mockPositions);

      expect(metrics.projectedCashOut).toBe(3);
    });

    it('should handle profitable company (no burn)', () => {
      const mockPositions: CashPosition[] = [
        {
          month: 1,
          year: 1,
          revenue: 200000,
          opex: 100000,
          netBurn: 100000,
          cashBalance: 1100000,
          monthsOfRunway: 999,
        },
        {
          month: 2,
          year: 1,
          revenue: 220000,
          opex: 105000,
          netBurn: 115000,
          cashBalance: 1215000,
          monthsOfRunway: 999,
        },
      ];

      const metrics = calculateBurnRateMetrics(mockPositions);

      expect(metrics.averageMonthlyBurn).toBe(0);
      expect(metrics.peakMonthlyBurn).toBe(0);
      expect(metrics.currentRunway).toBe(999);
      expect(metrics.projectedCashOut).toBe(0);
    });

    it('should handle mixed burn and profitability', () => {
      const mockPositions: CashPosition[] = [
        {
          month: 1,
          year: 1,
          revenue: 50000,
          opex: 100000,
          netBurn: -50000,
          cashBalance: 950000,
          monthsOfRunway: 19,
        },
        {
          month: 2,
          year: 1,
          revenue: 150000,
          opex: 100000,
          netBurn: 50000,
          cashBalance: 1000000,
          monthsOfRunway: 999,
        },
        {
          month: 3,
          year: 1,
          revenue: 80000,
          opex: 110000,
          netBurn: -30000,
          cashBalance: 970000,
          monthsOfRunway: 32,
        },
      ];

      const metrics = calculateBurnRateMetrics(mockPositions);

      // Only months 1 and 3 are burning
      expect(metrics.averageMonthlyBurn).toBeCloseTo(40000, 0);
    });
  });

  describe('getFundingEvents', () => {
    it('should convert funding rounds to funding events', () => {
      const fundingRounds = [
        { close_month: 3, amount_raised: 1000000 },
        { close_month: 15, amount_raised: 5000000 },
      ];

      const events = getFundingEvents(fundingRounds);

      expect(events).toHaveLength(2);
      expect(events[0].month).toBe(3);
      expect(events[0].amount).toBe(1000000);
      expect(events[1].month).toBe(15);
      expect(events[1].amount).toBe(5000000);
    });

    it('should handle null close_month with default', () => {
      const fundingRounds = [{ close_month: null, amount_raised: 2000000 }];

      const events = getFundingEvents(fundingRounds);

      expect(events[0].month).toBe(3); // Default month
      expect(events[0].amount).toBe(2000000);
    });

    it('should handle null amount_raised', () => {
      const fundingRounds = [{ close_month: 5, amount_raised: null }];

      const events = getFundingEvents(fundingRounds);

      expect(events[0].month).toBe(5);
      expect(events[0].amount).toBe(0);
    });

    it('should handle empty array', () => {
      const events = getFundingEvents([]);

      expect(events).toHaveLength(0);
    });

    it('should handle undefined values', () => {
      const fundingRounds = [{ close_month: undefined, amount_raised: undefined }];

      const events = getFundingEvents(fundingRounds);

      expect(events[0].month).toBe(3);
      expect(events[0].amount).toBe(0);
    });
  });

  describe('Integration Tests', () => {
    it('should show cash depletion without funding', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        500000
      );

      // Cash should decrease over time (early stage startup)
      expect(positions[11].cashBalance).toBeLessThan(positions[0].cashBalance);
    });

    it('should show cash preservation with funding', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        2,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        24
      );
      const fundingEvents: FundingEvent[] = [
        { month: 3, amount: 2000000 },
        { month: 15, amount: 5000000 },
      ];

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        fundingEvents,
        100000
      );

      // Cash should be higher after funding rounds
      expect(positions[5].cashBalance).toBeGreaterThan(1000000);
      expect(positions[17].cashBalance).toBeGreaterThan(3000000);
    });

    it('should calculate realistic burn metrics for early-stage startup', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [{ month: 3, amount: 1000000 }],
        0
      );

      const metrics = calculateBurnRateMetrics(positions);

      // Early-stage startup should have burn
      expect(metrics.averageMonthlyBurn).toBeGreaterThan(0);
      expect(metrics.peakMonthlyBurn).toBeGreaterThan(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty revenue and opex arrays', () => {
      const positions = calculateCashPosition([], [], [], 1000000);

      expect(positions).toHaveLength(0);
    });

    it('should handle negative starting cash', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        -100000
      );

      expect(positions[0].cashBalance).toBeLessThan(0);
    });

    it('should handle very large funding amounts', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [{ month: 3, amount: 100000000 }],
        0
      );

      expect(positions[2].cashBalance).toBeGreaterThan(90000000);
    });

    it('should handle zero burn scenario', () => {
      const mockPositions: CashPosition[] = [
        {
          month: 1,
          year: 1,
          revenue: 100000,
          opex: 100000,
          netBurn: 0,
          cashBalance: 1000000,
          monthsOfRunway: 999,
        },
      ];

      const metrics = calculateBurnRateMetrics(mockPositions);

      expect(metrics.averageMonthlyBurn).toBe(0);
      expect(metrics.currentRunway).toBe(999);
    });
  });

  describe('Property-Based Tests', () => {
    it('cash balance should equal previous balance plus net burn', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        2,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        24
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        1000000
      );

      for (let i = 1; i < positions.length; i++) {
        expect(positions[i].cashBalance).toBeCloseTo(
          positions[i - 1].cashBalance + positions[i].netBurn,
          2
        );
      }
    });

    it('net burn should equal revenue minus opex', () => {
      const revenueProjections = calculateMonthlyRevenueProjections(
        1,
        getDefaultRevenueAssumptions()
      );
      const opexProjections = calculateOPEXProjections(
        getDefaultPersonnelRoles(),
        1,
        12
      );

      const positions = calculateCashPosition(
        revenueProjections,
        opexProjections,
        [],
        1000000
      );

      positions.forEach((position, index) => {
        expect(position.netBurn).toBeCloseTo(
          position.revenue - position.opex,
          2
        );
      });
    });

    it('months of runway should decrease when burning cash', () => {
      const mockPositions: CashPosition[] = [];
      let cashBalance = 1000000;

      for (let month = 1; month <= 12; month++) {
        const netBurn = -80000;
        cashBalance += netBurn;
        const monthsOfRunway = cashBalance / 80000;

        mockPositions.push({
          month,
          year: 1,
          revenue: 20000,
          opex: 100000,
          netBurn,
          cashBalance,
          monthsOfRunway,
        });
      }

      for (let i = 1; i < mockPositions.length; i++) {
        expect(mockPositions[i].monthsOfRunway).toBeLessThan(
          mockPositions[i - 1].monthsOfRunway
        );
      }
    });
  });
});

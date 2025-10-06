import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateMonthlyOPEX,
  calculateOPEXProjections,
  calculateCumulativeOPEX,
  calculateAverageMonthlyOPEX,
  getAllocationForMonth,
  getPreSeedAllocation,
  getSeriesAAllocation,
  getSeriesXAllocation,
  getZeroAllocation,
  getFundingRounds,
  getDefaultOPEXAllocation,
  type OPEXAllocation,
} from '../opex';
import { getDefaultPersonnelRoles, type PersonnelRole } from '../personnel';

describe('OPEX Calculations', () => {
  let defaultRoles: PersonnelRole[];

  beforeEach(() => {
    defaultRoles = getDefaultPersonnelRoles();
  });

  describe('Funding Round Allocations', () => {
    it('should return zero allocation for bootstrap phase', () => {
      const allocation = getZeroAllocation();

      expect(allocation.productDevelopment).toBe(0);
      expect(allocation.marketingAndSales).toBe(0);
      expect(allocation.legalAndProfessional).toBe(0);
      expect(allocation.officeAndEquipment).toBe(0);
      expect(allocation.travelAndEvents).toBe(0);
    });

    it('should return Pre-Seed allocation matching Excel', () => {
      const allocation = getPreSeedAllocation();

      expect(allocation.productDevelopment).toBe(25000);
      expect(allocation.marketingAndSales).toBe(16667);
      expect(allocation.legalAndProfessional).toBe(2083);
      expect(allocation.officeAndEquipment).toBe(833);
      expect(allocation.travelAndEvents).toBe(1250);
    });

    it('should return Series A allocation matching Excel', () => {
      const allocation = getSeriesAAllocation();

      expect(allocation.productDevelopment).toBe(16667);
      expect(allocation.marketingAndSales).toBe(58333);
      expect(allocation.legalAndProfessional).toBe(8333);
      expect(allocation.officeAndEquipment).toBe(8333);
      expect(allocation.travelAndEvents).toBe(8333);
    });

    it('should return Series X allocation with correct percentages', () => {
      const allocation = getSeriesXAllocation();
      const total =
        allocation.productDevelopment +
        allocation.marketingAndSales +
        allocation.legalAndProfessional +
        allocation.officeAndEquipment +
        allocation.travelAndEvents;

      // Verify percentages (20%, 25%, 5%, 5%, 5% = 60% total)
      expect(allocation.productDevelopment / total).toBeCloseTo(0.2 / 0.6, 2);
      expect(allocation.marketingAndSales / total).toBeCloseTo(0.25 / 0.6, 2);
    });
  });

  describe('getAllocationForMonth', () => {
    it('should return zero allocation for months 1-2', () => {
      const month1 = getAllocationForMonth(1);
      const month2 = getAllocationForMonth(2);

      expect(month1.productDevelopment).toBe(0);
      expect(month2.productDevelopment).toBe(0);
    });

    it('should return Pre-Seed allocation for months 3-26', () => {
      const month3 = getAllocationForMonth(3);
      const month15 = getAllocationForMonth(15);
      const month26 = getAllocationForMonth(26);

      const preSeed = getPreSeedAllocation();

      expect(month3).toEqual(preSeed);
      expect(month15).toEqual(preSeed);
      expect(month26).toEqual(preSeed);
    });

    it('should return Series A allocation for months 27-50', () => {
      const month27 = getAllocationForMonth(27);
      const month40 = getAllocationForMonth(40);
      const month50 = getAllocationForMonth(50);

      const seriesA = getSeriesAAllocation();

      expect(month27).toEqual(seriesA);
      expect(month40).toEqual(seriesA);
      expect(month50).toEqual(seriesA);
    });

    it('should return Series X allocation for months 51+', () => {
      const month51 = getAllocationForMonth(51);
      const month100 = getAllocationForMonth(100);

      const seriesX = getSeriesXAllocation();

      expect(month51).toEqual(seriesX);
      expect(month100).toEqual(seriesX);
    });
  });

  describe('getFundingRounds', () => {
    it('should return all funding rounds in correct order', () => {
      const rounds = getFundingRounds();

      expect(rounds).toHaveLength(4);
      expect(rounds[0].name).toBe('Bootstrap');
      expect(rounds[1].name).toBe('Pre-Seed');
      expect(rounds[2].name).toBe('Series A');
      expect(rounds[3].name).toBe('Series X');
    });

    it('should have correct start months', () => {
      const rounds = getFundingRounds();

      expect(rounds[0].startMonth).toBe(1);
      expect(rounds[1].startMonth).toBe(3);
      expect(rounds[2].startMonth).toBe(27);
      expect(rounds[3].startMonth).toBe(51);
    });
  });

  describe('calculateMonthlyOPEX', () => {
    it('should calculate month 1-2 with zero operating expenses', () => {
      const month1 = calculateMonthlyOPEX(defaultRoles, 1);
      const month2 = calculateMonthlyOPEX(defaultRoles, 2);

      // Months 1-2 have zero operating expenses (before Pre-Seed funding)
      expect(month1.operatingSubtotal).toBe(0);
      expect(month2.operatingSubtotal).toBe(0);
      // Personnel costs also 0 since no one starts before month 3
      expect(month1.totalOPEX).toBe(0);
      expect(month2.totalOPEX).toBe(0);
    });

    it('should include both personnel and operating costs for month 12', () => {
      const month12 = calculateMonthlyOPEX(defaultRoles, 12);

      expect(month12.personnelCost).toBeGreaterThan(0);
      expect(month12.operatingSubtotal).toBeGreaterThan(0);
      expect(month12.totalOPEX).toBe(
        month12.personnelCost + month12.operatingSubtotal
      );
    });

    it('should match Excel Month 12 OPEX validation: ~$99,500', () => {
      const month12 = calculateMonthlyOPEX(defaultRoles, 12);

      // Excel validation target from validate-calculations.js
      // Allow ±$2,000 variance
      expect(month12.totalOPEX).toBeGreaterThan(97_000);
      expect(month12.totalOPEX).toBeLessThan(102_000);
    });

    it('should match Excel Month 36 OPEX validation: ~$220,750', () => {
      const month36 = calculateMonthlyOPEX(defaultRoles, 36);

      // Excel validation target from validate-calculations.js
      // Allow ±$5,000 variance (Series A has higher costs)
      expect(month36.totalOPEX).toBeGreaterThan(215_000);
      expect(month36.totalOPEX).toBeLessThan(226_000);
    });

    it('should break down operating costs correctly', () => {
      const month12 = calculateMonthlyOPEX(defaultRoles, 12);

      const calculatedSubtotal =
        month12.productDevelopment +
        month12.marketingAndSales +
        month12.legalAndProfessional +
        month12.officeAndEquipment +
        month12.travelAndEvents;

      expect(month12.operatingSubtotal).toBeCloseTo(calculatedSubtotal, 2);
    });

    it('should use custom allocation when provided', () => {
      const customAllocation: OPEXAllocation = {
        productDevelopment: 50000,
        marketingAndSales: 30000,
        legalAndProfessional: 5000,
        officeAndEquipment: 3000,
        travelAndEvents: 2000,
      };

      const result = calculateMonthlyOPEX(defaultRoles, 12, customAllocation);

      expect(result.productDevelopment).toBe(50000);
      expect(result.marketingAndSales).toBe(30000);
      expect(result.legalAndProfessional).toBe(5000);
    });
  });

  describe('calculateOPEXProjections', () => {
    it('should generate projections for specified month range', () => {
      const projections = calculateOPEXProjections(defaultRoles, 1, 12);

      expect(projections).toHaveLength(12);
      expect(projections[0].month).toBe(1);
      expect(projections[11].month).toBe(12);
    });

    it('should show increasing costs as personnel ramps up', () => {
      const projections = calculateOPEXProjections(defaultRoles, 1, 24);

      // Month 1 should be less than Month 13 (more people hired)
      expect(projections[12].personnelCost).toBeGreaterThan(
        projections[0].personnelCost
      );
    });

    it('should reflect funding round transitions', () => {
      // Use individual month calculations to ensure funding round allocation
      const month26 = calculateMonthlyOPEX(defaultRoles, 26);
      const month27 = calculateMonthlyOPEX(defaultRoles, 27);

      // Pre-Seed marketing: $16,667, Series A marketing: $58,333
      expect(month27.marketingAndSales).toBeGreaterThan(50000);
      expect(month26.marketingAndSales).toBeLessThan(20000);
    });
  });

  describe('calculateCumulativeOPEX', () => {
    it('should accumulate OPEX over time', () => {
      const cumulative6 = calculateCumulativeOPEX(defaultRoles, 6);
      const cumulative12 = calculateCumulativeOPEX(defaultRoles, 12);

      expect(cumulative12).toBeGreaterThan(cumulative6);
      expect(cumulative12).toBeGreaterThan(cumulative6 * 1.5);
    });

    it('should match sum of individual monthly OPEX', () => {
      // Note: calculateOPEXProjections uses a fixed allocation,
      // while calculateCumulativeOPEX uses funding round-based allocation
      const cumulative = calculateCumulativeOPEX(defaultRoles, 12);

      // Manually calculate expected cumulative
      let expectedTotal = 0;
      for (let month = 1; month <= 12; month++) {
        const monthlyOPEX = calculateMonthlyOPEX(defaultRoles, month);
        expectedTotal += monthlyOPEX.totalOPEX;
      }

      expect(cumulative).toBeCloseTo(expectedTotal, 2);
    });

    it('should account for funding round transitions', () => {
      const cumulative26 = calculateCumulativeOPEX(defaultRoles, 26);
      const cumulative30 = calculateCumulativeOPEX(defaultRoles, 30);

      // 4 months of Series A should add significant cost
      const diff = cumulative30 - cumulative26;
      expect(diff).toBeGreaterThan(500000); // At least $125k/month
    });
  });

  describe('calculateAverageMonthlyOPEX', () => {
    it('should calculate average over period', () => {
      const average = calculateAverageMonthlyOPEX(defaultRoles, 1, 12);

      expect(average).toBeGreaterThan(0);
    });

    it('should be between min and max in range', () => {
      const projections = calculateOPEXProjections(defaultRoles, 1, 12);
      const values = projections.map((p) => p.totalOPEX);
      const min = Math.min(...values);
      const max = Math.max(...values);

      const average = calculateAverageMonthlyOPEX(defaultRoles, 1, 12);

      expect(average).toBeGreaterThanOrEqual(min);
      expect(average).toBeLessThanOrEqual(max);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty personnel roles', () => {
      const emptyRoles: PersonnelRole[] = [];
      const result = calculateMonthlyOPEX(emptyRoles, 12);

      expect(result.personnelCost).toBe(0);
      expect(result.totalOPEX).toBe(result.operatingSubtotal);
    });

    it('should handle month 0', () => {
      const result = calculateMonthlyOPEX(defaultRoles, 0);

      expect(result.month).toBe(0);
      expect(result.personnelCost).toBe(0);
    });

    it('should handle very high month numbers', () => {
      const result = calculateMonthlyOPEX(defaultRoles, 200);

      // Should use Series X allocation
      expect(result.operatingSubtotal).toBeGreaterThan(0);
    });

    it('should never have negative OPEX', () => {
      const projections = calculateOPEXProjections(defaultRoles, 1, 120);

      projections.forEach((projection) => {
        expect(projection.personnelCost).toBeGreaterThanOrEqual(0);
        expect(projection.productDevelopment).toBeGreaterThanOrEqual(0);
        expect(projection.marketingAndSales).toBeGreaterThanOrEqual(0);
        expect(projection.legalAndProfessional).toBeGreaterThanOrEqual(0);
        expect(projection.officeAndEquipment).toBeGreaterThanOrEqual(0);
        expect(projection.travelAndEvents).toBeGreaterThanOrEqual(0);
        expect(projection.operatingSubtotal).toBeGreaterThanOrEqual(0);
        expect(projection.totalOPEX).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('Property-Based Tests', () => {
    it('totalOPEX should equal personnelCost + operatingSubtotal', () => {
      const projections = calculateOPEXProjections(defaultRoles, 1, 60);

      projections.forEach((projection) => {
        expect(projection.totalOPEX).toBeCloseTo(
          projection.personnelCost + projection.operatingSubtotal,
          2
        );
      });
    });

    it('operatingSubtotal should equal sum of all operating categories', () => {
      const projections = calculateOPEXProjections(defaultRoles, 1, 60);

      projections.forEach((projection) => {
        const sum =
          projection.productDevelopment +
          projection.marketingAndSales +
          projection.legalAndProfessional +
          projection.officeAndEquipment +
          projection.travelAndEvents;

        expect(projection.operatingSubtotal).toBeCloseTo(sum, 2);
      });
    });

    it('cumulative OPEX should be monotonically increasing', () => {
      // Start from month 3 when Pre-Seed funding starts
      for (let month = 4; month <= 60; month++) {
        const current = calculateCumulativeOPEX(defaultRoles, month);
        const previous = calculateCumulativeOPEX(defaultRoles, month - 1);

        expect(current).toBeGreaterThanOrEqual(previous);
      }
    });

    it('OPEX should increase when transitioning to higher funding rounds', () => {
      // Pre-Seed to Series A transition (month 26 to 27)
      const month26 = calculateMonthlyOPEX(defaultRoles, 26);
      const month27 = calculateMonthlyOPEX(defaultRoles, 27);

      // Series A should have higher operating costs
      expect(month27.operatingSubtotal).toBeGreaterThan(
        month26.operatingSubtotal
      );
    });
  });

  describe('Integration with Personnel', () => {
    it('should correctly integrate personnel costs', () => {
      const month12 = calculateMonthlyOPEX(defaultRoles, 12);

      // At month 12, should have CEO, CTO, Sr Dev (started months 3-6)
      expect(month12.personnelCost).toBeGreaterThan(0);
    });

    it('should reflect personnel growth over time', () => {
      const month6 = calculateMonthlyOPEX(defaultRoles, 6);
      const month18 = calculateMonthlyOPEX(defaultRoles, 18);
      const month30 = calculateMonthlyOPEX(defaultRoles, 30);

      // Personnel should increase as more roles are filled
      expect(month18.personnelCost).toBeGreaterThan(month6.personnelCost);
      expect(month30.personnelCost).toBeGreaterThan(month18.personnelCost);
    });
  });

  describe('Validation Against Excel', () => {
    it('should have Pre-Seed operating costs totaling $45,833/month', () => {
      const preSeed = getPreSeedAllocation();
      const total =
        preSeed.productDevelopment +
        preSeed.marketingAndSales +
        preSeed.legalAndProfessional +
        preSeed.officeAndEquipment +
        preSeed.travelAndEvents;

      expect(total).toBeCloseTo(45833, 0);
    });

    it('should have Series A operating costs totaling $100,000/month', () => {
      const seriesA = getSeriesAAllocation();
      const total =
        seriesA.productDevelopment +
        seriesA.marketingAndSales +
        seriesA.legalAndProfessional +
        seriesA.officeAndEquipment +
        seriesA.travelAndEvents;

      expect(total).toBeCloseTo(99999, 0);
    });

    it('should match funding round schedule from Excel', () => {
      const rounds = getFundingRounds();

      // Validate that Pre-Seed starts at month 3 (funding received)
      expect(rounds[1].startMonth).toBe(3);

      // Validate that Series A starts at month 27
      expect(rounds[2].startMonth).toBe(27);
    });
  });
});

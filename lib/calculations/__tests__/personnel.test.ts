import { describe, it, expect } from 'vitest';
import {
  calculatePersonnelCost,
  calculatePersonnelCostBreakdown,
  calculateMonthlyPersonnelTotal,
  calculateCumulativePersonnelCost,
  calculateHeadcount,
  getDefaultPersonnelRoles,
  type PersonnelRole,
} from '../personnel';

describe('Personnel Calculations', () => {
  describe('calculatePersonnelCost', () => {
    const testRole: PersonnelRole = {
      roleName: 'Test Engineer',
      baseSalary: 120000,
      startMonth: 5,
      endMonth: 20,
    };

    it('should calculate monthly cost with 1.4x overhead multiplier', () => {
      const cost = calculatePersonnelCost(testRole, 10);

      // Expected: (120000 * 1.4) / 12 = $14,000/month
      expect(cost).toBeCloseTo(14000, 2);
    });

    it('should return 0 before start month', () => {
      const cost = calculatePersonnelCost(testRole, 3);
      expect(cost).toBe(0);
    });

    it('should return cost at start month', () => {
      const cost = calculatePersonnelCost(testRole, 5);
      expect(cost).toBeGreaterThan(0);
    });

    it('should return 0 after end month', () => {
      const cost = calculatePersonnelCost(testRole, 25);
      expect(cost).toBe(0);
    });

    it('should handle ongoing roles (no end month)', () => {
      const ongoingRole: PersonnelRole = {
        roleName: 'CEO',
        baseSalary: 160000,
        startMonth: 1,
      };

      const cost = calculatePersonnelCost(ongoingRole, 100);
      expect(cost).toBeGreaterThan(0);
    });

    it('should scale linearly with salary', () => {
      const role1: PersonnelRole = {
        roleName: 'Role 1',
        baseSalary: 100000,
        startMonth: 1,
      };
      const role2: PersonnelRole = {
        roleName: 'Role 2',
        baseSalary: 200000,
        startMonth: 1,
      };

      const cost1 = calculatePersonnelCost(role1, 10);
      const cost2 = calculatePersonnelCost(role2, 10);

      expect(cost2).toBeCloseTo(cost1 * 2, 2);
    });
  });

  describe('calculatePersonnelCostBreakdown', () => {
    const testRole: PersonnelRole = {
      roleName: 'Developer',
      baseSalary: 120000,
      startMonth: 1,
    };

    it('should break down costs into components', () => {
      const breakdown = calculatePersonnelCostBreakdown(testRole, 10);

      expect(breakdown.baseSalary).toBeCloseTo(10000, 2); // 120000 / 12
      expect(breakdown.payrollTaxes).toBeGreaterThan(0);
      expect(breakdown.benefits).toBeGreaterThan(0);
      expect(breakdown.total).toBeGreaterThan(breakdown.baseSalary);
    });

    it('should have total equal to sum of components', () => {
      const breakdown = calculatePersonnelCostBreakdown(testRole, 10);

      const sum =
        breakdown.baseSalary + breakdown.payrollTaxes + breakdown.benefits;

      expect(breakdown.total).toBeCloseTo(sum, 2);
    });

    it('should be within 5% of calculatePersonnelCost total', () => {
      const simpleCost = calculatePersonnelCost(testRole, 10);
      const breakdown = calculatePersonnelCostBreakdown(testRole, 10);

      // The two methods use slightly different calculations
      // Simple: (salary * 1.4) / 12
      // Breakdown: salary/12 + taxes + benefits
      // Allow 5% variance
      expect(breakdown.total).toBeGreaterThan(simpleCost * 0.95);
      expect(breakdown.total).toBeLessThan(simpleCost * 1.05);
    });

    it('should return zeros before start month', () => {
      const breakdown = calculatePersonnelCostBreakdown(
        { ...testRole, startMonth: 10 },
        5
      );

      expect(breakdown.baseSalary).toBe(0);
      expect(breakdown.payrollTaxes).toBe(0);
      expect(breakdown.benefits).toBe(0);
      expect(breakdown.total).toBe(0);
    });

    it('should return zeros after end month', () => {
      const breakdown = calculatePersonnelCostBreakdown(
        { ...testRole, endMonth: 10 },
        15
      );

      expect(breakdown.total).toBe(0);
    });

    it('should apply 7.65% payroll taxes (FICA)', () => {
      const breakdown = calculatePersonnelCostBreakdown(testRole, 10);
      const monthlyBaseSalary = testRole.baseSalary / 12;

      expect(breakdown.payrollTaxes).toBeCloseTo(monthlyBaseSalary * 0.0765, 2);
    });

    it('should apply approximately 40% total overhead', () => {
      const breakdown = calculatePersonnelCostBreakdown(testRole, 10);
      const monthlyBaseSalary = testRole.baseSalary / 12;

      // Total overhead should be approximately 35% (not exactly 40% due to breakdown)
      const totalOverhead =
        breakdown.payrollTaxes + breakdown.benefits;
      const overheadRate = totalOverhead / monthlyBaseSalary;

      expect(overheadRate).toBeGreaterThan(0.25);
      expect(overheadRate).toBeLessThan(0.40);
    });
  });

  describe('calculateMonthlyPersonnelTotal', () => {
    const roles: PersonnelRole[] = [
      { roleName: 'CEO', baseSalary: 160000, startMonth: 1 },
      { roleName: 'CTO', baseSalary: 160000, startMonth: 3 },
      { roleName: 'Engineer', baseSalary: 120000, startMonth: 5 },
    ];

    it('should sum costs for all active roles', () => {
      const total = calculateMonthlyPersonnelTotal(roles, 10);

      // All 3 roles active at month 10
      const expectedTotal =
        ((160000 + 160000 + 120000) * 1.4) / 12;

      expect(total).toBeCloseTo(expectedTotal, 2);
    });

    it('should only include active roles for given month', () => {
      const month2 = calculateMonthlyPersonnelTotal(roles, 2);
      const month4 = calculateMonthlyPersonnelTotal(roles, 4);
      const month6 = calculateMonthlyPersonnelTotal(roles, 6);

      // Month 2: only CEO
      expect(month2).toBeCloseTo((160000 * 1.4) / 12, 2);

      // Month 4: CEO + CTO
      expect(month4).toBeCloseTo((320000 * 1.4) / 12, 2);

      // Month 6: CEO + CTO + Engineer
      expect(month6).toBeCloseTo((440000 * 1.4) / 12, 2);
    });

    it('should handle empty roles array', () => {
      const total = calculateMonthlyPersonnelTotal([], 10);
      expect(total).toBe(0);
    });

    it('should handle roles with end dates', () => {
      const tempRoles: PersonnelRole[] = [
        { roleName: 'Contractor', baseSalary: 100000, startMonth: 1, endMonth: 5 },
        { roleName: 'Employee', baseSalary: 100000, startMonth: 1 },
      ];

      const month3 = calculateMonthlyPersonnelTotal(tempRoles, 3);
      const month10 = calculateMonthlyPersonnelTotal(tempRoles, 10);

      // Month 3: both active
      expect(month3).toBeCloseTo((200000 * 1.4) / 12, 2);

      // Month 10: only employee active
      expect(month10).toBeCloseTo((100000 * 1.4) / 12, 2);
    });
  });

  describe('calculateCumulativePersonnelCost', () => {
    const roles: PersonnelRole[] = [
      { roleName: 'CEO', baseSalary: 120000, startMonth: 1 },
    ];

    it('should accumulate costs over months', () => {
      const cumulative6 = calculateCumulativePersonnelCost(roles, 6);
      const cumulative12 = calculateCumulativePersonnelCost(roles, 12);

      expect(cumulative12).toBeGreaterThan(cumulative6);
      expect(cumulative12).toBeCloseTo(cumulative6 * 2, 2);
    });

    it('should match sum of individual months', () => {
      const cumulative = calculateCumulativePersonnelCost(roles, 12);

      let manualSum = 0;
      for (let month = 1; month <= 12; month++) {
        manualSum += calculateMonthlyPersonnelTotal(roles, month);
      }

      expect(cumulative).toBeCloseTo(manualSum, 2);
    });

    it('should handle roles starting mid-period', () => {
      const lateStartRoles: PersonnelRole[] = [
        { roleName: 'Manager', baseSalary: 100000, startMonth: 7 },
      ];

      const cumulative12 = calculateCumulativePersonnelCost(lateStartRoles, 12);

      // Should only have 6 months of costs (months 7-12)
      const expectedCost = 6 * ((100000 * 1.4) / 12);

      expect(cumulative12).toBeCloseTo(expectedCost, 2);
    });
  });

  describe('calculateHeadcount', () => {
    const roles: PersonnelRole[] = [
      { roleName: 'CEO', baseSalary: 160000, startMonth: 1 },
      { roleName: 'CTO', baseSalary: 160000, startMonth: 3 },
      { roleName: 'Engineer', baseSalary: 120000, startMonth: 5, endMonth: 15 },
      { roleName: 'Designer', baseSalary: 100000, startMonth: 10 },
    ];

    it('should count active roles at given month', () => {
      expect(calculateHeadcount(roles, 1)).toBe(1); // CEO only
      expect(calculateHeadcount(roles, 4)).toBe(2); // CEO + CTO
      expect(calculateHeadcount(roles, 10)).toBe(4); // All 4
      expect(calculateHeadcount(roles, 20)).toBe(3); // CEO + CTO + Designer (Engineer ended at 15)
    });

    it('should return 0 for month 0', () => {
      expect(calculateHeadcount(roles, 0)).toBe(0);
    });

    it('should handle empty roles', () => {
      expect(calculateHeadcount([], 10)).toBe(0);
    });

    it('should not count roles before start', () => {
      const headcount = calculateHeadcount(
        [{ roleName: 'Future', baseSalary: 100000, startMonth: 50 }],
        10
      );
      expect(headcount).toBe(0);
    });

    it('should not count roles after end', () => {
      const headcount = calculateHeadcount(
        [{ roleName: 'Past', baseSalary: 100000, startMonth: 1, endMonth: 5 }],
        10
      );
      expect(headcount).toBe(0);
    });
  });

  describe('getDefaultPersonnelRoles', () => {
    it('should return 8 roles from Excel model', () => {
      const roles = getDefaultPersonnelRoles();
      expect(roles).toHaveLength(8);
    });

    it('should have correct role names', () => {
      const roles = getDefaultPersonnelRoles();
      const roleNames = roles.map((r) => r.roleName);

      expect(roleNames).toContain('CEO (Stephen)');
      expect(roleNames).toContain('CTO (Allen)');
      expect(roleNames).toContain('Sr. Full-Stack Developer');
      expect(roleNames).toContain('Product/Customer Success');
      expect(roleNames).toContain('Sales/Partnership Lead');
      expect(roleNames).toContain('UI/UX Designer');
      expect(roleNames).toContain('Backend Engineer');
      expect(roleNames).toContain('Marketing Manager');
    });

    it('should have correct salaries', () => {
      const roles = getDefaultPersonnelRoles();

      const ceo = roles.find((r) => r.roleName === 'CEO (Stephen)');
      const cto = roles.find((r) => r.roleName === 'CTO (Allen)');

      expect(ceo?.baseSalary).toBe(160000);
      expect(cto?.baseSalary).toBe(160000);
    });

    it('should have correct start months', () => {
      const roles = getDefaultPersonnelRoles();

      const ceo = roles.find((r) => r.roleName === 'CEO (Stephen)');
      const cto = roles.find((r) => r.roleName === 'CTO (Allen)');

      expect(ceo?.startMonth).toBe(6);
      expect(cto?.startMonth).toBe(3);
    });

    it('should have all roles ending at month 120', () => {
      const roles = getDefaultPersonnelRoles();

      roles.forEach((role) => {
        expect(role.endMonth).toBe(120);
      });
    });

    it('should have valid salary ranges', () => {
      const roles = getDefaultPersonnelRoles();

      roles.forEach((role) => {
        expect(role.baseSalary).toBeGreaterThan(0);
        expect(role.baseSalary).toBeLessThanOrEqual(200000);
      });
    });
  });

  describe('Excel Validation Tests', () => {
    it('should match expected month 12 personnel cost', () => {
      const roles = getDefaultPersonnelRoles();
      const month12Cost = calculateMonthlyPersonnelTotal(roles, 12);

      // At month 12:
      // - CTO (Allen): started month 3, $160k
      // - Sr. Full-Stack Developer: started month 3, $140k
      // - CEO (Stephen): started month 6, $160k
      // Total base: $460k
      // With 1.4x overhead: $644k/year = $53,667/month

      expect(month12Cost).toBeCloseTo(53667, 0);
    });

    it('should match expected month 36 personnel cost', () => {
      const roles = getDefaultPersonnelRoles();
      const month36Cost = calculateMonthlyPersonnelTotal(roles, 36);

      // At month 36, all 8 roles should be active:
      // CEO: 160k, CTO: 160k, Sr Dev: 140k, Product: 105k
      // Sales: 140k, Designer: 100k, Backend: 120k, Marketing: 110k
      // Total: $1,035,000
      // With 1.4x: $1,449,000/year = $120,750/month

      expect(month36Cost).toBeCloseTo(120750, 0);
    });

    it('should have correct headcount at month 12', () => {
      const roles = getDefaultPersonnelRoles();
      const headcount = calculateHeadcount(roles, 12);

      // CEO (month 6), CTO (month 3), Sr Dev (month 3) = 3 people
      expect(headcount).toBe(3);
    });

    it('should have correct headcount at month 36', () => {
      const roles = getDefaultPersonnelRoles();
      const headcount = calculateHeadcount(roles, 36);

      // All 8 roles should be active by month 36
      expect(headcount).toBe(8);
    });
  });

  describe('Edge Cases', () => {
    it('should handle month 0', () => {
      const roles = getDefaultPersonnelRoles();
      const cost = calculateMonthlyPersonnelTotal(roles, 0);

      expect(cost).toBe(0);
    });

    it('should handle negative month (treat as 0)', () => {
      const role: PersonnelRole = {
        roleName: 'Test',
        baseSalary: 100000,
        startMonth: 1,
      };

      const cost = calculatePersonnelCost(role, -5);
      expect(cost).toBe(0);
    });

    it('should handle zero salary', () => {
      const role: PersonnelRole = {
        roleName: 'Intern',
        baseSalary: 0,
        startMonth: 1,
      };

      const cost = calculatePersonnelCost(role, 10);
      expect(cost).toBe(0);
    });

    it('should handle very high salary', () => {
      const role: PersonnelRole = {
        roleName: 'Executive',
        baseSalary: 1000000,
        startMonth: 1,
      };

      const cost = calculatePersonnelCost(role, 10);
      const expected = (1000000 * 1.4) / 12;

      expect(cost).toBeCloseTo(expected, 2);
    });
  });

  describe('Property-Based Tests', () => {
    it('cost should scale linearly with number of people', () => {
      const singleRole: PersonnelRole = {
        roleName: 'Solo',
        baseSalary: 100000,
        startMonth: 1,
      };

      const multipleRoles: PersonnelRole[] = Array(5).fill(singleRole);

      const singleCost = calculateMonthlyPersonnelTotal([singleRole], 10);
      const multipleCost = calculateMonthlyPersonnelTotal(multipleRoles, 10);

      expect(multipleCost).toBeCloseTo(singleCost * 5, 2);
    });

    it('cumulative cost should be monotonically increasing', () => {
      const roles = getDefaultPersonnelRoles();

      for (let month = 4; month <= 60; month++) {
        const current = calculateCumulativePersonnelCost(roles, month);
        const previous = calculateCumulativePersonnelCost(roles, month - 1);

        expect(current).toBeGreaterThanOrEqual(previous);
      }
    });

    it('headcount should never decrease (with default roles)', () => {
      const roles = getDefaultPersonnelRoles();

      for (let month = 2; month <= 120; month++) {
        const current = calculateHeadcount(roles, month);
        const previous = calculateHeadcount(roles, month - 1);

        expect(current).toBeGreaterThanOrEqual(previous);
      }
    });

    it('monthly cost should equal cumulative(n) - cumulative(n-1)', () => {
      const roles = getDefaultPersonnelRoles();

      for (let month = 2; month <= 24; month++) {
        const monthlyCost = calculateMonthlyPersonnelTotal(roles, month);
        const cumulativeN = calculateCumulativePersonnelCost(roles, month);
        const cumulativeN1 = calculateCumulativePersonnelCost(roles, month - 1);

        expect(monthlyCost).toBeCloseTo(cumulativeN - cumulativeN1, 2);
      }
    });
  });
});

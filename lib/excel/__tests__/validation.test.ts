/**
 * Excel Validation Tests
 *
 * Unit tests for Excel import validation logic
 */

import { describe, it, expect } from 'vitest';
import { validateImportData } from '../validation';
import type { WorkbookData } from '../types';

describe('Excel Validation', () => {
  describe('validateImportData', () => {
    it('should pass validation for valid data', () => {
      const data: WorkbookData = {
        assumptions: [
          {
            key: 'initial_customers',
            value: '100',
            category: 'Revenue',
            description: 'Starting customer count',
          },
        ],
        revenueProjections: [
          {
            year: 2025,
            customers: { value: 100, isCalculated: false },
            arr: { value: 1000000, isCalculated: false },
            setupFees: { value: 50000, isCalculated: false },
            totalRevenue: { value: 1050000, formula: 'C2+D2', isCalculated: true },
          },
        ],
        opexProjections: [
          {
            month: 1,
            personnelCost: { value: 50000, isCalculated: false },
            headcount: { value: 5, isCalculated: false },
            marketing: { value: 20000, isCalculated: false },
            sales: { value: 15000, isCalculated: false },
            infrastructure: { value: 10000, isCalculated: false },
            facilities: { value: 5000, isCalculated: false },
            professionalServices: { value: 3000, isCalculated: false },
            other: { value: 2000, isCalculated: false },
            totalOpex: { value: 105000, formula: 'SUM(B2:I2)', isCalculated: true },
          },
        ],
        personnelRoles: [
          {
            roleName: 'CEO',
            baseSalary: 200000,
            startMonth: 1,
            department: 'Executive',
          },
        ],
        fundingRounds: [
          {
            roundName: 'Seed',
            amountRaised: 1000000,
            preMoneyValuation: 4000000,
            postMoneyValuation: 5000000,
            closeDate: '2025-01-15',
          },
        ],
        metadata: {
          fileName: 'test.xlsx',
          sheets: ['Assumptions', 'Revenue', 'OPEX', 'Personnel', 'Funding'],
          importedAt: new Date(),
        },
      };

      const result = validateImportData(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should detect missing required fields', () => {
      const data: WorkbookData = {
        assumptions: [
          {
            key: '',
            value: '100',
          },
        ],
        revenueProjections: [],
        opexProjections: [],
        personnelRoles: [],
        fundingRounds: [],
        metadata: {
          fileName: 'test.xlsx',
          sheets: [],
          importedAt: new Date(),
        },
      };

      const result = validateImportData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].field).toBe('key');
    });

    it('should detect negative values', () => {
      const data: WorkbookData = {
        assumptions: [],
        revenueProjections: [
          {
            year: 2025,
            customers: { value: -10, isCalculated: false },
            arr: { value: 1000000, isCalculated: false },
            setupFees: { value: 50000, isCalculated: false },
            totalRevenue: { value: 1050000, isCalculated: false },
          },
        ],
        opexProjections: [],
        personnelRoles: [],
        fundingRounds: [],
        metadata: {
          fileName: 'test.xlsx',
          sheets: [],
          importedAt: new Date(),
        },
      };

      const result = validateImportData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.field === 'customers')).toBe(true);
    });

    it('should detect duplicate years in revenue projections', () => {
      const data: WorkbookData = {
        assumptions: [],
        revenueProjections: [
          {
            year: 2025,
            customers: { value: 100, isCalculated: false },
            arr: { value: 1000000, isCalculated: false },
            setupFees: { value: 50000, isCalculated: false },
            totalRevenue: { value: 1050000, isCalculated: false },
          },
          {
            year: 2025,
            customers: { value: 120, isCalculated: false },
            arr: { value: 1200000, isCalculated: false },
            setupFees: { value: 60000, isCalculated: false },
            totalRevenue: { value: 1260000, isCalculated: false },
          },
        ],
        opexProjections: [],
        personnelRoles: [],
        fundingRounds: [],
        metadata: {
          fileName: 'test.xlsx',
          sheets: [],
          importedAt: new Date(),
        },
      };

      const result = validateImportData(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.some((e) => e.message.includes('Duplicate year'))).toBe(true);
    });

    it('should warn about customer growth over 10x', () => {
      const data: WorkbookData = {
        assumptions: [],
        revenueProjections: [
          {
            year: 2025,
            customers: { value: 100, isCalculated: false },
            arr: { value: 1000000, isCalculated: false },
            setupFees: { value: 50000, isCalculated: false },
            totalRevenue: { value: 1050000, isCalculated: false },
          },
          {
            year: 2026,
            customers: { value: 1500, isCalculated: false },
            arr: { value: 15000000, isCalculated: false },
            setupFees: { value: 750000, isCalculated: false },
            totalRevenue: { value: 15750000, isCalculated: false },
          },
        ],
        opexProjections: [],
        personnelRoles: [],
        fundingRounds: [],
        metadata: {
          fileName: 'test.xlsx',
          sheets: [],
          importedAt: new Date(),
        },
      };

      const result = validateImportData(data);

      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings.some((w) => w.message.includes('exceeds 10x'))).toBe(true);
    });
  });
});

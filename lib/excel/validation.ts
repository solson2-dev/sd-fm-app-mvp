/**
 * Excel Import Validation
 *
 * Validates imported Excel data for correctness, completeness, and business logic
 */

import type {
  WorkbookData,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  AssumptionImport,
  RevenueProjectionImport,
  OPEXProjectionImport,
  PersonnelRoleImport,
  FundingRoundImport,
} from './types';

// ============================================================================
// Main Validation Function
// ============================================================================

/**
 * Validate all imported data
 * @param data - The parsed workbook data
 * @returns Validation result with errors and warnings
 */
export function validateImportData(data: WorkbookData): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validate each data type
  errors.push(...validateAssumptions(data.assumptions));
  errors.push(...validateRevenueProjections(data.revenueProjections));
  errors.push(...validateOPEXProjections(data.opexProjections));
  errors.push(...validatePersonnelRoles(data.personnelRoles));
  errors.push(...validateFundingRounds(data.fundingRounds));

  // Cross-validation
  warnings.push(...validateBusinessLogic(data));

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

// ============================================================================
// Individual Validators
// ============================================================================

/**
 * Validate Assumptions
 */
function validateAssumptions(assumptions: AssumptionImport[]): ValidationError[] {
  const errors: ValidationError[] = [];

  if (assumptions.length === 0) {
    errors.push({
      field: 'assumptions',
      message: 'No assumptions found in the imported file',
      sheet: 'Assumptions',
    });
    return errors;
  }

  assumptions.forEach((assumption, index) => {
    const row = index + 2; // Account for header row

    // Required fields
    if (!assumption.key || assumption.key.trim() === '') {
      errors.push({
        field: 'key',
        message: 'Assumption key is required',
        row,
        sheet: 'Assumptions',
      });
    }

    if (assumption.value === null || assumption.value === undefined || assumption.value === '') {
      errors.push({
        field: 'value',
        message: 'Assumption value is required',
        row,
        sheet: 'Assumptions',
        value: assumption.key,
      });
    }

    // Check for duplicate keys
    const duplicates = assumptions.filter((a) => a.key === assumption.key);
    if (duplicates.length > 1 && index === assumptions.indexOf(assumption)) {
      errors.push({
        field: 'key',
        message: `Duplicate assumption key: ${assumption.key}`,
        row,
        sheet: 'Assumptions',
        value: assumption.key,
      });
    }
  });

  return errors;
}

/**
 * Validate Revenue Projections
 */
function validateRevenueProjections(
  projections: RevenueProjectionImport[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (projections.length === 0) {
    errors.push({
      field: 'revenue_projections',
      message: 'No revenue projections found in the imported file',
      sheet: 'Revenue',
    });
    return errors;
  }

  projections.forEach((projection, index) => {
    const row = index + 2;

    // Required fields
    if (!projection.year || projection.year < 2000 || projection.year > 2100) {
      errors.push({
        field: 'year',
        message: 'Invalid year value',
        row,
        sheet: 'Revenue',
        value: projection.year,
      });
    }

    // Non-negative values
    if (projection.customers.value < 0) {
      errors.push({
        field: 'customers',
        message: 'Customers cannot be negative',
        row,
        sheet: 'Revenue',
        value: projection.customers.value,
      });
    }

    if (projection.arr.value < 0) {
      errors.push({
        field: 'arr',
        message: 'ARR cannot be negative',
        row,
        sheet: 'Revenue',
        value: projection.arr.value,
      });
    }

    if (projection.setupFees.value < 0) {
      errors.push({
        field: 'setupFees',
        message: 'Setup fees cannot be negative',
        row,
        sheet: 'Revenue',
        value: projection.setupFees.value,
      });
    }

    if (projection.totalRevenue.value < 0) {
      errors.push({
        field: 'totalRevenue',
        message: 'Total revenue cannot be negative',
        row,
        sheet: 'Revenue',
        value: projection.totalRevenue.value,
      });
    }

    // Business logic: total revenue should equal ARR + setup fees (with tolerance for rounding)
    const calculatedTotal = projection.arr.value + projection.setupFees.value;
    const tolerance = 1; // $1 tolerance for rounding errors
    if (
      Math.abs(projection.totalRevenue.value - calculatedTotal) > tolerance &&
      !projection.totalRevenue.isCalculated
    ) {
      errors.push({
        field: 'totalRevenue',
        message: `Total revenue (${projection.totalRevenue.value}) should equal ARR + Setup Fees (${calculatedTotal})`,
        row,
        sheet: 'Revenue',
        value: projection.totalRevenue.value,
      });
    }

    // Check for duplicate years
    const duplicates = projections.filter((p) => p.year === projection.year);
    if (duplicates.length > 1 && index === projections.indexOf(projection)) {
      errors.push({
        field: 'year',
        message: `Duplicate year: ${projection.year}`,
        row,
        sheet: 'Revenue',
        value: projection.year,
      });
    }
  });

  return errors;
}

/**
 * Validate OPEX Projections
 */
function validateOPEXProjections(
  projections: OPEXProjectionImport[]
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (projections.length === 0) {
    errors.push({
      field: 'opex_projections',
      message: 'No OPEX projections found in the imported file',
      sheet: 'OPEX',
    });
    return errors;
  }

  projections.forEach((projection, index) => {
    const row = index + 2;

    // Required fields
    if (!projection.month || projection.month < 1 || projection.month > 120) {
      errors.push({
        field: 'month',
        message: 'Invalid month value (must be between 1 and 120)',
        row,
        sheet: 'OPEX',
        value: projection.month,
      });
    }

    // Non-negative values
    const fields = [
      'personnelCost',
      'headcount',
      'marketing',
      'sales',
      'infrastructure',
      'facilities',
      'professionalServices',
      'other',
      'totalOpex',
    ] as const;

    fields.forEach((field) => {
      if (projection[field].value < 0) {
        errors.push({
          field,
          message: `${field} cannot be negative`,
          row,
          sheet: 'OPEX',
          value: projection[field].value,
        });
      }
    });

    // Business logic: total OPEX should equal sum of all components
    const calculatedTotal =
      projection.personnelCost.value +
      projection.marketing.value +
      projection.sales.value +
      projection.infrastructure.value +
      projection.facilities.value +
      projection.professionalServices.value +
      projection.other.value;

    const tolerance = 1; // $1 tolerance
    if (
      Math.abs(projection.totalOpex.value - calculatedTotal) > tolerance &&
      !projection.totalOpex.isCalculated
    ) {
      errors.push({
        field: 'totalOpex',
        message: `Total OPEX (${projection.totalOpex.value}) should equal sum of components (${calculatedTotal})`,
        row,
        sheet: 'OPEX',
        value: projection.totalOpex.value,
      });
    }

    // Check for duplicate months
    const duplicates = projections.filter((p) => p.month === projection.month);
    if (duplicates.length > 1 && index === projections.indexOf(projection)) {
      errors.push({
        field: 'month',
        message: `Duplicate month: ${projection.month}`,
        row,
        sheet: 'OPEX',
        value: projection.month,
      });
    }
  });

  return errors;
}

/**
 * Validate Personnel Roles
 */
function validatePersonnelRoles(roles: PersonnelRoleImport[]): ValidationError[] {
  const errors: ValidationError[] = [];

  roles.forEach((role, index) => {
    const row = index + 2;

    // Required fields
    if (!role.roleName || role.roleName.trim() === '') {
      errors.push({
        field: 'roleName',
        message: 'Role name is required',
        row,
        sheet: 'Personnel',
      });
    }

    if (!role.baseSalary || role.baseSalary <= 0) {
      errors.push({
        field: 'baseSalary',
        message: 'Base salary must be greater than 0',
        row,
        sheet: 'Personnel',
        value: role.baseSalary,
      });
    }

    if (!role.startMonth || role.startMonth < 1 || role.startMonth > 120) {
      errors.push({
        field: 'startMonth',
        message: 'Start month must be between 1 and 120',
        row,
        sheet: 'Personnel',
        value: role.startMonth,
      });
    }

    // End month validation
    if (role.endMonth !== undefined) {
      if (role.endMonth < 1 || role.endMonth > 120) {
        errors.push({
          field: 'endMonth',
          message: 'End month must be between 1 and 120',
          row,
          sheet: 'Personnel',
          value: role.endMonth,
        });
      }

      if (role.endMonth <= role.startMonth) {
        errors.push({
          field: 'endMonth',
          message: 'End month must be after start month',
          row,
          sheet: 'Personnel',
          value: role.endMonth,
        });
      }
    }
  });

  return errors;
}

/**
 * Validate Funding Rounds
 */
function validateFundingRounds(rounds: FundingRoundImport[]): ValidationError[] {
  const errors: ValidationError[] = [];

  rounds.forEach((round, index) => {
    const row = index + 2;

    // Required fields
    if (!round.roundName || round.roundName.trim() === '') {
      errors.push({
        field: 'roundName',
        message: 'Round name is required',
        row,
        sheet: 'Funding',
      });
    }

    if (!round.amountRaised || round.amountRaised <= 0) {
      errors.push({
        field: 'amountRaised',
        message: 'Amount raised must be greater than 0',
        row,
        sheet: 'Funding',
        value: round.amountRaised,
      });
    }

    if (!round.postMoneyValuation || round.postMoneyValuation <= 0) {
      errors.push({
        field: 'postMoneyValuation',
        message: 'Post-money valuation must be greater than 0',
        row,
        sheet: 'Funding',
        value: round.postMoneyValuation,
      });
    }

    // Date validation
    if (!round.closeDate) {
      errors.push({
        field: 'closeDate',
        message: 'Close date is required',
        row,
        sheet: 'Funding',
      });
    } else {
      const date = new Date(round.closeDate);
      if (isNaN(date.getTime())) {
        errors.push({
          field: 'closeDate',
          message: 'Invalid date format',
          row,
          sheet: 'Funding',
          value: round.closeDate,
        });
      }
    }

    // Valuation logic
    if (round.preMoneyValuation && round.postMoneyValuation) {
      const expectedPost = round.preMoneyValuation + round.amountRaised;
      const tolerance = 1000; // $1000 tolerance
      if (Math.abs(round.postMoneyValuation - expectedPost) > tolerance) {
        errors.push({
          field: 'postMoneyValuation',
          message: `Post-money valuation (${round.postMoneyValuation}) should equal pre-money (${round.preMoneyValuation}) + amount raised (${round.amountRaised})`,
          row,
          sheet: 'Funding',
          value: round.postMoneyValuation,
        });
      }
    }

    // Check for duplicate round names
    const duplicates = rounds.filter((r) => r.roundName === round.roundName);
    if (duplicates.length > 1 && index === rounds.indexOf(round)) {
      errors.push({
        field: 'roundName',
        message: `Duplicate round name: ${round.roundName}`,
        row,
        sheet: 'Funding',
        value: round.roundName,
      });
    }
  });

  return errors;
}

// ============================================================================
// Business Logic Validation
// ============================================================================

/**
 * Validate cross-sheet business logic
 */
function validateBusinessLogic(data: WorkbookData): ValidationWarning[] {
  const warnings: ValidationWarning[] = [];

  // Check if revenue projections align with time period
  if (data.revenueProjections.length > 0) {
    const years = data.revenueProjections.map((p) => p.year).sort((a, b) => a - b);
    const gaps = [];

    for (let i = 1; i < years.length; i++) {
      if (years[i] - years[i - 1] > 1) {
        gaps.push(`${years[i - 1]} to ${years[i]}`);
      }
    }

    if (gaps.length > 0) {
      warnings.push({
        field: 'year',
        message: `Revenue projections have gaps in years: ${gaps.join(', ')}`,
        sheet: 'Revenue',
      });
    }
  }

  // Check if OPEX projections align with time period
  if (data.opexProjections.length > 0) {
    const months = data.opexProjections.map((p) => p.month).sort((a, b) => a - b);
    const gaps = [];

    for (let i = 1; i < months.length; i++) {
      if (months[i] - months[i - 1] > 1) {
        gaps.push(`${months[i - 1]} to ${months[i]}`);
      }
    }

    if (gaps.length > 0) {
      warnings.push({
        field: 'month',
        message: `OPEX projections have gaps in months: ${gaps.join(', ')}`,
        sheet: 'OPEX',
      });
    }
  }

  // Check if personnel costs align with OPEX
  if (data.personnelRoles.length > 0 && data.opexProjections.length > 0) {
    // This is a simplified check - full implementation would calculate expected personnel costs
    const totalPersonnelSalaries = data.personnelRoles.reduce(
      (sum, role) => sum + role.baseSalary,
      0
    );

    const avgMonthlyOpexPersonnel =
      data.opexProjections.reduce((sum, p) => sum + p.personnelCost.value, 0) /
      data.opexProjections.length;

    // Warn if average monthly personnel cost is significantly different from total salaries / 12
    const expectedMonthly = totalPersonnelSalaries / 12;
    if (Math.abs(avgMonthlyOpexPersonnel - expectedMonthly) > expectedMonthly * 0.5) {
      warnings.push({
        field: 'personnelCost',
        message: `Average monthly personnel cost (${avgMonthlyOpexPersonnel.toFixed(0)}) differs significantly from expected (${expectedMonthly.toFixed(0)})`,
        sheet: 'OPEX',
      });
    }
  }

  // Check customer growth logic
  if (data.revenueProjections.length > 1) {
    for (let i = 1; i < data.revenueProjections.length; i++) {
      const prev = data.revenueProjections[i - 1];
      const curr = data.revenueProjections[i];

      // Warn about negative customer growth
      if (curr.customers.value < prev.customers.value) {
        warnings.push({
          field: 'customers',
          message: `Customer count decreased from ${prev.customers.value} in ${prev.year} to ${curr.customers.value} in ${curr.year}`,
          sheet: 'Revenue',
          value: curr.year,
        });
      }

      // Warn about unrealistic growth (>10x year over year)
      if (curr.customers.value > prev.customers.value * 10) {
        warnings.push({
          field: 'customers',
          message: `Customer growth from ${prev.year} to ${curr.year} exceeds 10x (${prev.customers.value} to ${curr.customers.value})`,
          sheet: 'Revenue',
          value: curr.year,
        });
      }
    }
  }

  return warnings;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Validate file type
 */
export function validateFileType(file: File): ValidationError | null {
  const validExtensions = ['.xlsx', '.xlsm'];
  const fileName = file.name.toLowerCase();

  if (!validExtensions.some((ext) => fileName.endsWith(ext))) {
    return {
      field: 'file',
      message: 'Invalid file type. Please upload an Excel file (.xlsx or .xlsm)',
      value: file.name,
    };
  }

  return null;
}

/**
 * Validate file size
 */
export function validateFileSize(file: File, maxSizeMB: number = 10): ValidationError | null {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (file.size > maxSizeBytes) {
    return {
      field: 'file',
      message: `File size (${(file.size / 1024 / 1024).toFixed(2)}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
      value: file.size,
    };
  }

  return null;
}

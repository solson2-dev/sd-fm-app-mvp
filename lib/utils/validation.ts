/**
 * Validation utilities for form inputs
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a number is positive
 */
export function validatePositiveNumber(value: number, fieldName: string): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < 0) {
    return { isValid: false, error: `${fieldName} must be positive` };
  }
  return { isValid: true };
}

/**
 * Validate a number is within a range
 */
export function validateRange(
  value: number,
  fieldName: string,
  min: number,
  max: number
): ValidationResult {
  if (isNaN(value)) {
    return { isValid: false, error: `${fieldName} must be a valid number` };
  }
  if (value < min || value > max) {
    return {
      isValid: false,
      error: `${fieldName} must be between ${min} and ${max}`,
    };
  }
  return { isValid: true };
}

/**
 * Validate a percentage (0-100)
 */
export function validatePercentage(value: number, fieldName: string): ValidationResult {
  return validateRange(value, fieldName, 0, 100);
}

/**
 * Validate a date is not in the future
 */
export function validatePastDate(date: string, fieldName: string): ValidationResult {
  const inputDate = new Date(date);
  const today = new Date();

  if (isNaN(inputDate.getTime())) {
    return { isValid: false, error: `${fieldName} must be a valid date` };
  }

  if (inputDate > today) {
    return { isValid: false, error: `${fieldName} cannot be in the future` };
  }

  return { isValid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: any, fieldName: string): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { isValid: false, error: `${fieldName} is required` };
  }
  return { isValid: true };
}

/**
 * Validate salary range
 */
export function validateSalary(salary: number): ValidationResult {
  return validateRange(salary, 'Salary', 0, 1000000);
}

/**
 * Validate start month
 */
export function validateStartMonth(month: number, fieldName: string = 'Start month'): ValidationResult {
  return validateRange(month, fieldName, 1, 360); // Max 30 years
}

/**
 * Validate funding amount
 */
export function validateFundingAmount(amount: number): ValidationResult {
  const result = validatePositiveNumber(amount, 'Funding amount');
  if (!result.isValid) return result;

  if (amount < 10000) {
    return { isValid: false, error: 'Funding amount must be at least $10,000' };
  }

  if (amount > 1000000000) {
    return { isValid: false, error: 'Funding amount cannot exceed $1B' };
  }

  return { isValid: true };
}

/**
 * Validate valuation
 */
export function validateValuation(valuation: number, amount?: number): ValidationResult {
  const result = validatePositiveNumber(valuation, 'Valuation');
  if (!result.isValid) return result;

  if (valuation < 100000) {
    return { isValid: false, error: 'Valuation must be at least $100,000' };
  }

  // Valuation should be greater than funding amount
  if (amount && valuation < amount) {
    return { isValid: false, error: 'Post-money valuation must be greater than funding amount' };
  }

  return { isValid: true };
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(results: ValidationResult[]): string[] {
  return results
    .filter(r => !r.isValid)
    .map(r => r.error!)
    .filter(Boolean);
}

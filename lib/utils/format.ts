/**
 * Formatting utilities for financial data display
 */

/**
 * Format currency with proper thousands separators and decimals
 */
export function formatCurrency(
  value: number,
  options: {
    decimals?: number;
    compact?: boolean;
    showCents?: boolean;
  } = {}
): string {
  const { decimals = 0, compact = false, showCents = false } = options;

  if (compact) {
    if (Math.abs(value) >= 1_000_000_000) {
      return `$${(value / 1_000_000_000).toFixed(1)}B`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `$${(value / 1_000_000).toFixed(1)}M`;
    }
    if (Math.abs(value) >= 1_000) {
      return `$${(value / 1_000).toFixed(1)}K`;
    }
  }

  const finalDecimals = showCents ? 2 : decimals;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: finalDecimals,
    maximumFractionDigits: finalDecimals,
  }).format(value);
}

/**
 * Format percentage with proper decimal places
 */
export function formatPercent(
  value: number,
  options: { decimals?: number; includeSign?: boolean } = {}
): string {
  const { decimals = 1, includeSign = false } = options;

  const formatted = new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);

  if (includeSign && value > 0) {
    return `+${formatted}`;
  }

  return formatted;
}

/**
 * Format number with thousands separators
 */
export function formatNumber(
  value: number,
  decimals: number = 0
): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Format multiple (e.g., 5.2x)
 */
export function formatMultiple(value: number, decimals: number = 1): string {
  return `${formatNumber(value, decimals)}x`;
}

/**
 * Get color class for positive/negative values
 */
export function getValueColor(value: number): string {
  if (value > 0) return 'text-green-600';
  if (value < 0) return 'text-red-600';
  return 'text-gray-900';
}

/**
 * Format year label (e.g., "Year 1", "Y1")
 */
export function formatYear(year: number, compact: boolean = false): string {
  return compact ? `Y${year}` : `Year ${year}`;
}

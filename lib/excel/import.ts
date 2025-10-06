/**
 * Excel Import Parser
 *
 * Core functionality for parsing Excel files and extracting financial data
 * Supports formula preservation and multi-sheet workbooks
 */

import ExcelJS from 'exceljs';
import type {
  WorkbookData,
  AssumptionImport,
  RevenueProjectionImport,
  OPEXProjectionImport,
  PersonnelRoleImport,
  FundingRoundImport,
  CellValue,
} from './types';

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse an Excel file and extract all financial modeling data
 * @param file - The Excel file to parse (.xlsx format)
 * @returns Structured workbook data with all sheets parsed
 */
export async function parseExcelFile(file: File): Promise<WorkbookData> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);

  // Get all sheet names
  const sheets = workbook.worksheets.map((ws) => ws.name);

  // Parse each sheet type
  const assumptions = parseAssumptionsSheet(workbook);
  const revenueProjections = parseRevenueSheet(workbook);
  const opexProjections = parseOPEXSheet(workbook);
  const personnelRoles = parsePersonnelSheet(workbook);
  const fundingRounds = parseFundingSheet(workbook);

  return {
    assumptions,
    revenueProjections,
    opexProjections,
    personnelRoles,
    fundingRounds,
    metadata: {
      fileName: file.name,
      sheets,
      importedAt: new Date(),
    },
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get cell value with formula preservation
 */
function getCellValue<T = number | string>(
  cell: ExcelJS.Cell | undefined
): CellValue<T> {
  if (!cell || cell.value === null || cell.value === undefined) {
    return {
      value: (typeof cell?.value === 'number' ? 0 : '') as T,
      isCalculated: false,
    };
  }

  // Check if cell has a formula
  if (cell.formula || (typeof cell.value === 'object' && 'formula' in cell.value)) {
    const formulaObj = cell.value as { formula?: string; result?: unknown };
    return {
      value: (cell.result ?? formulaObj.result ?? 0) as T,
      formula: cell.formula || formulaObj.formula,
      isCalculated: true,
    };
  }

  // Regular value
  return {
    value: cell.value as T,
    isCalculated: false,
  };
}

/**
 * Get string value from cell
 */
function getCellString(cell: ExcelJS.Cell | undefined): string {
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }
  return String(cell.value).trim();
}

/**
 * Get number value from cell
 */
function getCellNumber(cell: ExcelJS.Cell | undefined): number {
  if (!cell || cell.value === null || cell.value === undefined) {
    return 0;
  }
  const value = typeof cell.value === 'object' && 'result' in cell.value
    ? cell.value.result
    : cell.value;
  return Number(value) || 0;
}

/**
 * Find worksheet by name (case-insensitive, fuzzy match)
 */
function findWorksheet(
  workbook: ExcelJS.Workbook,
  names: string[]
): ExcelJS.Worksheet | null {
  for (const name of names) {
    const worksheet = workbook.worksheets.find(
      (ws) => ws.name.toLowerCase().includes(name.toLowerCase())
    );
    if (worksheet) {
      return worksheet;
    }
  }
  return null;
}

/**
 * Check if row is empty
 */
function isRowEmpty(row: ExcelJS.Row): boolean {
  return row.values.every(
    (value) => value === null || value === undefined || value === ''
  );
}

// ============================================================================
// Sheet Parsers
// ============================================================================

/**
 * Parse Assumptions Sheet
 * Expected columns: Key, Value, Category, Description
 */
export function parseAssumptionsSheet(
  workbook: ExcelJS.Workbook
): AssumptionImport[] {
  const worksheet = findWorksheet(workbook, ['assumptions', 'assumption', 'variables']);
  if (!worksheet) {
    return [];
  }

  const assumptions: AssumptionImport[] = [];
  let headerRow = 0;

  // Find header row
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = getCellString(row.getCell(1)).toLowerCase();
    if (firstCell.includes('key') || firstCell.includes('name')) {
      headerRow = rowNumber;
      return;
    }
  });

  if (headerRow === 0) {
    headerRow = 1; // Default to first row
  }

  // Parse data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow || isRowEmpty(row)) {
      return;
    }

    const key = getCellString(row.getCell(1));
    const value = row.getCell(2).value;
    const category = getCellString(row.getCell(3));
    const description = getCellString(row.getCell(4));

    if (key) {
      assumptions.push({
        key,
        value: value !== null && value !== undefined ? String(value) : '',
        category: category || undefined,
        description: description || undefined,
      });
    }
  });

  return assumptions;
}

/**
 * Parse Revenue Projections Sheet
 * Expected columns: Year, Customers, ARR, Setup Fees, Total Revenue
 */
export function parseRevenueSheet(
  workbook: ExcelJS.Workbook
): RevenueProjectionImport[] {
  const worksheet = findWorksheet(workbook, ['revenue', 'revenue_projections', 'sales']);
  if (!worksheet) {
    return [];
  }

  const projections: RevenueProjectionImport[] = [];
  let headerRow = 0;

  // Find header row
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = getCellString(row.getCell(1)).toLowerCase();
    if (firstCell.includes('year')) {
      headerRow = rowNumber;
      return;
    }
  });

  if (headerRow === 0) {
    headerRow = 1;
  }

  // Parse data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow || isRowEmpty(row)) {
      return;
    }

    const year = getCellNumber(row.getCell(1));
    if (!year || year < 2000 || year > 2100) {
      return; // Skip invalid years
    }

    projections.push({
      year,
      customers: getCellValue<number>(row.getCell(2)),
      arr: getCellValue<number>(row.getCell(3)),
      setupFees: getCellValue<number>(row.getCell(4)),
      totalRevenue: getCellValue<number>(row.getCell(5)),
      endingCustomers: getCellValue<number>(row.getCell(6)),
      newCustomers: getCellValue<number>(row.getCell(7)),
      churnedCustomers: getCellValue<number>(row.getCell(8)),
    });
  });

  return projections;
}

/**
 * Parse OPEX Projections Sheet
 * Expected columns: Month, Personnel Cost, Headcount, Marketing, Sales,
 *                   Infrastructure, Facilities, Professional Services, Other, Total OPEX
 */
export function parseOPEXSheet(
  workbook: ExcelJS.Workbook
): OPEXProjectionImport[] {
  const worksheet = findWorksheet(workbook, ['opex', 'opex_projections', 'expenses', 'operating']);
  if (!worksheet) {
    return [];
  }

  const projections: OPEXProjectionImport[] = [];
  let headerRow = 0;

  // Find header row
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = getCellString(row.getCell(1)).toLowerCase();
    if (firstCell.includes('month')) {
      headerRow = rowNumber;
      return;
    }
  });

  if (headerRow === 0) {
    headerRow = 1;
  }

  // Parse data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow || isRowEmpty(row)) {
      return;
    }

    const month = getCellNumber(row.getCell(1));
    if (!month || month < 1 || month > 120) {
      return; // Skip invalid months
    }

    projections.push({
      month,
      personnelCost: getCellValue<number>(row.getCell(2)),
      headcount: getCellValue<number>(row.getCell(3)),
      marketing: getCellValue<number>(row.getCell(4)),
      sales: getCellValue<number>(row.getCell(5)),
      infrastructure: getCellValue<number>(row.getCell(6)),
      facilities: getCellValue<number>(row.getCell(7)),
      professionalServices: getCellValue<number>(row.getCell(8)),
      other: getCellValue<number>(row.getCell(9)),
      totalOpex: getCellValue<number>(row.getCell(10)),
      cumulativeOpex: getCellValue<number>(row.getCell(11)),
    });
  });

  return projections;
}

/**
 * Parse Personnel Sheet
 * Expected columns: Role Name, Base Salary, Start Month, End Month, Department
 */
export function parsePersonnelSheet(
  workbook: ExcelJS.Workbook
): PersonnelRoleImport[] {
  const worksheet = findWorksheet(workbook, ['personnel', 'headcount', 'staff', 'team']);
  if (!worksheet) {
    return [];
  }

  const roles: PersonnelRoleImport[] = [];
  let headerRow = 0;

  // Find header row
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = getCellString(row.getCell(1)).toLowerCase();
    if (firstCell.includes('role') || firstCell.includes('name') || firstCell.includes('position')) {
      headerRow = rowNumber;
      return;
    }
  });

  if (headerRow === 0) {
    headerRow = 1;
  }

  // Parse data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow || isRowEmpty(row)) {
      return;
    }

    const roleName = getCellString(row.getCell(1));
    const baseSalary = getCellNumber(row.getCell(2));
    const startMonth = getCellNumber(row.getCell(3));

    if (!roleName || !baseSalary || !startMonth) {
      return; // Skip incomplete rows
    }

    const endMonth = getCellNumber(row.getCell(4));
    const department = getCellString(row.getCell(5));

    roles.push({
      roleName,
      baseSalary,
      startMonth,
      endMonth: endMonth > 0 ? endMonth : undefined,
      department: department || undefined,
    });
  });

  return roles;
}

/**
 * Parse Funding Rounds Sheet
 * Expected columns: Round Name, Amount Raised, Pre-Money Valuation, Post-Money Valuation,
 *                   Price per Share, Shares Issued, Investor Ownership, Close Date
 */
export function parseFundingSheet(
  workbook: ExcelJS.Workbook
): FundingRoundImport[] {
  const worksheet = findWorksheet(workbook, ['funding', 'funding_rounds', 'investment', 'capital']);
  if (!worksheet) {
    return [];
  }

  const rounds: FundingRoundImport[] = [];
  let headerRow = 0;

  // Find header row
  worksheet.eachRow((row, rowNumber) => {
    const firstCell = getCellString(row.getCell(1)).toLowerCase();
    if (firstCell.includes('round') || firstCell.includes('name')) {
      headerRow = rowNumber;
      return;
    }
  });

  if (headerRow === 0) {
    headerRow = 1;
  }

  // Parse data rows
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber <= headerRow || isRowEmpty(row)) {
      return;
    }

    const roundName = getCellString(row.getCell(1));
    const amountRaised = getCellNumber(row.getCell(2));
    const closeDate = getCellString(row.getCell(8));

    if (!roundName || !amountRaised) {
      return; // Skip incomplete rows
    }

    const preMoneyValuation = getCellNumber(row.getCell(3));
    const postMoneyValuation = getCellNumber(row.getCell(4));
    const pricePerShare = getCellNumber(row.getCell(5));
    const sharesIssued = getCellNumber(row.getCell(6));
    const investorOwnership = getCellNumber(row.getCell(7));

    rounds.push({
      roundName,
      amountRaised,
      preMoneyValuation: preMoneyValuation > 0 ? preMoneyValuation : undefined,
      postMoneyValuation: postMoneyValuation > 0 ? postMoneyValuation : amountRaised,
      pricePerShare: pricePerShare > 0 ? pricePerShare : undefined,
      sharesIssued: sharesIssued > 0 ? sharesIssued : undefined,
      investorOwnership: investorOwnership > 0 ? investorOwnership : undefined,
      closeDate: closeDate || new Date().toISOString().split('T')[0],
    });
  });

  return rounds;
}

// ============================================================================
// Formula Translation
// ============================================================================

/**
 * Translate Excel formula to JavaScript expression
 * This is a simplified version - full implementation would need a complete parser
 */
export function translateExcelFormula(formula: string): string {
  if (!formula) {
    return '';
  }

  let translated = formula;

  // Remove leading = sign
  translated = translated.replace(/^=/, '');

  // Replace Excel functions with JS equivalents
  translated = translated.replace(/SUM\((.*?)\)/gi, 'sum($1)');
  translated = translated.replace(/PRODUCT\((.*?)\)/gi, 'product($1)');
  translated = translated.replace(/IF\((.*?)\)/gi, 'ifFunc($1)');
  translated = translated.replace(/MAX\((.*?)\)/gi, 'Math.max($1)');
  translated = translated.replace(/MIN\((.*?)\)/gi, 'Math.min($1)');
  translated = translated.replace(/ROUND\((.*?)\)/gi, 'Math.round($1)');

  // Cell references would need to be mapped to field names
  // This is application-specific and would be implemented based on schema
  // Example: A1 -> totalCustomers, B1 -> arr, etc.

  return translated;
}

/**
 * Check if a value is a formula
 */
export function isFormula(value: unknown): boolean {
  if (typeof value === 'string') {
    return value.trim().startsWith('=');
  }
  return false;
}

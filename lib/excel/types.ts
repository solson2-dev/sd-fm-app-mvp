/**
 * Excel Import Types
 *
 * TypeScript interfaces for Excel import functionality
 */

// ============================================================================
// Cell Value Types
// ============================================================================

export interface CellValue<T = number | string> {
  value: T;
  formula?: string;
  isCalculated: boolean;
}

// ============================================================================
// Import Data Structures
// ============================================================================

export interface AssumptionImport {
  key: string;
  value: string | number;
  category?: string;
  description?: string;
}

export interface RevenueProjectionImport {
  year: number;
  customers: CellValue<number>;
  arr: CellValue<number>;
  setupFees: CellValue<number>;
  totalRevenue: CellValue<number>;
  endingCustomers?: CellValue<number>;
  newCustomers?: CellValue<number>;
  churnedCustomers?: CellValue<number>;
}

export interface OPEXProjectionImport {
  month: number;
  personnelCost: CellValue<number>;
  headcount: CellValue<number>;
  marketing: CellValue<number>;
  sales: CellValue<number>;
  infrastructure: CellValue<number>;
  facilities: CellValue<number>;
  professionalServices: CellValue<number>;
  other: CellValue<number>;
  totalOpex: CellValue<number>;
  cumulativeOpex?: CellValue<number>;
}

export interface PersonnelRoleImport {
  roleName: string;
  baseSalary: number;
  startMonth: number;
  endMonth?: number;
  department?: string;
}

export interface FundingRoundImport {
  roundName: string;
  amountRaised: number;
  preMoneyValuation?: number;
  postMoneyValuation: number;
  pricePerShare?: number;
  sharesIssued?: number;
  investorOwnership?: number;
  closeDate: string;
  closeMonth?: number;
  esopRefreshTarget?: number;
}

// ============================================================================
// Workbook Data Structure
// ============================================================================

export interface WorkbookData {
  assumptions: AssumptionImport[];
  revenueProjections: RevenueProjectionImport[];
  opexProjections: OPEXProjectionImport[];
  personnelRoles: PersonnelRoleImport[];
  fundingRounds: FundingRoundImport[];
  metadata: {
    fileName: string;
    sheets: string[];
    importedAt: Date;
  };
}

// ============================================================================
// Validation Results
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
  row?: number;
  sheet?: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  value?: unknown;
  row?: number;
  sheet?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

// ============================================================================
// Import Options
// ============================================================================

export interface ImportOptions {
  scenarioId: string;
  organizationId: string;
  mode: 'merge' | 'replace';
  validateOnly?: boolean;
  skipEmptyRows?: boolean;
}

// ============================================================================
// Import Result
// ============================================================================

export interface ImportSummary {
  success: boolean;
  recordsImported: {
    assumptions: number;
    revenueProjections: number;
    opexProjections: number;
    personnelRoles: number;
    fundingRounds: number;
  };
  errors: ValidationError[];
  warnings: ValidationWarning[];
  duration: number;
}

// ============================================================================
// Sheet Configuration
// ============================================================================

export interface SheetConfig {
  name: string;
  required: boolean;
  headerRow: number;
  dataStartRow: number;
  columns: ColumnConfig[];
}

export interface ColumnConfig {
  name: string;
  required: boolean;
  type: 'string' | 'number' | 'date' | 'formula';
  validate?: (value: unknown) => boolean;
}

// ============================================================================
// Preview Data
// ============================================================================

export interface ImportPreview {
  workbookData: WorkbookData;
  validation: ValidationResult;
  conflicts?: ConflictInfo[];
}

export interface ConflictInfo {
  type: 'assumptions' | 'revenue' | 'opex' | 'personnel' | 'funding';
  existingRecords: number;
  newRecords: number;
  message: string;
}

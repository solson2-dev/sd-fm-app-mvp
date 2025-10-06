# Excel Import Module

Quick reference for developers working with the Excel import functionality.

## Quick Start

```typescript
import { parseExcelFile, validateImportData, generateImportTemplate } from '@/lib/excel';

// Parse an Excel file
const workbookData = await parseExcelFile(file);

// Validate the data
const validation = validateImportData(workbookData);

if (validation.isValid) {
  // Import to database
  // See /app/api/excel/import/route.ts for example
}

// Generate template
const template = await generateImportTemplate();
```

## Module Structure

```
/lib/excel/
├── types.ts          # TypeScript interfaces
├── import.ts         # Excel parsing logic
├── validation.ts     # Data validation
├── template.ts       # Template generation
├── index.ts          # Module exports
└── __tests__/        # Unit tests
```

## Key Functions

### Parsing

```typescript
// Parse entire workbook
parseExcelFile(file: File): Promise<WorkbookData>

// Parse individual sheets
parseAssumptionsSheet(workbook: ExcelJS.Workbook): AssumptionImport[]
parseRevenueSheet(workbook: ExcelJS.Workbook): RevenueProjectionImport[]
parseOPEXSheet(workbook: ExcelJS.Workbook): OPEXProjectionImport[]
parsePersonnelSheet(workbook: ExcelJS.Workbook): PersonnelRoleImport[]
parseFundingSheet(workbook: ExcelJS.Workbook): FundingRoundImport[]
```

### Validation

```typescript
// Validate all data
validateImportData(data: WorkbookData): ValidationResult

// Validate file properties
validateFileType(file: File): ValidationError | null
validateFileSize(file: File, maxSizeMB?: number): ValidationError | null
```

### Template

```typescript
// Generate template workbook
generateImportTemplate(): Promise<ExcelJS.Workbook>

// Generate and download (client-side only)
downloadTemplate(filename?: string): Promise<void>
```

## Data Types

### WorkbookData
Contains all parsed data from Excel file:
```typescript
interface WorkbookData {
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
```

### CellValue
Stores value with optional formula:
```typescript
interface CellValue<T = number | string> {
  value: T;              // Calculated value
  formula?: string;      // Excel formula (e.g., "=C2+D2")
  isCalculated: boolean; // True if formula exists
}
```

### ValidationResult
Contains validation errors and warnings:
```typescript
interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}
```

## Usage Examples

### Example 1: Basic Import

```typescript
import { parseExcelFile, validateImportData } from '@/lib/excel';

async function handleImport(file: File) {
  try {
    // Parse file
    const data = await parseExcelFile(file);

    // Validate
    const validation = validateImportData(data);

    if (!validation.isValid) {
      console.error('Validation failed:', validation.errors);
      return;
    }

    // Import to database
    await importToDatabase(data);

  } catch (error) {
    console.error('Import failed:', error);
  }
}
```

### Example 2: Preview Before Import

```typescript
import { parseExcelFile, validateImportData } from '@/lib/excel';

async function handlePreview(file: File) {
  // Parse and validate
  const data = await parseExcelFile(file);
  const validation = validateImportData(data);

  // Show preview to user
  return {
    summary: {
      assumptions: data.assumptions.length,
      revenue: data.revenueProjections.length,
      opex: data.opexProjections.length,
    },
    validation,
  };
}
```

### Example 3: Formula Handling

```typescript
// Check if a field has a formula
const revenue = data.revenueProjections[0];
if (revenue.totalRevenue.isCalculated) {
  console.log('Formula:', revenue.totalRevenue.formula); // "=C2+D2"
  console.log('Value:', revenue.totalRevenue.value);     // 1050000
}

// Store in database
await db.insert({
  total_revenue: revenue.totalRevenue.value,
  total_revenue_formula: revenue.totalRevenue.formula,
});
```

### Example 4: Custom Validation

```typescript
import { validateImportData } from '@/lib/excel';

// Standard validation
const validation = validateImportData(data);

// Add custom validation
if (data.revenueProjections.length === 0) {
  validation.errors.push({
    field: 'revenue_projections',
    message: 'At least one revenue projection is required',
  });
  validation.isValid = false;
}
```

## API Endpoints

### POST /api/excel/import
Import Excel file to database.

**Request:**
```typescript
FormData {
  file: File
  scenarioId: string
  organizationId: string
  mode: 'merge' | 'replace'
  validateOnly?: boolean
}
```

**Response:**
```typescript
{
  success: boolean
  summary: ImportSummary
  validation: ValidationResult
}
```

### POST /api/excel/preview
Preview import without saving.

**Request:** Same as import (without validateOnly)

**Response:**
```typescript
{
  success: boolean
  preview: {
    workbookData: WorkbookData
    validation: ValidationResult
    conflicts: ConflictInfo[]
  }
}
```

### GET /api/excel/template
Download template file.

**Response:** Binary Excel file

## Validation Rules

### Assumptions
- ✅ key is required and unique
- ✅ value is required

### Revenue Projections
- ✅ year is required, unique, and between 2000-2100
- ✅ all values >= 0
- ✅ totalRevenue = ARR + setupFees (±$1)
- ⚠️ warn on year gaps
- ⚠️ warn on >10x growth

### OPEX Projections
- ✅ month is required, unique, and between 1-120
- ✅ all values >= 0
- ✅ totalOpex = sum of components (±$1)
- ⚠️ warn on month gaps

### Personnel Roles
- ✅ roleName is required
- ✅ baseSalary > 0
- ✅ startMonth between 1-120
- ✅ endMonth > startMonth (if provided)

### Funding Rounds
- ✅ roundName is required and unique
- ✅ amountRaised > 0
- ✅ postMoneyValuation > 0
- ✅ closeDate is valid date
- ✅ postMoney = preMoney + amount (±$1000)

## Error Handling

```typescript
try {
  const data = await parseExcelFile(file);
  const validation = validateImportData(data);

  if (!validation.isValid) {
    // Handle validation errors
    validation.errors.forEach(error => {
      console.error(`${error.field}: ${error.message}`);
    });
  }

  // Handle warnings
  validation.warnings.forEach(warning => {
    console.warn(`${warning.field}: ${warning.message}`);
  });

} catch (error) {
  if (error instanceof Error) {
    // Handle parsing errors
    console.error('Failed to parse Excel file:', error.message);
  }
}
```

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { validateImportData } from '@/lib/excel';

describe('Excel Import', () => {
  it('validates correct data', () => {
    const data = createValidWorkbookData();
    const result = validateImportData(data);
    expect(result.isValid).toBe(true);
  });
});
```

See `/lib/excel/__tests__/validation.test.ts` for more examples.

## Performance Tips

1. **Large Files**: Consider chunking for files > 5MB
2. **Validation**: Validate on client before uploading
3. **Batch Imports**: Use upsert for better performance
4. **Caching**: Cache parsed data if validating multiple times

## Common Issues

### "Formula not detected"
- Ensure cell starts with `=`
- ExcelJS should detect automatically

### "Validation too slow"
- Reduce dataset size
- Consider server-side validation only

### "Import timeout"
- Increase API timeout
- Use background processing

## Resources

- **Full Documentation**: `/EXCEL_IMPORT.md`
- **API Source**: `/app/api/excel/`
- **Tests**: `/lib/excel/__tests__/`
- **Template**: Download from `/api/excel/template`

## Support

For issues or questions:
- Check documentation: `EXCEL_IMPORT.md`
- Review test examples
- Contact: support@studiodatum.com

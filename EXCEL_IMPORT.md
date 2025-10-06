# Excel Import Documentation

Complete guide for using the Excel import functionality in the Studio Datum Financial Modeling application.

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Getting Started](#getting-started)
4. [Template Structure](#template-structure)
5. [Import Process](#import-process)
6. [Formula Preservation](#formula-preservation)
7. [Validation Rules](#validation-rules)
8. [API Reference](#api-reference)
9. [Troubleshooting](#troubleshooting)

## Overview

The Excel Import feature allows you to bulk-import financial modeling data from Excel spreadsheets (.xlsx format). This includes:

- Assumptions (key financial variables)
- Revenue Projections (annual revenue forecasts)
- OPEX Projections (monthly operating expenses)
- Personnel Roles (team members and salaries)
- Funding Rounds (investment capital raises)

**Key Benefits:**
- Import years of data in seconds
- Preserve Excel formulas for calculated fields
- Validate data before importing
- Preview changes before committing
- Choose merge or replace modes
- Track import history

## Features

### 1. Template Generation
- Download pre-formatted Excel template
- Sample data included for reference
- Clear instructions on each sheet
- Formula examples provided

### 2. Data Validation
- **File validation**: Type (.xlsx) and size (10MB max)
- **Required fields**: Ensures all mandatory data is present
- **Data types**: Validates numbers, dates, strings
- **Business logic**: Checks calculations and relationships
- **Duplicate detection**: Prevents duplicate years/months

### 3. Formula Preservation
- Detects and stores Excel formulas
- Maintains formula references
- Stores both calculated value and formula
- Enables formula-based recalculation

### 4. Import Modes
- **Merge**: Add new data, update existing records (recommended)
- **Replace**: Delete all existing data, import fresh (use with caution)

### 5. Preview & Conflict Detection
- Preview data before importing
- See what will be changed
- Detect conflicts with existing data
- Review validation errors and warnings

## Getting Started

### Step 1: Download Template

1. Navigate to `/import` page
2. Click "Download Template" button
3. Open `Financial_Model_Template.xlsx` in Excel

### Step 2: Fill in Your Data

Open the template and complete the relevant sheets:

#### Assumptions Sheet
- **Key** (required): Unique identifier (e.g., `initial_customers`)
- **Value** (required): Value (number or text)
- **Category**: Group assumptions (e.g., Revenue, Costs, OPEX)
- **Description**: Explain the assumption

#### Revenue Projections Sheet
- **Year** (required): Calendar year (YYYY format)
- **Customers** (required): Total customer count
- **ARR** (required): Annual Recurring Revenue
- **Setup Fees**: One-time fees
- **Total Revenue** (required): ARR + Setup Fees (can use formula: =C2+D2)

#### OPEX Projections Sheet
- **Month** (required): Month number (1-120)
- **Personnel Cost** (required): Monthly personnel expenses
- **Headcount** (required): Number of employees
- **Marketing**: Marketing budget
- **Sales**: Sales budget
- **Infrastructure**: Infrastructure costs
- **Facilities**: Facilities costs
- **Professional Services**: Consulting, legal, etc.
- **Other**: Other expenses
- **Total OPEX** (required): Sum of all expenses (can use formula)

#### Personnel Sheet
- **Role Name** (required): Position title
- **Base Salary** (required): Annual salary
- **Start Month** (required): Month employee starts (1-120)
- **End Month**: Month employee leaves (leave blank for ongoing)
- **Department**: Team/department name

#### Funding Rounds Sheet
- **Round Name** (required): Round identifier (e.g., Seed, Series A)
- **Amount Raised** (required): Investment amount
- **Pre-Money Valuation**: Valuation before investment
- **Post-Money Valuation** (required): Valuation after (can use formula: =B2+C2)
- **Price per Share**: Share price
- **Shares Issued**: Number of shares issued
- **Investor Ownership %**: Investor equity percentage
- **Close Date** (required): Date in YYYY-MM-DD format

### Step 3: Save and Upload

1. Save your Excel file
2. Return to `/import` page
3. Drag & drop file or click to browse
4. Wait for preview to load

### Step 4: Review Preview

The preview shows:
- **Data Summary**: Count of records per sheet
- **Validation Results**: Errors and warnings
- **Conflicts**: Existing data that will be affected
- **Import Mode**: Choose Merge or Replace

### Step 5: Import

1. Review all validation messages
2. Select import mode (Merge/Replace)
3. Click "Import Data"
4. Wait for confirmation
5. View import summary

## Template Structure

### File Format Requirements
- **Format**: .xlsx or .xlsm (Excel 2007+)
- **Size**: Maximum 10MB
- **Sheets**: At least one data sheet required

### Sheet Naming
The parser looks for sheets with these keywords (case-insensitive):
- **Assumptions**: "assumptions", "assumption", "variables"
- **Revenue**: "revenue", "revenue_projections", "sales"
- **OPEX**: "opex", "opex_projections", "expenses", "operating"
- **Personnel**: "personnel", "headcount", "staff", "team"
- **Funding**: "funding", "funding_rounds", "investment", "capital"

### Data Formatting
- **Numbers**: No currency symbols ($), commas are OK
- **Dates**: YYYY-MM-DD format preferred
- **Empty rows**: Will be skipped
- **Formulas**: Supported in numeric fields

## Import Process

### Architecture

```
User Upload → File Validation → Parse Excel → Validate Data → Preview
                                                                  ↓
Database ← Import Data ← User Confirmation ← Show Preview ←─────┘
```

### Processing Steps

1. **File Upload**
   - Validate file type and size
   - Upload to server

2. **Parsing**
   - Read Excel workbook with ExcelJS
   - Extract data from each sheet
   - Detect formulas in cells
   - Structure data into typed objects

3. **Validation**
   - Check required fields
   - Validate data types
   - Verify business logic
   - Check for duplicates
   - Cross-reference sheets

4. **Preview**
   - Display parsed data summary
   - Show validation results
   - Detect conflicts with existing data
   - Allow user to choose import mode

5. **Import**
   - Delete existing data (if Replace mode)
   - Insert/upsert records to database
   - Store formulas alongside values
   - Save import metadata
   - Record import history

## Formula Preservation

### How It Works

When a cell contains a formula, the system:
1. Detects the formula (starts with `=`)
2. Extracts the formula text (e.g., `=B2+C2`)
3. Stores the calculated value
4. Stores the formula text separately

### Database Schema

Formula columns are added with `_formula` suffix:

```sql
-- Example for annual_projections
ALTER TABLE annual_projections
ADD COLUMN arr_formula TEXT,
ADD COLUMN total_revenue_formula TEXT;
```

### Example

**Excel Cell:**
```
Total Revenue (E2): =C2+D2
Where C2 = 1000000 (ARR)
      D2 = 50000 (Setup Fees)
```

**Stored in Database:**
```json
{
  "total_revenue": 1050000,
  "total_revenue_formula": "C2+D2"
}
```

### Supported Functions

The parser detects all Excel formulas. Common functions:
- `SUM()`, `PRODUCT()`
- `IF()`, `MAX()`, `MIN()`
- `ROUND()`, `AVERAGE()`
- Cell references (A1, B2, etc.)
- Arithmetic operators (+, -, *, /)

### Formula Translation

For future enhancements, formulas can be translated to JavaScript:
- `=SUM(A1:A10)` → `sum(values)`
- `=IF(A1>100, "High", "Low")` → `value > 100 ? "High" : "Low"`

## Validation Rules

### File Validation

| Rule | Error/Warning | Message |
|------|---------------|---------|
| File type must be .xlsx or .xlsm | Error | Invalid file type |
| File size < 10MB | Error | File too large |

### Assumptions Validation

| Field | Rule | Error/Warning |
|-------|------|---------------|
| key | Required | Error |
| key | Unique | Error |
| value | Required | Error |

### Revenue Projections Validation

| Field | Rule | Error/Warning |
|-------|------|---------------|
| year | Required | Error |
| year | Between 2000-2100 | Error |
| year | Unique | Error |
| customers | >= 0 | Error |
| arr | >= 0 | Error |
| setupFees | >= 0 | Error |
| totalRevenue | = ARR + Setup Fees (±$1) | Error |
| Year gaps | Sequential | Warning |
| Customer growth | Not > 10x YoY | Warning |

### OPEX Projections Validation

| Field | Rule | Error/Warning |
|-------|------|---------------|
| month | Required | Error |
| month | Between 1-120 | Error |
| month | Unique | Error |
| All cost fields | >= 0 | Error |
| totalOpex | = Sum of components (±$1) | Error |
| Month gaps | Sequential | Warning |

### Personnel Roles Validation

| Field | Rule | Error/Warning |
|-------|------|---------------|
| roleName | Required | Error |
| baseSalary | > 0 | Error |
| startMonth | Between 1-120 | Error |
| endMonth | > startMonth | Error |

### Funding Rounds Validation

| Field | Rule | Error/Warning |
|-------|------|---------------|
| roundName | Required | Error |
| roundName | Unique | Error |
| amountRaised | > 0 | Error |
| postMoneyValuation | > 0 | Error |
| closeDate | Valid date | Error |
| postMoney | = preMoney + amount (±$1000) | Error |

## API Reference

### POST /api/excel/import

Import Excel file with data.

**Request:**
```typescript
FormData {
  file: File                    // Excel file (.xlsx)
  scenarioId: string            // Target scenario UUID
  organizationId: string        // Organization UUID
  mode: 'merge' | 'replace'     // Import mode
  validateOnly?: boolean        // Preview only, don't import
}
```

**Response:**
```typescript
{
  success: boolean
  summary: {
    success: boolean
    recordsImported: {
      assumptions: number
      revenueProjections: number
      opexProjections: number
      personnelRoles: number
      fundingRounds: number
    }
    errors: ValidationError[]
    warnings: ValidationWarning[]
    duration: number              // milliseconds
  }
  validation: ValidationResult
}
```

### POST /api/excel/preview

Preview import without committing.

**Request:**
```typescript
FormData {
  file: File                    // Excel file (.xlsx)
  scenarioId: string            // Target scenario UUID
  organizationId: string        // Organization UUID
}
```

**Response:**
```typescript
{
  success: boolean
  preview: {
    workbookData: WorkbookData    // Parsed data
    validation: ValidationResult   // Validation results
    conflicts: ConflictInfo[]      // Existing data conflicts
  }
}
```

### GET /api/excel/template

Download Excel template.

**Response:**
Binary Excel file (.xlsx)

## Troubleshooting

### Common Issues

#### "Invalid file type"
- **Cause**: File is not .xlsx or .xlsm
- **Solution**: Save file as Excel Workbook (.xlsx) format

#### "File too large"
- **Cause**: File exceeds 10MB limit
- **Solution**: Remove unnecessary sheets, images, or formatting

#### "Sheet not found"
- **Cause**: Sheet names don't match expected keywords
- **Solution**: Rename sheets to match template (Assumptions, Revenue, OPEX, Personnel, Funding)

#### "Validation failed"
- **Cause**: Data doesn't meet validation rules
- **Solution**: Review error messages in preview, fix issues in Excel, re-upload

#### "Duplicate year/month"
- **Cause**: Multiple rows with same year (Revenue) or month (OPEX)
- **Solution**: Remove or merge duplicate rows

#### "Total doesn't match formula"
- **Cause**: Manually entered total doesn't equal sum of components
- **Solution**: Use Excel formula (=SUM(B2:I2)) or manually correct the values

#### "Import failed"
- **Cause**: Database error or network issue
- **Solution**: Check browser console, contact support if persists

### Best Practices

1. **Start with Template**: Always use the downloaded template
2. **Fill Progressively**: Complete one sheet at a time
3. **Use Formulas**: Let Excel calculate totals
4. **Validate Early**: Upload and preview before completing all data
5. **Test with Small Dataset**: Import a few rows first
6. **Backup Existing Data**: Use Merge mode, not Replace
7. **Review Preview**: Always check validation results
8. **Check Conflicts**: Understand what will be overwritten

### Getting Help

- **Documentation**: Review this guide
- **Template Instructions**: See Instructions sheet in template
- **Validation Messages**: Read error/warning details carefully
- **Support**: Email support@studiodatum.com

## Advanced Usage

### Batch Imports

For large datasets:
1. Split data into multiple files (by year or category)
2. Import in sequence
3. Use Merge mode to combine data
4. Monitor import history

### Formula-Based Models

Build dynamic models:
1. Define assumptions in Assumptions sheet
2. Reference assumptions in formulas
3. Use Excel named ranges for clarity
4. Import with formulas preserved

### Import History

Track all imports:
- View import history in database (`import_history` table)
- See what was imported and when
- Review errors and warnings from past imports
- Audit data changes

### Custom Integrations

Extend the import functionality:
- Build custom parsers for other file formats
- Add validation rules specific to your business
- Integrate with external data sources
- Automate imports via API

## Technical Details

### Technology Stack
- **Parser**: ExcelJS 4.4.0
- **Backend**: Next.js 15 API Routes
- **Database**: Supabase PostgreSQL
- **Frontend**: React 19 with TypeScript

### File Structure
```
/lib/excel/
  ├── types.ts         # TypeScript interfaces
  ├── import.ts        # Excel parser
  ├── validation.ts    # Data validation
  └── template.ts      # Template generator

/app/api/excel/
  ├── import/route.ts  # Import endpoint
  ├── preview/route.ts # Preview endpoint
  └── template/route.ts # Template download

/app/
  ├── import/page.tsx  # Import UI
  └── components/excel/
      └── FileUpload.tsx # File upload component

/supabase/migrations/
  └── 00005_add_formula_columns.sql # Database schema
```

### Performance

- **Parsing**: ~1 second for 1000 rows
- **Validation**: ~0.5 seconds for 1000 records
- **Import**: ~2-5 seconds for 1000 records
- **Total**: < 10 seconds for typical import

### Security

- File type validation (magic number check)
- File size limits (10MB)
- Formula sanitization
- SQL injection prevention (parameterized queries)
- Row-level security (RLS) enforced
- Import history audit trail

## Future Enhancements

Planned improvements:
- [ ] Background processing for large files
- [ ] Progress updates during import
- [ ] Formula evaluation engine
- [ ] Cell reference mapping
- [ ] Import rollback/undo
- [ ] Export with formulas intact
- [ ] Real-time collaboration
- [ ] Version control for imports

---

**Version**: 1.0.0
**Last Updated**: October 6, 2025
**Maintainer**: Studio Datum Engineering Team

/**
 * Excel Template Generator
 *
 * Creates downloadable Excel templates for data import
 */

import ExcelJS from 'exceljs';

// ============================================================================
// Template Generation
// ============================================================================

/**
 * Generate a complete import template workbook
 * @returns ExcelJS workbook ready for download
 */
export async function generateImportTemplate(): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();

  workbook.creator = 'Studio Datum Financial Modeling';
  workbook.created = new Date();
  workbook.modified = new Date();

  // Create all sheets
  createInstructionsSheet(workbook);
  createAssumptionsSheet(workbook);
  createRevenueSheet(workbook);
  createOPEXSheet(workbook);
  createPersonnelSheet(workbook);
  createFundingSheet(workbook);

  return workbook;
}

// ============================================================================
// Sheet Creators
// ============================================================================

/**
 * Create Instructions Sheet
 */
function createInstructionsSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Instructions');

  // Title
  sheet.mergeCells('A1:F1');
  const titleCell = sheet.getCell('A1');
  titleCell.value = 'Financial Model Import Template - Instructions';
  titleCell.font = { size: 16, bold: true, color: { argb: 'FF1F4788' } };
  titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(1).height = 30;

  // Instructions content
  const instructions = [
    [''],
    ['OVERVIEW', ''],
    ['This template allows you to import financial data into your Studio Datum financial model.', ''],
    ['Complete the relevant sheets and upload the file to import your data.', ''],
    [''],
    ['SHEETS', ''],
    ['1. Assumptions', 'Key financial assumptions and variables'],
    ['2. Revenue Projections', 'Annual revenue projections (ARR, customers, setup fees)'],
    ['3. OPEX Projections', 'Monthly operating expense projections'],
    ['4. Personnel', 'Team members and their salaries'],
    ['5. Funding Rounds', 'Investment rounds and capital raises'],
    [''],
    ['GUIDELINES', ''],
    ['- Do not modify column headers', ''],
    ['- Required fields are marked with an asterisk (*)', ''],
    ['- Years should be in YYYY format (e.g., 2025)', ''],
    ['- Months should be numbered 1-120 (1 = Month 1)', ''],
    ['- Currency values should be in dollars (without $ symbol)', ''],
    ['- Dates should be in YYYY-MM-DD format', ''],
    ['- You can use Excel formulas in numeric fields', ''],
    ['- Empty rows will be skipped during import', ''],
    [''],
    ['VALIDATION', ''],
    ['- All required fields must be filled', ''],
    ['- Numeric values must be non-negative', ''],
    ['- Years must be between 2000-2100', ''],
    ['- Months must be between 1-120', ''],
    ['- Dates must be valid', ''],
    ['- No duplicate years in Revenue', ''],
    ['- No duplicate months in OPEX', ''],
    [''],
    ['SUPPORT', ''],
    ['For help, contact support@studiodatum.com', ''],
  ];

  instructions.forEach((row, index) => {
    const rowIndex = index + 3;
    sheet.getCell(`A${rowIndex}`).value = row[0];
    sheet.getCell(`B${rowIndex}`).value = row[1];

    if (row[0].match(/^[A-Z\s]+$/)) {
      // Section headers
      sheet.getCell(`A${rowIndex}`).font = { bold: true, size: 12 };
    }
  });

  // Column widths
  sheet.getColumn('A').width = 50;
  sheet.getColumn('B').width = 50;
}

/**
 * Create Assumptions Sheet
 */
function createAssumptionsSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Assumptions');

  // Headers
  const headers = ['Key *', 'Value *', 'Category', 'Description'];
  sheet.addRow(headers);

  // Style header row
  styleHeaderRow(sheet, 1, headers.length);

  // Sample data
  const sampleData = [
    ['initial_customers', '100', 'Revenue', 'Number of customers at launch'],
    ['monthly_churn_rate', '0.05', 'Revenue', 'Monthly customer churn rate (5%)'],
    ['avg_arr_per_customer', '10000', 'Revenue', 'Average annual recurring revenue per customer'],
    ['setup_fee', '5000', 'Revenue', 'One-time setup fee per new customer'],
    ['monthly_growth_rate', '0.10', 'Revenue', 'Monthly customer growth rate (10%)'],
    ['cogs_percentage', '0.20', 'Costs', 'Cost of goods sold as % of revenue'],
    ['marketing_budget', '50000', 'OPEX', 'Monthly marketing budget'],
    ['sales_budget', '30000', 'OPEX', 'Monthly sales budget'],
  ];

  sampleData.forEach((row) => {
    sheet.addRow(row);
  });

  // Column widths
  sheet.getColumn(1).width = 25;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 20;
  sheet.getColumn(4).width = 50;

  // Add note
  addSheetNote(sheet, 'Fill in your financial assumptions. Key and Value are required.');
}

/**
 * Create Revenue Projections Sheet
 */
function createRevenueSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Revenue Projections');

  // Headers
  const headers = [
    'Year *',
    'Customers *',
    'ARR *',
    'Setup Fees',
    'Total Revenue *',
    'Ending Customers',
    'New Customers',
    'Churned Customers',
  ];
  sheet.addRow(headers);

  // Style header row
  styleHeaderRow(sheet, 1, headers.length);

  // Sample data with formulas
  const currentYear = new Date().getFullYear();
  const sampleData = [
    [currentYear, 100, 1000000, 50000, { formula: 'C2+D2' }, 120, 25, 5],
    [currentYear + 1, { formula: 'F2' }, 1200000, 60000, { formula: 'C3+D3' }, 150, 35, 5],
    [currentYear + 2, { formula: 'F3' }, 1500000, 75000, { formula: 'C4+D4' }, 190, 45, 5],
    [currentYear + 3, { formula: 'F4' }, 1900000, 95000, { formula: 'C5+D5' }, 240, 55, 5],
    [currentYear + 4, { formula: 'F5' }, 2400000, 120000, { formula: 'C6+D6' }, 300, 65, 5],
  ];

  sampleData.forEach((row) => {
    sheet.addRow(row);
  });

  // Column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.getColumn(i).width = 18;
  }

  // Number formatting
  for (let row = 2; row <= sampleData.length + 1; row++) {
    sheet.getCell(`C${row}`).numFmt = '$#,##0';
    sheet.getCell(`D${row}`).numFmt = '$#,##0';
    sheet.getCell(`E${row}`).numFmt = '$#,##0';
  }

  addSheetNote(sheet, 'Enter annual revenue projections. You can use formulas (e.g., =C2+D2 for Total Revenue).');
}

/**
 * Create OPEX Projections Sheet
 */
function createOPEXSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('OPEX Projections');

  // Headers
  const headers = [
    'Month *',
    'Personnel Cost *',
    'Headcount *',
    'Marketing',
    'Sales',
    'Infrastructure',
    'Facilities',
    'Professional Services',
    'Other',
    'Total OPEX *',
    'Cumulative OPEX',
  ];
  sheet.addRow(headers);

  // Style header row
  styleHeaderRow(sheet, 1, headers.length);

  // Sample data with formulas
  const sampleData = [];
  for (let month = 1; month <= 12; month++) {
    const row: (number | { formula: string })[] = [
      month,
      50000 + month * 5000,
      3 + Math.floor(month / 3),
      20000,
      15000,
      10000,
      8000,
      5000,
      2000,
      { formula: `B${month + 1}+D${month + 1}+E${month + 1}+F${month + 1}+G${month + 1}+H${month + 1}+I${month + 1}` },
    ];

    if (month === 1) {
      row.push({ formula: `J2` });
    } else {
      row.push({ formula: `K${month}+J${month + 1}` });
    }

    sampleData.push(row);
  }

  sampleData.forEach((row) => {
    sheet.addRow(row);
  });

  // Column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.getColumn(i).width = 18;
  }

  // Number formatting
  for (let row = 2; row <= sampleData.length + 1; row++) {
    for (let col = 2; col <= headers.length; col++) {
      if (col !== 3) {
        // Skip headcount
        const cell = sheet.getCell(row, col);
        cell.numFmt = '$#,##0';
      }
    }
  }

  addSheetNote(
    sheet,
    'Enter monthly OPEX projections. Month 1 = first month of operations. You can use formulas for totals.'
  );
}

/**
 * Create Personnel Sheet
 */
function createPersonnelSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Personnel');

  // Headers
  const headers = ['Role Name *', 'Base Salary *', 'Start Month *', 'End Month', 'Department'];
  sheet.addRow(headers);

  // Style header row
  styleHeaderRow(sheet, 1, headers.length);

  // Sample data
  const sampleData = [
    ['CEO', 200000, 1, '', 'Executive'],
    ['CTO', 180000, 1, '', 'Engineering'],
    ['VP Engineering', 160000, 3, '', 'Engineering'],
    ['Senior Engineer', 140000, 6, '', 'Engineering'],
    ['Engineer', 120000, 9, '', 'Engineering'],
    ['VP Sales', 150000, 3, '', 'Sales'],
    ['Sales Rep', 100000, 6, '', 'Sales'],
    ['Marketing Manager', 110000, 6, '', 'Marketing'],
    ['Customer Success Manager', 90000, 9, '', 'Customer Success'],
    ['Operations Manager', 100000, 12, '', 'Operations'],
  ];

  sampleData.forEach((row) => {
    sheet.addRow(row);
  });

  // Column widths
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 15;
  sheet.getColumn(3).width = 15;
  sheet.getColumn(4).width = 15;
  sheet.getColumn(5).width = 25;

  // Number formatting
  for (let row = 2; row <= sampleData.length + 1; row++) {
    sheet.getCell(`B${row}`).numFmt = '$#,##0';
  }

  addSheetNote(
    sheet,
    'List all personnel roles. Leave End Month blank if the role continues indefinitely.'
  );
}

/**
 * Create Funding Rounds Sheet
 */
function createFundingSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet('Funding Rounds');

  // Headers
  const headers = [
    'Round Name *',
    'Amount Raised *',
    'Pre-Money Valuation',
    'Post-Money Valuation *',
    'Price per Share',
    'Shares Issued',
    'Investor Ownership %',
    'Close Date *',
  ];
  sheet.addRow(headers);

  // Style header row
  styleHeaderRow(sheet, 1, headers.length);

  // Sample data
  const currentYear = new Date().getFullYear();
  const sampleData = [
    ['Seed', 1000000, 4000000, { formula: 'B2+C2' }, 0.5, 2000000, 20, `${currentYear}-01-15`],
    ['Series A', 5000000, 15000000, { formula: 'B3+C3' }, 2.0, 2500000, 25, `${currentYear + 1}-06-01`],
    ['Series B', 15000000, 45000000, { formula: 'B4+C4' }, 6.0, 2500000, 25, `${currentYear + 2}-09-15`],
  ];

  sampleData.forEach((row) => {
    sheet.addRow(row);
  });

  // Column widths
  for (let i = 1; i <= headers.length; i++) {
    sheet.getColumn(i).width = 20;
  }

  // Number formatting
  for (let row = 2; row <= sampleData.length + 1; row++) {
    sheet.getCell(`B${row}`).numFmt = '$#,##0';
    sheet.getCell(`C${row}`).numFmt = '$#,##0';
    sheet.getCell(`D${row}`).numFmt = '$#,##0';
    sheet.getCell(`E${row}`).numFmt = '$0.00';
    sheet.getCell(`G${row}`).numFmt = '0.0%';
  }

  addSheetNote(
    sheet,
    'Enter funding rounds. Post-Money Valuation should equal Pre-Money + Amount Raised.'
  );
}

// ============================================================================
// Styling Helpers
// ============================================================================

/**
 * Style header row
 */
function styleHeaderRow(sheet: ExcelJS.Worksheet, rowNumber: number, columnCount: number): void {
  const row = sheet.getRow(rowNumber);
  row.height = 20;

  for (let i = 1; i <= columnCount; i++) {
    const cell = row.getCell(i);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F4788' },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      top: { style: 'thin' },
      bottom: { style: 'thin' },
      left: { style: 'thin' },
      right: { style: 'thin' },
    };
  }
}

/**
 * Add a note at the top of the sheet
 */
function addSheetNote(sheet: ExcelJS.Worksheet, note: string): void {
  const lastRow = sheet.lastRow;
  if (lastRow) {
    const noteRow = lastRow.number + 2;
    sheet.mergeCells(`A${noteRow}:F${noteRow}`);
    const noteCell = sheet.getCell(`A${noteRow}`);
    noteCell.value = `Note: ${note}`;
    noteCell.font = { italic: true, color: { argb: 'FF666666' } };
    noteCell.alignment = { horizontal: 'left', vertical: 'middle', wrapText: true };
    sheet.getRow(noteRow).height = 30;
  }
}

// ============================================================================
// Download Helper
// ============================================================================

/**
 * Generate and download template
 * @param filename - Name for the downloaded file
 */
export async function downloadTemplate(filename: string = 'Financial_Model_Template.xlsx'): Promise<void> {
  const workbook = await generateImportTemplate();
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  // Create download link
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();

  // Cleanup
  URL.revokeObjectURL(url);
}

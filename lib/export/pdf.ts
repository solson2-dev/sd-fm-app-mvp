import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IncomeStatement, CashFlowStatement, BalanceSheet } from '@/lib/calculations/financials';
import type { CapTableEntry } from '@/lib/calculations/equity';
import { formatCurrency, formatPercent } from '@/lib/utils/format';
import type { FundingRoundExportData } from '@/lib/types/database';

export interface PDFExportOptions {
  companyName?: string;
  scenarioName?: string;
  date?: string;
}

export function exportFinancialsPDF(
  incomeStatements: IncomeStatement[],
  cashFlows: CashFlowStatement[],
  balanceSheets: BalanceSheet[],
  options: PDFExportOptions = {}
) {
  const doc = new jsPDF();
  const { companyName = 'Studio Datum', scenarioName = 'Base Case', date = new Date().toLocaleDateString() } = options;

  // Header
  doc.setFontSize(20);
  doc.text('Financial Statements', 14, 20);
  doc.setFontSize(12);
  doc.text(companyName, 14, 28);
  doc.setFontSize(10);
  doc.text(`Scenario: ${scenarioName}`, 14, 35);
  doc.text(`Generated: ${date}`, 14, 42);

  let yPos = 50;

  // Income Statement
  doc.setFontSize(14);
  doc.text('Income Statement', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Year', 'Revenue', 'COGS', 'Gross Profit', 'OPEX', 'EBITDA', 'Net Income', 'Margin %']],
    body: incomeStatements.map((is) => [
      `Year ${is.year}`,
      formatCurrency(is.revenue),
      formatCurrency(is.cogs),
      formatCurrency(is.grossProfit),
      formatCurrency(is.opex),
      formatCurrency(is.ebitda),
      formatCurrency(is.netIncome),
      formatPercent(is.netMargin, { decimals: 1 }),
    ]),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [139, 92, 246] },
  });

  // Cash Flow Statement (new page)
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.text('Cash Flow Statement', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Year', 'Operating CF', 'Investing CF', 'Financing CF', 'Net CF', 'Cash Balance']],
    body: cashFlows.map((cf) => [
      `Year ${cf.year}`,
      formatCurrency(cf.operatingCashFlow),
      formatCurrency(cf.investingCashFlow),
      formatCurrency(cf.financingCashFlow),
      formatCurrency(cf.netCashFlow),
      formatCurrency(cf.cashBalance),
    ]),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [16, 185, 129] },
  });

  // Balance Sheet
  doc.addPage();
  yPos = 20;
  doc.setFontSize(14);
  doc.text('Balance Sheet', 14, yPos);
  yPos += 5;

  autoTable(doc, {
    startY: yPos,
    head: [['Year', 'Cash', 'A/R', 'Total Assets', 'A/P', 'Liabilities', 'Equity']],
    body: balanceSheets.map((bs) => [
      `Year ${bs.year}`,
      formatCurrency(bs.cash),
      formatCurrency(bs.accountsReceivable),
      formatCurrency(bs.totalAssets),
      formatCurrency(bs.accountsPayable),
      formatCurrency(bs.totalLiabilities),
      formatCurrency(bs.equity),
    ]),
    theme: 'grid',
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] },
  });

  // Footer on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  return doc;
}

export function exportCapTablePDF(
  capTable: CapTableEntry[],
  fundingRounds: FundingRoundExportData[],
  options: PDFExportOptions = {}
) {
  const doc = new jsPDF();
  const { companyName = 'Studio Datum', scenarioName = 'Base Case', date = new Date().toLocaleDateString() } = options;

  // Header
  doc.setFontSize(20);
  doc.text('Capitalization Table', 14, 20);
  doc.setFontSize(12);
  doc.text(companyName, 14, 28);
  doc.setFontSize(10);
  doc.text(`Scenario: ${scenarioName}`, 14, 35);
  doc.text(`Generated: ${date}`, 14, 42);

  // Cap Table
  autoTable(doc, {
    startY: 50,
    head: [['Stakeholder', 'Type', 'Shares', 'Ownership %', 'Round']],
    body: capTable.map((entry) => [
      entry.stakeholder,
      entry.type,
      entry.shares.toLocaleString(),
      formatPercent(entry.ownership, { decimals: 2 }),
      entry.roundName || '—',
    ]),
    theme: 'grid',
    styles: { fontSize: 9 },
    headStyles: { fillColor: [139, 92, 246] },
  });

  // Funding Rounds
  if (fundingRounds.length > 0) {
    doc.addPage();
    doc.setFontSize(14);
    doc.text('Funding Rounds', 14, 20);

    autoTable(doc, {
      startY: 25,
      head: [['Round', 'Amount', 'Pre-Money', 'Post-Money', 'Price/Share', 'Shares Issued', 'Investor %']],
      body: fundingRounds.map((round) => [
        round.roundName,
        formatCurrency(round.amount),
        formatCurrency(round.preMoneyValuation),
        formatCurrency(round.postMoneyValuation),
        formatCurrency(round.pricePerShare, { showCents: true }),
        round.sharesIssued.toLocaleString(),
        formatPercent(round.investorOwnership, { decimals: 2 }),
      ]),
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [16, 185, 129] },
    });
  }

  return doc;
}

export function downloadPDF(doc: jsPDF, filename: string) {
  doc.save(filename);
}

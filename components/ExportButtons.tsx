'use client';

import { useState } from 'react';
import type { IncomeStatement, CashFlowStatement, BalanceSheet } from '@/lib/calculations/financials';
import type { CapTableEntry } from '@/lib/calculations/equity';
import type { RevenueMetrics } from '@/lib/calculations/revenue';
import { exportFinancialsPDF, exportCapTablePDF, downloadPDF } from '@/lib/export/pdf';
import { exportFinancialsToExcel, exportCapTableToExcel, downloadExcel } from '@/lib/export/excel';

interface FinancialsExportProps {
  incomeStatements: IncomeStatement[];
  cashFlows: CashFlowStatement[];
  balanceSheets: BalanceSheet[];
  revenueProjections?: RevenueMetrics[];
  companyName?: string;
  scenarioName?: string;
}

interface CapTableExportProps {
  capTable: CapTableEntry[];
  fundingRounds?: any[];
  companyName?: string;
  scenarioName?: string;
}

export function FinancialsExportButtons({
  incomeStatements,
  cashFlows,
  balanceSheets,
  revenueProjections = [],
  companyName = 'Studio Datum',
  scenarioName = 'Base Case',
}: FinancialsExportProps) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const handleExportPDF = () => {
    setExporting('pdf');
    try {
      const doc = exportFinancialsPDF(incomeStatements, cashFlows, balanceSheets, {
        companyName,
        scenarioName,
      });
      downloadPDF(doc, `${companyName}_Financial_Statements_${scenarioName}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error exporting PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    setExporting('excel');
    try {
      const wb = exportFinancialsToExcel(
        incomeStatements,
        cashFlows,
        balanceSheets,
        revenueProjections,
        { companyName, scenarioName }
      );
      downloadExcel(wb, `${companyName}_Financial_Statements_${scenarioName}.xlsx`);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Error exporting Excel');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExportPDF}
        disabled={exporting !== null}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
      </button>

      <button
        onClick={handleExportExcel}
        disabled={exporting !== null}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
      </button>
    </div>
  );
}

export function CapTableExportButtons({
  capTable,
  fundingRounds = [],
  companyName = 'Studio Datum',
  scenarioName = 'Base Case',
}: CapTableExportProps) {
  const [exporting, setExporting] = useState<'pdf' | 'excel' | null>(null);

  const handleExportPDF = () => {
    setExporting('pdf');
    try {
      const doc = exportCapTablePDF(capTable, fundingRounds, {
        companyName,
        scenarioName,
      });
      downloadPDF(doc, `${companyName}_Cap_Table_${scenarioName}.pdf`);
    } catch (error) {
      console.error('PDF export error:', error);
      alert('Error exporting PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = () => {
    setExporting('excel');
    try {
      const wb = exportCapTableToExcel(capTable, fundingRounds, { companyName, scenarioName });
      downloadExcel(wb, `${companyName}_Cap_Table_${scenarioName}.xlsx`);
    } catch (error) {
      console.error('Excel export error:', error);
      alert('Error exporting Excel');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="flex gap-3">
      <button
        onClick={handleExportPDF}
        disabled={exporting !== null}
        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
          />
        </svg>
        {exporting === 'pdf' ? 'Exporting...' : 'Export PDF'}
      </button>

      <button
        onClick={handleExportExcel}
        disabled={exporting !== null}
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        {exporting === 'excel' ? 'Exporting...' : 'Export Excel'}
      </button>
    </div>
  );
}

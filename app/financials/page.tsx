'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IncomeStatement,
  CashFlowStatement,
  BalanceSheet,
} from '@/lib/calculations/financials';
import { FinancialStatements } from '@/components/FinancialStatements';
import { formatCurrency, formatPercent } from '@/lib/utils/format';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

export default function FinancialsPage() {
  const [incomeStatements, setIncomeStatements] = useState<IncomeStatement[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlowStatement[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<BalanceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [displayYears, setDisplayYears] = useState<number>(5);

  useEffect(() => {
    loadFinancials();
  }, []);

  async function loadFinancials() {
    try {
      const response = await fetch(
        `/api/financials?scenarioId=${DEFAULT_SCENARIO_ID}&years=10`
      );
      const data = await response.json();

      if (data.incomeStatements) setIncomeStatements(data.incomeStatements);
      if (data.cashFlows) setCashFlows(data.cashFlows);
      if (data.balanceSheets) setBalanceSheets(data.balanceSheets);
    } catch (error) {
      console.error('Error loading financials:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Loading financial statements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Financial Statements</h1>
            <p className="text-gray-600 mt-2">
              Income Statement, Cash Flow, and Balance Sheet projections
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← Back
          </Link>
        </div>

        {/* Display controls */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b">
          <div>
            <label className="font-medium mr-3">Display Years:</label>
            <select
              value={displayYears}
              onChange={(e) => setDisplayYears(Number(e.target.value))}
              className="px-4 py-2 border rounded-lg"
            >
              <option value={3}>3 Years</option>
              <option value={5}>5 Years</option>
              <option value={7}>7 Years</option>
              <option value={10}>10 Years</option>
            </select>
          </div>
        </div>

        {/* Professional Financial Statements */}
        <FinancialStatements
          incomeStatements={incomeStatements.slice(0, displayYears)}
          cashFlows={cashFlows.slice(0, displayYears)}
          balanceSheets={balanceSheets.slice(0, displayYears)}
        />

        {/* Key Metrics Summary */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">Year 5 Metrics</h3>
            {incomeStatements[4] && (
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• Revenue: {formatCurrency(incomeStatements[4].revenue)}</li>
                <li>• EBITDA: {formatCurrency(incomeStatements[4].ebitda)}</li>
                <li>• Net Income: {formatCurrency(incomeStatements[4].netIncome)}</li>
                <li>• Net Margin: {formatPercent(incomeStatements[4].netMargin)}</li>
              </ul>
            )}
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-green-800">Year 10 Metrics</h3>
            {incomeStatements[9] && (
              <ul className="text-sm text-green-700 space-y-1">
                <li>• Revenue: {formatCurrency(incomeStatements[9].revenue)}</li>
                <li>• EBITDA: {formatCurrency(incomeStatements[9].ebitda)}</li>
                <li>• Net Income: {formatCurrency(incomeStatements[9].netIncome)}</li>
                <li>• Net Margin: {formatPercent(incomeStatements[9].netMargin)}</li>
              </ul>
            )}
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-2 text-purple-800">Cash Position</h3>
            {cashFlows[9] && (
              <ul className="text-sm text-purple-700 space-y-1">
                <li>• Year 5: {formatCurrency(cashFlows[4]?.cashBalance || 0)}</li>
                <li>• Year 10: {formatCurrency(cashFlows[9].cashBalance)}</li>
                <li>
                  • Cumulative CF:{' '}
                  {formatCurrency(
                    cashFlows.reduce((sum, cf) => sum + cf.netCashFlow, 0)
                  )}
                </li>
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

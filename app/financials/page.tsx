'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  IncomeStatement,
  CashFlowStatement,
  BalanceSheet,
} from '@/lib/calculations/financials';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

export default function FinancialsPage() {
  const [incomeStatements, setIncomeStatements] = useState<IncomeStatement[]>([]);
  const [cashFlows, setCashFlows] = useState<CashFlowStatement[]>([]);
  const [balanceSheets, setBalanceSheets] = useState<BalanceSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'income' | 'cashflow' | 'balance'>('income');

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

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatPercent(value: number): string {
    return `${(value * 100).toFixed(1)}%`;
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

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b">
          <button
            onClick={() => setActiveTab('income')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'income'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Income Statement
          </button>
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'cashflow'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'balance'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            Balance Sheet
          </button>
        </div>

        {/* Income Statement */}
        {activeTab === 'income' && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Year</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Revenue</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">COGS</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Gross Profit</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">OPEX</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">EBITDA</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Net Income</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Net Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {incomeStatements.map((is) => (
                    <tr key={is.year} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">Year {is.year}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(is.revenue)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(is.cogs)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(is.grossProfit)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(is.opex)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(is.ebitda)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-semibold">
                        {formatCurrency(is.netIncome)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatPercent(is.netMargin)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cash Flow Statement */}
        {activeTab === 'cashflow' && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Year</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Operating CF</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">CapEx</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Investing CF</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Equity</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Financing CF</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Net CF</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Cash Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cashFlows.map((cf) => (
                    <tr key={cf.year} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">Year {cf.year}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(cf.operatingCashFlow)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono text-red-600">
                        {formatCurrency(cf.capex)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(cf.investingCashFlow)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono text-green-600">
                        {formatCurrency(cf.equityProceeds)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(cf.financingCashFlow)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(cf.netCashFlow)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-semibold">
                        {formatCurrency(cf.cashBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Balance Sheet */}
        {activeTab === 'balance' && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">Year</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Cash</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">A/R</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Total Assets</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">A/P</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Liabilities</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">Equity</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {balanceSheets.map((bs) => (
                    <tr key={bs.year} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">Year {bs.year}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(bs.cash)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(bs.accountsReceivable)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-semibold">
                        {formatCurrency(bs.totalAssets)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(bs.accountsPayable)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(bs.totalLiabilities)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono font-semibold">
                        {formatCurrency(bs.equity)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

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

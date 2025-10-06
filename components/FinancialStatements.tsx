'use client';

import { IncomeStatement, CashFlowStatement, BalanceSheet } from '@/lib/calculations/financials';
import { formatCurrency, formatPercent, getValueColor } from '@/lib/utils/format';

interface FinancialStatementsProps {
  incomeStatements: IncomeStatement[];
  cashFlows: CashFlowStatement[];
  balanceSheets: BalanceSheet[];
  years?: number[];
}

export function FinancialStatements({
  incomeStatements,
  cashFlows,
  balanceSheets,
  years,
}: FinancialStatementsProps) {
  const displayYears = years || incomeStatements.map((is) => is.year);

  return (
    <div className="space-y-8">
      {/* Income Statement */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Income Statement</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-4 font-semibold">Line Item</th>
                {displayYears.map((year) => (
                  <th key={year} className="text-right py-2 px-4 font-semibold">
                    Year {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* Revenue */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-medium">Revenue</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4">
                      {formatCurrency(is?.revenue || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* COGS */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Cost of Goods Sold</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-red-600">
                      ({formatCurrency(is?.cogs || 0)})
                    </td>
                  );
                })}
              </tr>
              {/* Gross Profit */}
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-4 font-semibold">Gross Profit</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 font-semibold">
                      {formatCurrency(is?.grossProfit || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Gross Margin */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8 text-gray-600 italic">Gross Margin %</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-gray-600 italic">
                      {formatPercent(is?.grossMargin || 0, { decimals: 1 })}
                    </td>
                  );
                })}
              </tr>
              {/* OPEX */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Operating Expenses</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-red-600">
                      ({formatCurrency(is?.opex || 0)})
                    </td>
                  );
                })}
              </tr>
              {/* EBITDA */}
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-4 font-semibold">EBITDA</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className={`text-right py-2 px-4 font-semibold ${getValueColor(is?.ebitda || 0)}`}>
                      {formatCurrency(is?.ebitda || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* EBITDA Margin */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8 text-gray-600 italic">EBITDA Margin %</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-gray-600 italic">
                      {formatPercent(is?.ebitdaMargin || 0, { decimals: 1 })}
                    </td>
                  );
                })}
              </tr>
              {/* Depreciation */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Depreciation</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-red-600">
                      ({formatCurrency(is?.depreciation || 0)})
                    </td>
                  );
                })}
              </tr>
              {/* EBIT */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-medium">EBIT</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className={`text-right py-2 px-4 ${getValueColor(is?.ebit || 0)}`}>
                      {formatCurrency(is?.ebit || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Interest */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Interest Expense</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-red-600">
                      ({formatCurrency(is?.interestExpense || 0)})
                    </td>
                  );
                })}
              </tr>
              {/* EBT */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-medium">EBT</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className={`text-right py-2 px-4 ${getValueColor(is?.ebt || 0)}`}>
                      {formatCurrency(is?.ebt || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Taxes */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Taxes</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-red-600">
                      ({formatCurrency(is?.taxes || 0)})
                    </td>
                  );
                })}
              </tr>
              {/* Net Income */}
              <tr className="border-b-2 border-gray-900 bg-gray-100">
                <td className="py-3 px-4 font-bold">Net Income</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className={`text-right py-3 px-4 font-bold ${getValueColor(is?.netIncome || 0)}`}>
                      {formatCurrency(is?.netIncome || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Net Margin */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8 text-gray-600 italic">Net Margin %</td>
                {displayYears.map((year) => {
                  const is = incomeStatements.find((i) => i.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-gray-600 italic">
                      {formatPercent(is?.netMargin || 0, { decimals: 1 })}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Cash Flow Statement */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Cash Flow Statement</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-4 font-semibold">Line Item</th>
                {displayYears.map((year) => (
                  <th key={year} className="text-right py-2 px-4 font-semibold">
                    Year {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* Operating Activities */}
              <tr className="bg-gray-50">
                <td colSpan={displayYears.length + 1} className="py-2 px-4 font-semibold text-gray-700">
                  Operating Activities
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Net Income</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className={`text-right py-2 px-4 ${getValueColor(cf?.netIncome || 0)}`}>
                      {formatCurrency(cf?.netIncome || 0)}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Depreciation</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4">
                      {formatCurrency(cf?.depreciation || 0)}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-4 font-semibold">Operating Cash Flow</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className={`text-right py-2 px-4 font-semibold ${getValueColor(cf?.operatingCashFlow || 0)}`}>
                      {formatCurrency(cf?.operatingCashFlow || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Investing Activities */}
              <tr className="bg-gray-50">
                <td colSpan={displayYears.length + 1} className="py-2 px-4 font-semibold text-gray-700">
                  Investing Activities
                </td>
              </tr>
              <tr className="border-b-2 border-gray-300">
                <td className="py-2 px-4 pl-8">CapEx</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-red-600">
                      {formatCurrency(cf?.capex || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Financing Activities */}
              <tr className="bg-gray-50">
                <td colSpan={displayYears.length + 1} className="py-2 px-4 font-semibold text-gray-700">
                  Financing Activities
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Equity Proceeds</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 text-green-600">
                      {formatCurrency(cf?.equityProceeds || 0)}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-4 font-semibold">Financing Cash Flow</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 font-semibold">
                      {formatCurrency(cf?.financingCashFlow || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Net Cash Flow */}
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 font-bold">Net Cash Flow</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className={`text-right py-2 px-4 font-bold ${getValueColor(cf?.netCashFlow || 0)}`}>
                      {formatCurrency(cf?.netCashFlow || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Cash Balance */}
              <tr className="border-b-2 border-gray-900 bg-gray-100">
                <td className="py-3 px-4 font-bold">Cash Balance (End)</td>
                {displayYears.map((year) => {
                  const cf = cashFlows.find((c) => c.year === year);
                  return (
                    <td key={year} className={`text-right py-3 px-4 font-bold ${getValueColor(cf?.cashBalance || 0)}`}>
                      {formatCurrency(cf?.cashBalance || 0)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Balance Sheet */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Balance Sheet</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-4 font-semibold">Line Item</th>
                {displayYears.map((year) => (
                  <th key={year} className="text-right py-2 px-4 font-semibold">
                    Year {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* Assets */}
              <tr className="bg-gray-50">
                <td colSpan={displayYears.length + 1} className="py-2 px-4 font-semibold text-gray-700">
                  Assets
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Cash</td>
                {displayYears.map((year) => {
                  const bs = balanceSheets.find((b) => b.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4">
                      {formatCurrency(bs?.cash || 0)}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Accounts Receivable</td>
                {displayYears.map((year) => {
                  const bs = balanceSheets.find((b) => b.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4">
                      {formatCurrency(bs?.accountsReceivable || 0)}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-4 font-semibold">Total Assets</td>
                {displayYears.map((year) => {
                  const bs = balanceSheets.find((b) => b.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 font-semibold">
                      {formatCurrency(bs?.totalAssets || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Liabilities */}
              <tr className="bg-gray-50">
                <td colSpan={displayYears.length + 1} className="py-2 px-4 font-semibold text-gray-700">
                  Liabilities
                </td>
              </tr>
              <tr className="border-b border-gray-200">
                <td className="py-2 px-4 pl-8">Accounts Payable</td>
                {displayYears.map((year) => {
                  const bs = balanceSheets.find((b) => b.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4">
                      {formatCurrency(bs?.accountsPayable || 0)}
                    </td>
                  );
                })}
              </tr>
              <tr className="border-b-2 border-gray-300 bg-gray-50">
                <td className="py-2 px-4 font-semibold">Total Liabilities</td>
                {displayYears.map((year) => {
                  const bs = balanceSheets.find((b) => b.year === year);
                  return (
                    <td key={year} className="text-right py-2 px-4 font-semibold">
                      {formatCurrency(bs?.totalLiabilities || 0)}
                    </td>
                  );
                })}
              </tr>
              {/* Equity */}
              <tr className="border-b-2 border-gray-900 bg-gray-100">
                <td className="py-3 px-4 font-bold">Shareholders' Equity</td>
                {displayYears.map((year) => {
                  const bs = balanceSheets.find((b) => b.year === year);
                  return (
                    <td key={year} className={`text-right py-3 px-4 font-bold ${getValueColor(bs?.equity || 0)}`}>
                      {formatCurrency(bs?.equity || 0)}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

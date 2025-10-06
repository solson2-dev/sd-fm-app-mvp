'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

interface RoundReturn {
  roundName: string;
  investment: number;
  equityOwnership: number;
  equityValue: number;
  roi: number;
  roiPercent: number;
  cagr: number;
}

interface ExitScenario {
  arrMultiple: number;
  ebitdaMultiple: number;
  exitValuation: number;
  roundReturns: RoundReturn[];
}

export default function ExitScenariosPage() {
  const [exitYear, setExitYear] = useState(5);
  const [arr, setArr] = useState(0);
  const [ebitda, setEbitda] = useState(0);
  const [scenarios, setScenarios] = useState<ExitScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExitScenarios();
  }, [exitYear]);

  async function loadExitScenarios() {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/exit-scenarios?scenarioId=${DEFAULT_SCENARIO_ID}&exitYear=${exitYear}`
      );
      const data = await response.json();

      if (data.arr) setArr(data.arr);
      if (data.ebitda) setEbitda(data.ebitda);
      if (data.scenarios) setScenarios(data.scenarios);
    } catch (error) {
      console.error('Error loading exit scenarios:', error);
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

  function formatMultiple(value: number): string {
    return `${value.toFixed(1)}x`;
  }

  function formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>

          <div className="mb-6 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded animate-pulse">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24 mb-2" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded" />
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded animate-pulse">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/2 mb-2" />
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-3/4" />
              </div>
            ))}
          </div>

          <div className="space-y-8">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded overflow-hidden animate-pulse">
                <div className="p-4 bg-gray-50 dark:bg-gray-800">
                  <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                </div>
                <div className="p-6">
                  {Array.from({ length: 3 }).map((_, j) => (
                    <div key={j} className="h-12 bg-gray-200 dark:bg-gray-800 rounded mb-2" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Exit Scenarios</h1>
            <p className="text-gray-600 mt-2">
              Valuation multiples and investor returns
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 rounded hover:border-gray-900"
          >
            ← Back
          </Link>
        </div>

        {/* Exit Year Selector */}
        <div className="mb-6 p-6 bg-white border border-gray-300 rounded">
          <label className="block text-sm font-medium text-black mb-2">
            Exit Year
          </label>
          <div className="flex gap-2">
            {[3, 5, 7, 10].map((year) => (
              <button
                key={year}
                onClick={() => setExitYear(year)}
                className={`px-4 py-2 rounded border transition-colors ${
                  exitYear === year
                    ? 'bg-black text-white border-black'
                    : 'bg-white text-black border-gray-300 hover:border-gray-900'
                }`}
              >
                Year {year}
              </button>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-6 bg-white border border-gray-300 rounded">
            <div className="text-sm text-gray-600 font-medium">
              Year {exitYear} ARR
            </div>
            <div className="text-3xl font-bold text-black mt-2">
              {formatCurrency(arr)}
            </div>
          </div>
          <div className="p-6 bg-white border border-gray-300 rounded">
            <div className="text-sm text-gray-600 font-medium">
              Year {exitYear} EBITDA
            </div>
            <div className="text-3xl font-bold text-black mt-2">
              {formatCurrency(ebitda)}
            </div>
          </div>
        </div>

        {/* Exit Scenarios Table */}
        {scenarios.length === 0 ? (
          <div className="p-12 text-center text-gray-500 bg-white border border-gray-300 rounded">
            No exit scenarios available. Ensure revenue projections and funding
            rounds are configured.
          </div>
        ) : (
          scenarios.map((scenario, idx) => (
            <div key={idx} className="mb-8">
              <div className="bg-gray-50 border border-gray-300 rounded-t p-4">
                <h3 className="text-lg font-semibold text-black">
                  Scenario {idx + 1}: {formatMultiple(scenario.arrMultiple)} ARR
                  Multiple, {formatMultiple(scenario.ebitdaMultiple)} EBITDA
                  Multiple
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  Exit Valuation: {formatCurrency(scenario.exitValuation)}
                </p>
              </div>

              <div className="bg-white border border-gray-300 border-t-0 rounded-b overflow-hidden">
                {scenario.roundReturns.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    No funding rounds to analyze
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-300">
                        <tr>
                          <th className="px-6 py-3 text-left text-sm font-semibold text-black">
                            Round
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                            Investment
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                            Equity %
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                            Exit Value
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                            ROI
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                            ROI %
                          </th>
                          <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                            CAGR
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {scenario.roundReturns.map((roundReturn, rIdx) => (
                          <tr key={rIdx} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm font-medium text-black">
                              {roundReturn.roundName}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-black">
                              {formatCurrency(roundReturn.investment)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-black">
                              {formatPercent(roundReturn.equityOwnership * 100)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-black">
                              {formatCurrency(roundReturn.equityValue)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-black">
                              {formatMultiple(roundReturn.roi)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-black">
                              {formatPercent(roundReturn.roiPercent)}
                            </td>
                            <td className="px-6 py-4 text-sm text-right font-mono text-black">
                              {formatPercent(roundReturn.cagr)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {/* Explanation */}
        <div className="mt-8 p-6 bg-white border border-gray-300 rounded">
          <h3 className="text-lg font-semibold text-black mb-2">
            How Exit Scenarios Work
          </h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              • <strong>ARR Multiple</strong>: Exit valuation = ARR × Multiple
              (typical SaaS: 5-15x)
            </li>
            <li>
              • <strong>EBITDA Multiple</strong>: Exit valuation = EBITDA ×
              Multiple (typical: 10-20x)
            </li>
            <li>
              • <strong>Exit Valuation</strong>: Average of ARR and EBITDA
              valuations
            </li>
            <li>
              • <strong>ROI</strong>: Return on Investment = Exit Value /
              Investment Amount
            </li>
            <li>
              • <strong>CAGR</strong>: Compound Annual Growth Rate over holding
              period
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

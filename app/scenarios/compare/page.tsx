'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_ORG_ID = 'a0000000-0000-0000-0000-000000000001';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
}

interface ScenarioMetrics {
  scenarioId: string;
  scenarioName: string;
  revenue: {
    year5ARR: number;
    year10ARR: number;
    year5Customers: number;
    year10Customers: number;
  };
  opex: {
    year1Total: number;
    year3Total: number;
    totalHeadcount: number;
  };
}

export default function CompareScenarios() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [metrics, setMetrics] = useState<ScenarioMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [comparing, setComparing] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  async function loadScenarios() {
    try {
      const response = await fetch(
        `/api/scenarios?organizationId=${DEFAULT_ORG_ID}`
      );
      const data = await response.json();

      if (data.scenarios) {
        setScenarios(data.scenarios);
        // Auto-select first two scenarios
        if (data.scenarios.length >= 2) {
          setSelectedScenarios([
            data.scenarios[0].id,
            data.scenarios[1].id,
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  }

  async function compareScenarios() {
    if (selectedScenarios.length === 0) return;

    setComparing(true);
    try {
      const metricsData: ScenarioMetrics[] = [];

      for (const scenarioId of selectedScenarios) {
        const scenario = scenarios.find((s) => s.id === scenarioId);
        if (!scenario) continue;

        // Fetch revenue metrics
        const revenueResponse = await fetch(
          `/api/revenue/summary?scenarioId=${scenarioId}&years=10`
        );
        const revenueData = await revenueResponse.json();

        // Fetch OPEX metrics
        const opexResponse = await fetch(
          `/api/opex/summary?scenarioId=${scenarioId}`
        );
        const opexData = await opexResponse.json();

        metricsData.push({
          scenarioId,
          scenarioName: scenario.name,
          revenue: {
            year5ARR: revenueData.summary?.year5?.arr || 0,
            year10ARR: revenueData.summary?.year10?.arr || 0,
            year5Customers: revenueData.summary?.year5?.customers || 0,
            year10Customers: revenueData.summary?.year10?.customers || 0,
          },
          opex: {
            year1Total: opexData.summary?.year1Total || 0,
            year3Total: opexData.summary?.year3Total || 0,
            totalHeadcount: opexData.summary?.totalHeadcount || 0,
          },
        });
      }

      setMetrics(metricsData);
    } catch (error) {
      console.error('Error comparing scenarios:', error);
    } finally {
      setComparing(false);
    }
  }

  useEffect(() => {
    if (selectedScenarios.length > 0) {
      compareScenarios();
    }
  }, [selectedScenarios]);

  function toggleScenario(scenarioId: string) {
    if (selectedScenarios.includes(scenarioId)) {
      setSelectedScenarios(selectedScenarios.filter((id) => id !== scenarioId));
    } else {
      setSelectedScenarios([...selectedScenarios, scenarioId]);
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

  function calculateVariance(base: number, compare: number): string {
    if (base === 0) return 'N/A';
    const variance = ((compare - base) / base) * 100;
    const sign = variance > 0 ? '+' : '';
    return `${sign}${variance.toFixed(1)}%`;
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Compare Scenarios</h1>
            <p className="text-gray-600 mt-2">
              Side-by-side comparison of financial projections
            </p>
          </div>
          <Link
            href="/scenarios"
            className="px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            ← Back to Scenarios
          </Link>
        </div>

        {/* Scenario Selector */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold mb-4">
            Select Scenarios to Compare
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {scenarios.map((scenario) => (
              <button
                key={scenario.id}
                onClick={() => toggleScenario(scenario.id)}
                className={`px-4 py-2 rounded border transition-colors ${
                  selectedScenarios.includes(scenario.id)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white hover:bg-gray-50'
                }`}
              >
                {scenario.name}
              </button>
            ))}
          </div>
        </div>

        {/* Comparison Table */}
        {comparing && (
          <div className="text-center py-8">
            <div className="text-xl">Loading metrics...</div>
          </div>
        )}

        {!comparing && metrics.length > 0 && (
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Metric
                    </th>
                    {metrics.map((m) => (
                      <th
                        key={m.scenarioId}
                        className="px-6 py-3 text-right text-sm font-semibold"
                      >
                        {m.scenarioName}
                      </th>
                    ))}
                    {metrics.length >= 2 && (
                      <th className="px-6 py-3 text-right text-sm font-semibold bg-blue-50">
                        Variance
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {/* Revenue Metrics */}
                  <tr className="bg-gray-50">
                    <td
                      colSpan={metrics.length + (metrics.length >= 2 ? 2 : 1)}
                      className="px-6 py-2 text-sm font-semibold"
                    >
                      Revenue Metrics
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Year 5 ARR</td>
                    {metrics.map((m) => (
                      <td
                        key={m.scenarioId}
                        className="px-6 py-4 text-sm text-right font-mono"
                      >
                        {formatCurrency(m.revenue.year5ARR)}
                      </td>
                    ))}
                    {metrics.length >= 2 && (
                      <td className="px-6 py-4 text-sm text-right font-mono bg-blue-50">
                        {calculateVariance(
                          metrics[0].revenue.year5ARR,
                          metrics[1].revenue.year5ARR
                        )}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Year 10 ARR</td>
                    {metrics.map((m) => (
                      <td
                        key={m.scenarioId}
                        className="px-6 py-4 text-sm text-right font-mono"
                      >
                        {formatCurrency(m.revenue.year10ARR)}
                      </td>
                    ))}
                    {metrics.length >= 2 && (
                      <td className="px-6 py-4 text-sm text-right font-mono bg-blue-50">
                        {calculateVariance(
                          metrics[0].revenue.year10ARR,
                          metrics[1].revenue.year10ARR
                        )}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Year 5 Customers</td>
                    {metrics.map((m) => (
                      <td
                        key={m.scenarioId}
                        className="px-6 py-4 text-sm text-right font-mono"
                      >
                        {m.revenue.year5Customers.toLocaleString()}
                      </td>
                    ))}
                    {metrics.length >= 2 && (
                      <td className="px-6 py-4 text-sm text-right font-mono bg-blue-50">
                        {calculateVariance(
                          metrics[0].revenue.year5Customers,
                          metrics[1].revenue.year5Customers
                        )}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Year 10 Customers</td>
                    {metrics.map((m) => (
                      <td
                        key={m.scenarioId}
                        className="px-6 py-4 text-sm text-right font-mono"
                      >
                        {m.revenue.year10Customers.toLocaleString()}
                      </td>
                    ))}
                    {metrics.length >= 2 && (
                      <td className="px-6 py-4 text-sm text-right font-mono bg-blue-50">
                        {calculateVariance(
                          metrics[0].revenue.year10Customers,
                          metrics[1].revenue.year10Customers
                        )}
                      </td>
                    )}
                  </tr>

                  {/* OPEX Metrics */}
                  <tr className="bg-gray-50">
                    <td
                      colSpan={metrics.length + (metrics.length >= 2 ? 2 : 1)}
                      className="px-6 py-2 text-sm font-semibold"
                    >
                      OPEX Metrics
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Year 1 Total OPEX</td>
                    {metrics.map((m) => (
                      <td
                        key={m.scenarioId}
                        className="px-6 py-4 text-sm text-right font-mono"
                      >
                        {formatCurrency(m.opex.year1Total)}
                      </td>
                    ))}
                    {metrics.length >= 2 && (
                      <td className="px-6 py-4 text-sm text-right font-mono bg-blue-50">
                        {calculateVariance(
                          metrics[0].opex.year1Total,
                          metrics[1].opex.year1Total
                        )}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Year 3 Total OPEX</td>
                    {metrics.map((m) => (
                      <td
                        key={m.scenarioId}
                        className="px-6 py-4 text-sm text-right font-mono"
                      >
                        {formatCurrency(m.opex.year3Total)}
                      </td>
                    ))}
                    {metrics.length >= 2 && (
                      <td className="px-6 py-4 text-sm text-right font-mono bg-blue-50">
                        {calculateVariance(
                          metrics[0].opex.year3Total,
                          metrics[1].opex.year3Total
                        )}
                      </td>
                    )}
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm">Total Headcount</td>
                    {metrics.map((m) => (
                      <td
                        key={m.scenarioId}
                        className="px-6 py-4 text-sm text-right font-mono"
                      >
                        {m.opex.totalHeadcount}
                      </td>
                    ))}
                    {metrics.length >= 2 && (
                      <td className="px-6 py-4 text-sm text-right font-mono bg-blue-50">
                        {calculateVariance(
                          metrics[0].opex.totalHeadcount,
                          metrics[1].opex.totalHeadcount
                        )}
                      </td>
                    )}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!comparing && metrics.length === 0 && selectedScenarios.length > 0 && (
          <div className="text-center py-12 text-gray-500">
            No data available for selected scenarios.
          </div>
        )}
      </div>
    </div>
  );
}

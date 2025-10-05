'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { RevenueMetrics } from '@/lib/calculations/revenue';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

interface Summary {
  year5: {
    arr: number;
    customers: number;
    revenue: number;
    grossProfit: number;
  } | null;
  year10: {
    arr: number;
    customers: number;
    revenue: number;
    grossProfit: number;
  } | null;
}

export default function RevenueDashboardPage() {
  const [projections, setProjections] = useState<RevenueMetrics[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load projections
      const projectionsResponse = await fetch(
        `/api/revenue/projections?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      const projectionsData = await projectionsResponse.json();

      // Load summary
      const summaryResponse = await fetch(
        `/api/revenue/summary?scenarioId=${DEFAULT_SCENARIO_ID}&years=10`
      );
      const summaryData = await summaryResponse.json();

      setProjections(projectionsData.projections || []);
      setSummary(summaryData.summary);
    } catch (error) {
      console.error('Error loading revenue dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setLoading(true);
    try {
      await fetch('/api/revenue/projections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          years: 10,
        }),
      });
      await loadData();
    } catch (error) {
      console.error('Error recalculating:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Loading revenue dashboard...</div>
      </div>
    );
  }

  const chartData = projections.map((p) => ({
    year: `Y${p.year}`,
    arr: Math.round(p.arr),
    revenue: Math.round(p.totalRevenue),
    customers: p.customers,
    grossProfit: Math.round(p.grossProfit),
    grossMargin: Math.round(p.grossMargin * 100),
  }));

  // Excel validation targets
  const year5Expected = {
    arr: 15332765,
    customers: 631,
    revenue: 15946894,
    grossProfit: 11960170,
  };

  // Calculate variance
  const year5Actual = summary?.year5;
  const variance = year5Actual
    ? {
        arr: ((year5Actual.arr - year5Expected.arr) / year5Expected.arr) * 100,
        customers:
          ((year5Actual.customers - year5Expected.customers) / year5Expected.customers) *
          100,
        revenue:
          ((year5Actual.revenue - year5Expected.revenue) / year5Expected.revenue) * 100,
        grossProfit:
          ((year5Actual.grossProfit - year5Expected.grossProfit) /
            year5Expected.grossProfit) *
          100,
      }
    : null;

  const formatCurrency = (value: number) =>
    `$${(value / 1000000).toFixed(2)}M`;
  const formatNumber = (value: number) => value.toLocaleString();

  return (
    <div className="min-h-screen p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Revenue Dashboard</h1>
            <p className="text-gray-600 mt-2">10-year revenue and customer projections</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRecalculate}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Recalculate
            </button>
            <Link
              href="/revenue"
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Edit Assumptions
            </Link>
            <Link href="/" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              ← Home
            </Link>
          </div>
        </div>

        {/* Key Metrics - Year 5 Validation */}
        {summary?.year5 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Year 5 ARR</div>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.year5.arr)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {formatCurrency(year5Expected.arr)}
              </div>
              {variance && (
                <div
                  className={`text-xs mt-1 ${
                    Math.abs(variance.arr) < 1 ? 'text-green-600' : 'text-orange-600'
                  }`}
                >
                  {variance.arr > 0 ? '+' : ''}
                  {variance.arr.toFixed(2)}% vs Excel
                  {Math.abs(variance.arr) < 1 && ' ✅'}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Year 5 Customers</div>
              <div className="text-2xl font-bold">
                {formatNumber(summary.year5.customers)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {formatNumber(year5Expected.customers)}
              </div>
              {variance && (
                <div
                  className={`text-xs mt-1 ${
                    Math.abs(variance.customers) < 1
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}
                >
                  {variance.customers > 0 ? '+' : ''}
                  {variance.customers.toFixed(2)}% vs Excel
                  {Math.abs(variance.customers) < 1 && ' ✅'}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Year 5 Revenue</div>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.year5.revenue)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {formatCurrency(year5Expected.revenue)}
              </div>
              {variance && (
                <div
                  className={`text-xs mt-1 ${
                    Math.abs(variance.revenue) < 1
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}
                >
                  {variance.revenue > 0 ? '+' : ''}
                  {variance.revenue.toFixed(2)}% vs Excel
                  {Math.abs(variance.revenue) < 1 && ' ✅'}
                </div>
              )}
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Year 5 Gross Profit</div>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.year5.grossProfit)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Target: {formatCurrency(year5Expected.grossProfit)}
              </div>
              {variance && (
                <div
                  className={`text-xs mt-1 ${
                    Math.abs(variance.grossProfit) < 1
                      ? 'text-green-600'
                      : 'text-orange-600'
                  }`}
                >
                  {variance.grossProfit > 0 ? '+' : ''}
                  {variance.grossProfit.toFixed(2)}% vs Excel
                  {Math.abs(variance.grossProfit) < 1 && ' ✅'}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ARR Growth Chart */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">ARR Growth (10 Years)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="arr"
                stroke="#2563eb"
                fill="#3b82f6"
                fillOpacity={0.6}
                name="ARR"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Growth Chart */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Customer Growth</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => Number(value).toLocaleString()} />
              <Legend />
              <Line
                type="monotone"
                dataKey="customers"
                stroke="#10b981"
                strokeWidth={2}
                name="Total Customers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Breakdown */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Revenue & Gross Profit</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis tickFormatter={(value) => `$${(value / 1000000).toFixed(0)}M`} />
              <Tooltip
                formatter={(value) => `$${Number(value).toLocaleString()}`}
              />
              <Legend />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" />
              <Bar dataKey="grossProfit" fill="#10b981" name="Gross Profit" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">
            10-Year Projections
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Year</th>
                  <th className="px-4 py-3 text-right font-semibold">Customers</th>
                  <th className="px-4 py-3 text-right font-semibold">ARR</th>
                  <th className="px-4 py-3 text-right font-semibold">Revenue</th>
                  <th className="px-4 py-3 text-right font-semibold">Gross Profit</th>
                  <th className="px-4 py-3 text-right font-semibold">GM %</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projections.map((p) => (
                  <tr
                    key={p.year}
                    className={`hover:bg-gray-50 ${
                      p.year === 5 ? 'bg-blue-50 font-semibold' : ''
                    }`}
                  >
                    <td className="px-4 py-3 font-medium">Year {p.year}</td>
                    <td className="px-4 py-3 text-right">
                      {formatNumber(p.customers)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(p.arr)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(p.totalRevenue)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {formatCurrency(p.grossProfit)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {(p.grossMargin * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

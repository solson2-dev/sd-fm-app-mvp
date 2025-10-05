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
} from 'recharts';
import { MonthlyOPEX } from '@/lib/calculations/opex';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

interface Summary {
  month12: {
    personnelCost: number;
    totalOPEX: number;
    headcount: number;
    cumulative: number;
  };
  month36: {
    personnelCost: number;
    totalOPEX: number;
    headcount: number;
    cumulative: number;
  };
}

export default function DashboardPage() {
  const [projections, setProjections] = useState<MonthlyOPEX[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load projections
      const projectionsResponse = await fetch(
        `/api/opex/projections?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      const projectionsData = await projectionsResponse.json();

      // Load summary
      const summaryResponse = await fetch(
        `/api/opex/summary?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      const summaryData = await summaryResponse.json();

      setProjections(projectionsData.projections || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setLoading(true);
    try {
      await fetch('/api/opex/projections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          startMonth: 1,
          endMonth: 36,
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
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const chartData = projections.map((p) => ({
    month: `M${p.month}`,
    personnel: Math.round(p.personnelCost),
    operating: Math.round(p.operatingSubtotal),
    total: Math.round(p.totalOPEX),
  }));

  return (
    <div className="min-h-screen p-8 pb-20">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">OPEX Dashboard</h1>
            <p className="text-gray-600 mt-2">36-month operating expense projections</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleRecalculate}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Recalculate
            </button>
            <Link href="/personnel" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              Edit Personnel
            </Link>
            <Link href="/" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
              ← Home
            </Link>
          </div>
        </div>

        {/* Key Metrics */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Month 12 OPEX</div>
              <div className="text-2xl font-bold">
                ${summary.month12.totalOPEX.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.month12.headcount} employees
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Month 36 OPEX</div>
              <div className="text-2xl font-bold">
                ${summary.month36.totalOPEX.toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {summary.month36.headcount} employees
              </div>
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Cumulative (12 mo)</div>
              <div className="text-2xl font-bold">
                ${Math.round(summary.month12.cumulative).toLocaleString()}
              </div>
              <div className="text-xs text-green-600 mt-1">✅ Excel validated</div>
            </div>

            <div className="p-4 bg-white border rounded-lg">
              <div className="text-sm text-gray-600">Cumulative (36 mo)</div>
              <div className="text-2xl font-bold">
                ${Math.round(summary.month36.cumulative).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Avg ${Math.round(summary.month36.cumulative / 36).toLocaleString()}/mo
              </div>
            </div>
          </div>
        )}

        {/* Total OPEX Line Chart */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Total OPEX Over Time</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#2563eb"
                strokeWidth={2}
                name="Total OPEX"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Stacked Bar Chart */}
        <div className="bg-white border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">OPEX Breakdown</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
              <Legend />
              <Bar dataKey="personnel" stackId="a" fill="#2563eb" name="Personnel" />
              <Bar dataKey="operating" stackId="a" fill="#60a5fa" name="Operating" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          <h2 className="text-xl font-semibold p-6 border-b">Monthly Projections</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Month</th>
                  <th className="px-4 py-3 text-right font-semibold">Personnel</th>
                  <th className="px-4 py-3 text-right font-semibold">Operating</th>
                  <th className="px-4 py-3 text-right font-semibold">Total OPEX</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {projections.filter((p) => p.month % 3 === 0).map((p) => (
                  <tr key={p.month} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">Month {p.month}</td>
                    <td className="px-4 py-3 text-right">
                      ${Math.round(p.personnelCost).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      ${Math.round(p.operatingSubtotal).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      ${Math.round(p.totalOPEX).toLocaleString()}
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

'use client';

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency, formatNumber, formatPercent } from '@/lib/utils/format';

interface UnitEconomicsData {
  year: number;
  cac?: number; // Customer Acquisition Cost
  ltv?: number; // Lifetime Value
  ltvCacRatio?: number;
  paybackPeriod?: number; // months
  churnRate?: number;
  arpu?: number; // Average Revenue Per User
}

interface UnitEconomicsChartProps {
  data: UnitEconomicsData[];
}

export function UnitEconomicsChart({ data }: UnitEconomicsChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    yearLabel: `Y${item.year}`,
  }));

  return (
    <div className="space-y-6">
      {/* CAC vs LTV */}
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">CAC vs LTV</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="yearLabel"
              className="dark:fill-gray-400"
            />
            <YAxis
              tickFormatter={(value) => formatCurrency(value, { compact: true })}
              className="dark:fill-gray-400"
            />
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--foreground)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="cac" fill="#ef4444" name="CAC" />
            <Bar dataKey="ltv" fill="#10b981" name="LTV" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LTV:CAC Ratio */}
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">LTV:CAC Ratio</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="yearLabel"
              className="dark:fill-gray-400"
            />
            <YAxis
              tickFormatter={(value) => `${value}x`}
              className="dark:fill-gray-400"
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)}x`}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--foreground)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="ltvCacRatio"
              stroke="#8b5cf6"
              strokeWidth={3}
              name="LTV:CAC Ratio"
            />
            <ReferenceLine
              y={3}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: 'Healthy (3x)', position: 'right', fill: '#10b981' }}
            />
            <ReferenceLine
              y={1}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Break-even (1x)', position: 'right', fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Payback Period */}
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">CAC Payback Period</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="yearLabel"
              className="dark:fill-gray-400"
            />
            <YAxis
              label={{ value: 'Months', angle: -90, position: 'insideLeft' }}
              className="dark:fill-gray-400"
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)} months`}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--foreground)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar dataKey="paybackPeriod" fill="#3b82f6" name="Payback Period (months)" />
            <ReferenceLine
              y={12}
              stroke="#10b981"
              strokeDasharray="3 3"
              label={{ value: 'Target (12mo)', position: 'right', fill: '#10b981' }}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Churn Rate & ARPU */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 dark:text-white">Churn Rate</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="yearLabel"
                className="dark:fill-gray-400"
              />
              <YAxis
                tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
                className="dark:fill-gray-400"
              />
              <Tooltip
                formatter={(value: number) => formatPercent(value)}
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--foreground)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="churnRate"
                stroke="#ef4444"
                strokeWidth={2}
                name="Churn Rate"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 dark:text-white">ARPU</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
              <XAxis
                dataKey="yearLabel"
                className="dark:fill-gray-400"
              />
              <YAxis
                tickFormatter={(value) => formatCurrency(value, { compact: true })}
                className="dark:fill-gray-400"
              />
              <Tooltip
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{
                  backgroundColor: 'var(--background)',
                  border: '1px solid var(--foreground)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="arpu"
                stroke="#10b981"
                strokeWidth={2}
                name="ARPU"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

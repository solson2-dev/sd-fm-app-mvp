'use client';

import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { formatCurrency } from '@/lib/utils/format';

interface CashData {
  month: number;
  cashBalance: number;
  revenue: number;
  opex: number;
  netBurn: number;
  monthsOfRunway?: number;
}

interface CashRunwayChartProps {
  data: CashData[];
  fundingEvents?: { month: number; amount: number; name: string }[];
}

export function CashRunwayChart({ data, fundingEvents = [] }: CashRunwayChartProps) {
  const chartData = data.map((item) => ({
    ...item,
    monthLabel: `M${item.month}`,
  }));

  return (
    <div className="space-y-6">
      {/* Cash Balance Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Cash Balance Over Time</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="monthLabel"
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
            <Area
              type="monotone"
              dataKey="cashBalance"
              stroke="#10b981"
              fill="#10b981"
              fillOpacity={0.3}
              name="Cash Balance"
            />
            <ReferenceLine y={0} stroke="#ef4444" strokeDasharray="3 3" />
            {fundingEvents.map((event) => (
              <ReferenceLine
                key={event.month}
                x={`M${event.month}`}
                stroke="#8b5cf6"
                strokeDasharray="5 5"
                label={{
                  value: event.name,
                  position: 'top',
                  fill: '#8b5cf6',
                  fontSize: 12,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Burn Rate Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Monthly Burn Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="monthLabel"
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
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={2}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="opex"
              stroke="#ef4444"
              strokeWidth={2}
              name="OPEX"
            />
            <Line
              type="monotone"
              dataKey="netBurn"
              stroke="#f59e0b"
              strokeWidth={2}
              strokeDasharray="5 5"
              name="Net Burn"
            />
            <ReferenceLine y={0} stroke="#6b7280" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Runway Chart */}
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Months of Runway</h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={chartData.filter((d) => d.monthsOfRunway)}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="monthLabel"
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
            <Area
              type="monotone"
              dataKey="monthsOfRunway"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.3}
              name="Runway (months)"
            />
            <ReferenceLine
              y={6}
              stroke="#ef4444"
              strokeDasharray="3 3"
              label={{ value: 'Critical (6mo)', position: 'right', fill: '#ef4444' }}
            />
            <ReferenceLine
              y={12}
              stroke="#f59e0b"
              strokeDasharray="3 3"
              label={{ value: 'Warning (12mo)', position: 'right', fill: '#f59e0b' }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

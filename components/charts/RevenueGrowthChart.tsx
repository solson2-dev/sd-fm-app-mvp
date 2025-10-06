'use client';

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
import { formatCurrency, formatNumber } from '@/lib/utils/format';

interface RevenueData {
  year: number;
  revenue: number;
  arr: number;
  customers: number;
  growthRate?: number;
}

interface RevenueGrowthChartProps {
  data: RevenueData[];
  type?: 'line' | 'bar';
}

export function RevenueGrowthChart({ data, type = 'line' }: RevenueGrowthChartProps) {
  const chartData = data.map((item, index) => ({
    ...item,
    yearLabel: `Y${item.year}`,
    growthRate: index > 0
      ? ((item.revenue - data[index - 1].revenue) / data[index - 1].revenue) * 100
      : 0,
  }));

  const ChartComponent = type === 'line' ? LineChart : BarChart;
  const DataComponent = type === 'line' ? Line : Bar;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Revenue & ARR</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ChartComponent data={chartData}>
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
            <DataComponent
              type="monotone"
              dataKey="revenue"
              stroke="#8b5cf6"
              fill="#8b5cf6"
              name="Revenue"
            />
            <DataComponent
              type="monotone"
              dataKey="arr"
              stroke="#10b981"
              fill="#10b981"
              name="ARR"
            />
          </ChartComponent>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Customer Growth</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="yearLabel"
              className="dark:fill-gray-400"
            />
            <YAxis
              tickFormatter={(value) => formatNumber(value)}
              className="dark:fill-gray-400"
            />
            <Tooltip
              formatter={(value: number) => formatNumber(value)}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--foreground)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="customers"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Total Customers"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4 dark:text-white">Year-over-Year Growth Rate</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.slice(1)}>
            <CartesianGrid strokeDasharray="3 3" className="dark:stroke-gray-700" />
            <XAxis
              dataKey="yearLabel"
              className="dark:fill-gray-400"
            />
            <YAxis
              tickFormatter={(value) => `${value}%`}
              className="dark:fill-gray-400"
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(1)}%`}
              contentStyle={{
                backgroundColor: 'var(--background)',
                border: '1px solid var(--foreground)',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Bar
              dataKey="growthRate"
              fill="#f59e0b"
              name="Growth Rate %"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

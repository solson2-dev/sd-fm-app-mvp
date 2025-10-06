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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ErrorState } from '@/components/ErrorState';
import { Spinner } from '@/components/skeletons/Spinner';
import { ArrowLeft, RefreshCw, Users } from 'lucide-react';

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
  const [error, setError] = useState<Error | null>(null);
  const [recalculating, setRecalculating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setError(null);
      // Load projections
      const projectionsResponse = await fetch(
        `/api/opex/projections?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      if (!projectionsResponse.ok) throw new Error('Failed to load projections');
      const projectionsData = await projectionsResponse.json();

      // Load summary
      const summaryResponse = await fetch(
        `/api/opex/summary?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      if (!summaryResponse.ok) throw new Error('Failed to load summary');
      const summaryData = await summaryResponse.json();

      setProjections(projectionsData.projections || []);
      setSummary(summaryData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      setError(error instanceof Error ? error : new Error('Failed to load dashboard data'));
    } finally {
      setLoading(false);
    }
  }

  async function handleRecalculate() {
    setRecalculating(true);
    try {
      const response = await fetch('/api/opex/projections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          startMonth: 1,
          endMonth: 36,
        }),
      });
      if (!response.ok) throw new Error('Failed to recalculate');
      await loadData();
    } catch (error) {
      console.error('Error recalculating:', error);
      setError(error instanceof Error ? error : new Error('Failed to recalculate'));
    } finally {
      setRecalculating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 pb-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="space-y-2">
              <Skeleton className="h-10 w-64" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-3">
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-32" />
              <Skeleton className="h-11 w-24" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i}>
                <CardHeader className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
              </Card>
            ))}
          </div>

          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-80 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorState
            error={error}
            onRetry={loadData}
            title="Failed to load OPEX dashboard"
          />
        </div>
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold tracking-tight">OPEX Dashboard</h1>
            <p className="text-muted-foreground mt-2">36-month operating expense projections</p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={handleRecalculate}
              disabled={recalculating}
              variant="outline"
              size="lg"
              aria-label={recalculating ? 'Recalculating projections' : 'Recalculate projections'}
            >
              <RefreshCw className={recalculating ? 'animate-spin' : ''} />
              {recalculating ? 'Recalculating...' : 'Recalculate'}
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/personnel" aria-label="Edit personnel data">
                <Users />
                Edit Personnel
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/" aria-label="Return to home page">
                <ArrowLeft />
                Home
              </Link>
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Month 12 OPEX</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  ${summary.month12.totalOPEX.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {summary.month12.headcount} employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Month 36 OPEX</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  ${summary.month36.totalOPEX.toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {summary.month36.headcount} employees
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Cumulative (12 mo)</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  ${Math.round(summary.month12.cumulative).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="outline" className="text-success border-success">
                  Excel validated
                </Badge>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Cumulative (36 mo)</CardDescription>
                <CardTitle className="text-3xl tabular-nums">
                  ${Math.round(summary.month36.cumulative).toLocaleString()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  Avg ${Math.round(summary.month36.cumulative / 36).toLocaleString()}/mo
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Total OPEX Line Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Total OPEX Over Time</CardTitle>
            <CardDescription>Monthly operating expenses across 36 months</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  name="Total OPEX"
                  dot={{ fill: 'hsl(var(--chart-1))' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stacked Bar Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>OPEX Breakdown</CardTitle>
            <CardDescription>Personnel vs operating expenses by month</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="month"
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <Tooltip
                  formatter={(value) => `$${Number(value).toLocaleString()}`}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                  }}
                />
                <Legend />
                <Bar dataKey="personnel" stackId="a" fill="hsl(var(--chart-1))" name="Personnel" />
                <Bar dataKey="operating" stackId="a" fill="hsl(var(--chart-3))" name="Operating" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Data Table */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Projections</CardTitle>
            <CardDescription>Quarterly summary of operating expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Personnel</TableHead>
                  <TableHead className="text-right">Operating</TableHead>
                  <TableHead className="text-right">Total OPEX</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projections.filter((p) => p.month % 3 === 0).map((p) => (
                  <TableRow key={p.month}>
                    <TableCell className="font-medium">Month {p.month}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${Math.round(p.personnelCost).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      ${Math.round(p.operatingSubtotal).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      ${Math.round(p.totalOPEX).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

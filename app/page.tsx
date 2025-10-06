import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Settings,
  Users,
  LayoutDashboard,
  TrendingUp,
  FileText,
  DollarSign,
  PieChart,
  Target,
  GitCompare,
} from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-6xl mx-auto">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-5xl font-bold tracking-tight mb-2">
              StudioDatum Financial Model
            </h1>
            <p className="text-xl text-muted-foreground">
              OPEX modeling with validated calculations
            </p>
          </div>
          <ThemeToggle />
        </div>

        <div className="mb-12">
          <Badge variant="outline" className="text-success border-success">
            100% Excel accuracy
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link href="/variables" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Settings className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Variables & Assumptions
                  </CardTitle>
                </div>
                <CardDescription>
                  Configure all model assumptions and key parameters
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/personnel" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Personnel Planning
                  </CardTitle>
                </div>
                <CardDescription>
                  Configure personnel roles, salaries, and start dates
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/dashboard" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <LayoutDashboard className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    OPEX Dashboard
                  </CardTitle>
                </div>
                <CardDescription>
                  View 36-month OPEX projections and key metrics
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/revenue" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Revenue Model
                  </CardTitle>
                </div>
                <CardDescription>
                  Customer acquisition, ARR, and 10-year revenue projections
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/scenarios" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Scenarios
                  </CardTitle>
                </div>
                <CardDescription>
                  Create and compare multiple financial scenarios
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/financials" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Financials
                  </CardTitle>
                </div>
                <CardDescription>
                  Income statement, cash flow, and balance sheet
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/funding" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <DollarSign className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Funding Rounds
                  </CardTitle>
                </div>
                <CardDescription>
                  Track capital raises and investor equity
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/equity" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <PieChart className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Equity & Cap Table
                  </CardTitle>
                </div>
                <CardDescription>
                  Founder equity, ESOP pool, and dilution tracking
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/exit-scenarios" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Target className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Exit Scenarios
                  </CardTitle>
                </div>
                <CardDescription>
                  Valuation multiples, ROI, and investor returns
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>

          <Link href="/scenarios/compare" className="group">
            <Card className="h-full transition-all hover:shadow-md hover:border-primary">
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <GitCompare className="h-6 w-6 text-primary" />
                  <CardTitle className="group-hover:text-primary transition-colors">
                    Scenario Comparison
                  </CardTitle>
                </div>
                <CardDescription>
                  Compare metrics across different scenarios
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>OPEX Model Validated</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Month 12 Total OPEX:</span>
                  <span className="font-semibold tabular-nums">$99,500 (±$1)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Month 36 Total OPEX:</span>
                  <span className="font-semibold tabular-nums">$220,750 (±$1)</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Cumulative Month 12:</span>
                  <span className="font-semibold tabular-nums">$939,000 (±$3)</span>
                </li>
                <li className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Accuracy vs Excel:</span>
                  <Badge variant="outline" className="text-success border-success">
                    100%
                  </Badge>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Model Targets</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Year 5 ARR:</span>
                  <span className="font-semibold tabular-nums">$15.3M</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Year 5 Customers:</span>
                  <span className="font-semibold tabular-nums">631</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-muted-foreground">Year 5 Revenue:</span>
                  <span className="font-semibold tabular-nums">$15.9M</span>
                </li>
                <li className="flex justify-between pt-2 border-t">
                  <span className="text-muted-foreground">Acquisition Model:</span>
                  <span className="font-semibold">S-curve</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

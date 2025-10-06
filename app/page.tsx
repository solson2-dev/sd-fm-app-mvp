import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function Home() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950 p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <div className="flex justify-between items-start mb-4">
          <h1 className="text-4xl font-bold text-black dark:text-white">StudioDatum Financial Model - MVP</h1>
          <ThemeToggle />
        </div>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
          OPEX modeling with validated calculations (100% Excel accuracy)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link
            href="/personnel"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Personnel Planning</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Configure personnel roles, salaries, and start dates
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">OPEX Dashboard</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              View 36-month OPEX projections and key metrics
            </p>
          </Link>

          <Link
            href="/revenue"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Revenue Model</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Customer acquisition, ARR, and 10-year revenue projections
            </p>
          </Link>

          <Link
            href="/scenarios"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Scenarios</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Create and compare multiple financial scenarios
            </p>
          </Link>

          <Link
            href="/financials"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Financials</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Income statement, cash flow, and balance sheet
            </p>
          </Link>

          <Link
            href="/funding"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Funding Rounds</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Track capital raises and investor equity
            </p>
          </Link>

          <Link
            href="/equity"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Equity & Cap Table</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Founder equity, ESOP pool, and dilution tracking
            </p>
          </Link>

          <Link
            href="/exit-scenarios"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Exit Scenarios</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Valuation multiples, ROI, and investor returns
            </p>
          </Link>

          <Link
            href="/scenarios/compare"
            className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded hover:border-gray-900 dark:hover:border-gray-500 transition-all"
          >
            <h2 className="text-xl font-semibold mb-2 text-black dark:text-white">Scenario Comparison</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Compare metrics across different scenarios
            </p>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
            <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">OPEX Model Validated</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Month 12 Total OPEX: $99,500 (±$1)</li>
              <li>• Month 36 Total OPEX: $220,750 (±$1)</li>
              <li>• Cumulative Month 12: $939,000 (±$3)</li>
              <li>• 100% accuracy vs Excel model</li>
            </ul>
          </div>

          <div className="p-6 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded">
            <h3 className="text-lg font-semibold mb-2 text-black dark:text-white">Revenue Model Targets</h3>
            <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
              <li>• Year 5 ARR: $15.3M</li>
              <li>• Year 5 Customers: 631</li>
              <li>• Year 5 Revenue: $15.9M</li>
              <li>• S-curve customer acquisition</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}

import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen p-8 pb-20 sm:p-20">
      <main className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">StudioDatum Financial Model - MVP</h1>
        <p className="text-lg text-gray-600 mb-8">
          OPEX modeling with validated calculations (100% Excel accuracy)
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/personnel"
            className="p-6 border rounded-lg hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h2 className="text-2xl font-semibold mb-2">Personnel Planning</h2>
            <p className="text-gray-600">
              Configure personnel roles, salaries, and start dates
            </p>
          </Link>

          <Link
            href="/dashboard"
            className="p-6 border rounded-lg hover:border-blue-500 hover:shadow-lg transition-all"
          >
            <h2 className="text-2xl font-semibold mb-2">OPEX Dashboard</h2>
            <p className="text-gray-600">
              View 36-month OPEX projections and key metrics
            </p>
          </Link>

          <Link
            href="/revenue"
            className="p-6 border rounded-lg hover:border-green-500 hover:shadow-lg transition-all bg-green-50"
          >
            <h2 className="text-2xl font-semibold mb-2">Revenue Model ✨</h2>
            <p className="text-gray-600">
              Customer acquisition, ARR, and 10-year revenue projections
            </p>
          </Link>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-green-800">✅ OPEX Model Validated</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Month 12 Total OPEX: $99,500 (±$1)</li>
              <li>• Month 36 Total OPEX: $220,750 (±$1)</li>
              <li>• Cumulative Month 12: $939,000 (±$3)</li>
              <li>• 100% accuracy vs Excel model</li>
            </ul>
          </div>

          <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-800">📊 Revenue Model Targets</h3>
            <ul className="text-sm text-blue-700 space-y-1">
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

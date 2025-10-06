'use client';

import { CapTableEntry } from '@/lib/calculations/equity';
import { formatPercent, formatCurrency, formatNumber } from '@/lib/utils/format';

interface FundingRoundData {
  roundName: string;
  amount: number;
  preMoneyValuation: number;
  postMoneyValuation: number;
  pricePerShare: number;
  sharesIssued: number;
  investorOwnership: number;
  date: string;
}

interface CapTableWaterfallProps {
  capTable: CapTableEntry[];
  fundingRounds?: FundingRoundData[];
}

export function CapTableWaterfall({
  capTable,
  fundingRounds = [],
}: CapTableWaterfallProps) {
  // Group cap table entries by round
  const founders = capTable.filter((e) => e.type === 'Founder');
  const esop = capTable.filter((e) => e.type === 'ESOP');
  const esopRefresh = capTable.filter((e) => e.type === 'ESOP Refresh');
  const investors = capTable.filter((e) => e.type === 'Investor');

  const totalShares = capTable.reduce((sum, e) => sum + e.shares, 0);
  const totalESOPOwnership = [...esop, ...esopRefresh].reduce(
    (sum, e) => sum + e.ownership,
    0
  );

  return (
    <div className="space-y-8">
      {/* Cap Table Summary */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Current Cap Table</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-900">
                <th className="text-left py-2 px-4 font-semibold">Stakeholder</th>
                <th className="text-left py-2 px-4 font-semibold">Type</th>
                <th className="text-right py-2 px-4 font-semibold">Shares</th>
                <th className="text-right py-2 px-4 font-semibold">Ownership %</th>
                <th className="text-left py-2 px-4 font-semibold">Round</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {/* Founders */}
              {founders.map((entry, idx) => (
                <tr key={`founder-${idx}`} className="border-b border-gray-200">
                  <td className="py-2 px-4 font-medium">{entry.stakeholder}</td>
                  <td className="py-2 px-4 text-gray-600">{entry.type}</td>
                  <td className="py-2 px-4 text-right font-mono">
                    {formatNumber(entry.shares)}
                  </td>
                  <td className="py-2 px-4 text-right font-mono">
                    {formatPercent(entry.ownership, { decimals: 2 })}
                  </td>
                  <td className="py-2 px-4 text-gray-600">Formation</td>
                </tr>
              ))}
              {/* ESOP */}
              {[...esop, ...esopRefresh].map((entry, idx) => (
                <tr key={`esop-${idx}`} className="border-b border-gray-200 bg-blue-50">
                  <td className="py-2 px-4 font-medium">{entry.stakeholder}</td>
                  <td className="py-2 px-4 text-gray-600">{entry.type}</td>
                  <td className="py-2 px-4 text-right font-mono">
                    {formatNumber(entry.shares)}
                  </td>
                  <td className="py-2 px-4 text-right font-mono">
                    {formatPercent(entry.ownership, { decimals: 2 })}
                  </td>
                  <td className="py-2 px-4 text-gray-600">
                    {entry.roundName || 'Formation'}
                  </td>
                </tr>
              ))}
              {/* Investors */}
              {investors.map((entry, idx) => (
                <tr key={`investor-${idx}`} className="border-b border-gray-200 bg-green-50">
                  <td className="py-2 px-4 font-medium">{entry.stakeholder}</td>
                  <td className="py-2 px-4 text-gray-600">{entry.type}</td>
                  <td className="py-2 px-4 text-right font-mono">
                    {formatNumber(entry.shares)}
                  </td>
                  <td className="py-2 px-4 text-right font-mono">
                    {formatPercent(entry.ownership, { decimals: 2 })}
                  </td>
                  <td className="py-2 px-4 text-gray-600">{entry.roundName}</td>
                </tr>
              ))}
              {/* Total */}
              <tr className="border-b-2 border-gray-900 bg-gray-100">
                <td className="py-3 px-4 font-bold">Total</td>
                <td className="py-3 px-4"></td>
                <td className="py-3 px-4 text-right font-mono font-bold">
                  {formatNumber(totalShares)}
                </td>
                <td className="py-3 px-4 text-right font-mono font-bold">100.00%</td>
                <td className="py-3 px-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Ownership Breakdown */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Ownership Breakdown</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg">
            <div className="text-sm text-gray-600 font-medium">Founders</div>
            <div className="text-3xl font-bold mt-2">
              {formatPercent(
                founders.reduce((sum, f) => sum + f.ownership, 0),
                { decimals: 2 }
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatNumber(founders.reduce((sum, f) => sum + f.shares, 0))} shares
            </div>
          </div>
          <div className="p-6 border rounded-lg bg-blue-50">
            <div className="text-sm text-gray-600 font-medium">ESOP Pool</div>
            <div className="text-3xl font-bold mt-2">
              {formatPercent(totalESOPOwnership, { decimals: 2 })}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatNumber([...esop, ...esopRefresh].reduce((sum, e) => sum + e.shares, 0))} shares
            </div>
          </div>
          <div className="p-6 border rounded-lg bg-green-50">
            <div className="text-sm text-gray-600 font-medium">Investors</div>
            <div className="text-3xl font-bold mt-2">
              {formatPercent(
                investors.reduce((sum, i) => sum + i.ownership, 0),
                { decimals: 2 }
              )}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              {formatNumber(investors.reduce((sum, i) => sum + i.shares, 0))} shares
            </div>
          </div>
        </div>
      </div>

      {/* Funding Rounds Detail */}
      {fundingRounds.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Funding Rounds</h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th className="text-left py-2 px-4 font-semibold">Round</th>
                  <th className="text-left py-2 px-4 font-semibold">Date</th>
                  <th className="text-right py-2 px-4 font-semibold">Amount Raised</th>
                  <th className="text-right py-2 px-4 font-semibold">Pre-Money</th>
                  <th className="text-right py-2 px-4 font-semibold">Post-Money</th>
                  <th className="text-right py-2 px-4 font-semibold">Price/Share</th>
                  <th className="text-right py-2 px-4 font-semibold">Shares Issued</th>
                  <th className="text-right py-2 px-4 font-semibold">Investor %</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {fundingRounds.map((round, idx) => (
                  <tr key={idx} className="border-b border-gray-200">
                    <td className="py-2 px-4 font-medium">{round.roundName}</td>
                    <td className="py-2 px-4 text-gray-600">
                      {new Date(round.date).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatCurrency(round.amount)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatCurrency(round.preMoneyValuation)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono font-semibold">
                      {formatCurrency(round.postMoneyValuation)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatCurrency(round.pricePerShare, { showCents: true })}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatNumber(round.sharesIssued)}
                    </td>
                    <td className="py-2 px-4 text-right font-mono">
                      {formatPercent(round.investorOwnership, { decimals: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Dilution Waterfall Visualization */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Dilution Waterfall</h2>
        <div className="space-y-2">
          {/* Founders Bar */}
          <div>
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium w-32">Founders</span>
              <span className="text-sm font-mono">
                {formatPercent(
                  founders.reduce((sum, f) => sum + f.ownership, 0),
                  { decimals: 2 }
                )}
              </span>
            </div>
            <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
              <div
                className="h-full bg-purple-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{
                  width: `${founders.reduce((sum, f) => sum + f.ownership, 0) * 100}%`,
                }}
              >
                Founders
              </div>
            </div>
          </div>

          {/* ESOP Bar */}
          <div>
            <div className="flex items-center mb-1">
              <span className="text-sm font-medium w-32">ESOP Pool</span>
              <span className="text-sm font-mono">
                {formatPercent(totalESOPOwnership, { decimals: 2 })}
              </span>
            </div>
            <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
              <div
                className="h-full bg-blue-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${totalESOPOwnership * 100}%` }}
              >
                ESOP
              </div>
            </div>
          </div>

          {/* Investors Bar */}
          {investors.map((investor, idx) => (
            <div key={idx}>
              <div className="flex items-center mb-1">
                <span className="text-sm font-medium w-32 truncate">
                  {investor.stakeholder}
                </span>
                <span className="text-sm font-mono">
                  {formatPercent(investor.ownership, { decimals: 2 })}
                </span>
              </div>
              <div className="h-8 bg-gray-200 rounded-lg overflow-hidden">
                <div
                  className="h-full bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
                  style={{ width: `${investor.ownership * 100}%` }}
                >
                  {investor.roundName}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

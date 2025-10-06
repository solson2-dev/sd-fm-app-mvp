'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { CapTableEntry } from '@/lib/calculations/equity';
import { CapTableWaterfall } from '@/components/CapTableWaterfall';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

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

export default function EquityPage() {
  const [capTable, setCapTable] = useState<CapTableEntry[]>([]);
  const [founders, setFounders] = useState<any[]>([]);
  const [esopPoolSize, setEsopPoolSize] = useState(0.15);
  const [fundingRounds, setFundingRounds] = useState<FundingRoundData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'captable' | 'waterfall' | 'founders'>('captable');

  useEffect(() => {
    loadEquityData();
  }, []);

  async function loadEquityData() {
    try {
      const response = await fetch(
        `/api/equity?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      const data = await response.json();

      if (data.capTable) setCapTable(data.capTable);
      if (data.founders) setFounders(data.founders);
      if (data.esopPoolSize) setEsopPoolSize(data.esopPoolSize);
      if (data.fundingRounds) setFundingRounds(data.fundingRounds);
    } catch (error) {
      console.error('Error loading equity data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    try {
      const response = await fetch('/api/equity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          founders,
          esopPoolSize,
        }),
      });

      if (response.ok) {
        await loadEquityData();
        alert('Equity structure saved!');
      }
    } catch (error) {
      console.error('Error saving equity data:', error);
      alert('Error saving equity data');
    }
  }

  function formatPercent(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  function formatNumber(value: number): string {
    return value.toLocaleString();
  }

  const totalShares = capTable.reduce((sum, entry) => sum + entry.shares, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-xl text-black">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Equity & Cap Table</h1>
            <p className="text-gray-600 mt-2">
              Manage founder equity, ESOP, and track dilution
            </p>
          </div>
          <Link
            href="/"
            className="px-4 py-2 bg-white border border-gray-300 rounded hover:border-gray-900"
          >
            ← Back
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-300">
          <button
            onClick={() => setActiveTab('captable')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'captable'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Cap Table
          </button>
          <button
            onClick={() => setActiveTab('waterfall')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'waterfall'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Dilution Waterfall
          </button>
          <button
            onClick={() => setActiveTab('founders')}
            className={`px-6 py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'founders'
                ? 'border-black text-black'
                : 'border-transparent text-gray-600 hover:text-black'
            }`}
          >
            Founder Settings
          </button>
        </div>

        {/* Cap Table View */}
        {activeTab === 'captable' && (
          <>
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-6 bg-white border border-gray-300 rounded">
                <div className="text-sm text-gray-600 font-medium">Total Shares</div>
                <div className="text-3xl font-bold text-black mt-2">
                  {formatNumber(totalShares)}
                </div>
              </div>
              <div className="p-6 bg-white border border-gray-300 rounded">
                <div className="text-sm text-gray-600 font-medium">ESOP Pool</div>
                <div className="text-3xl font-bold text-black mt-2">
                  {formatPercent(esopPoolSize)}
                </div>
              </div>
              <div className="p-6 bg-white border border-gray-300 rounded">
                <div className="text-sm text-gray-600 font-medium">Stakeholders</div>
                <div className="text-3xl font-bold text-black mt-2">
                  {capTable.length}
                </div>
              </div>
            </div>

            {/* Cap Table */}
            <div className="bg-white border border-gray-300 rounded overflow-hidden">
              {capTable.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No equity structure defined. Configure founders first.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-300">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-black">
                          Stakeholder
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-black">
                          Type
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                          Shares
                        </th>
                        <th className="px-6 py-3 text-right text-sm font-semibold text-black">
                          Ownership %
                        </th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-black">
                          Round
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {capTable.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm font-medium text-black">
                            {entry.stakeholder}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {entry.type}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-black">
                            {formatNumber(entry.shares)}
                          </td>
                          <td className="px-6 py-4 text-sm text-right font-mono text-black">
                            {formatPercent(entry.ownership)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {entry.roundName || '—'}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50 font-semibold">
                        <td className="px-6 py-4 text-sm text-black">Total</td>
                        <td className="px-6 py-4 text-sm text-black"></td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-black">
                          {formatNumber(totalShares)}
                        </td>
                        <td className="px-6 py-4 text-sm text-right font-mono text-black">
                          100.00%
                        </td>
                        <td className="px-6 py-4 text-sm text-black"></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* Waterfall View */}
        {activeTab === 'waterfall' && (
          <CapTableWaterfall capTable={capTable} fundingRounds={fundingRounds} />
        )}

        {/* Founder Settings */}
        {activeTab === 'founders' && (
          <div className="space-y-6">
            <div className="bg-white border border-gray-300 rounded p-6">
              <h2 className="text-xl font-semibold text-black mb-4">ESOP Pool</h2>
              <div className="max-w-md">
                <label className="block text-sm font-medium text-black mb-1">
                  Pool Size (% of total equity)
                </label>
                <input
                  type="number"
                  value={esopPoolSize * 100}
                  onChange={(e) =>
                    setEsopPoolSize(parseFloat(e.target.value) / 100 || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                  step="0.1"
                  min="0"
                  max="30"
                />
                <p className="text-xs text-gray-600 mt-1">
                  Typical range: 10-20% for early-stage startups
                </p>
              </div>
            </div>

            <div className="bg-white border border-gray-300 rounded p-6">
              <h2 className="text-xl font-semibold text-black mb-4">Founders</h2>
              <div className="space-y-4">
                {founders.map((founder, idx) => (
                  <div key={idx} className="flex gap-4 items-end">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-black mb-1">
                        Name
                      </label>
                      <input
                        type="text"
                        value={founder.name}
                        onChange={(e) => {
                          const updated = [...founders];
                          updated[idx].name = e.target.value;
                          setFounders(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-black mb-1">
                        Ownership (% of founder equity)
                      </label>
                      <input
                        type="number"
                        value={founder.ownership * 100}
                        onChange={(e) => {
                          const updated = [...founders];
                          updated[idx].ownership =
                            parseFloat(e.target.value) / 100 || 0;
                          setFounders(updated);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded text-black"
                        step="0.1"
                        min="0"
                        max="100"
                      />
                    </div>
                    <button
                      onClick={() => {
                        setFounders(founders.filter((_, i) => i !== idx));
                      }}
                      className="px-4 py-2 border border-gray-300 rounded hover:border-red-500 hover:text-red-600 text-black"
                    >
                      Remove
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    setFounders([
                      ...founders,
                      { name: `Founder ${founders.length + 1}`, ownership: 0.5 },
                    ]);
                  }}
                  className="px-4 py-2 bg-white border border-gray-300 rounded hover:border-gray-900 text-black"
                >
                  + Add Founder
                </button>
              </div>

              <div className="mt-6 pt-6 border-t border-gray-300">
                <button
                  onClick={handleSave}
                  className="px-6 py-3 bg-black text-white rounded hover:bg-gray-800"
                >
                  Save Equity Structure
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

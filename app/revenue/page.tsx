'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  RevenueAssumptions,
  getDefaultRevenueAssumptions,
  calculateGrowthExponent,
} from '@/lib/calculations/revenue';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

export default function RevenuePage() {
  const [assumptions, setAssumptions] = useState<RevenueAssumptions>(
    getDefaultRevenueAssumptions()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadAssumptions();
  }, []);

  async function loadAssumptions() {
    try {
      const response = await fetch(
        `/api/revenue/assumptions?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      const data = await response.json();

      if (data.assumptions) {
        setAssumptions(data.assumptions);
      }
    } catch (error) {
      console.error('Error loading assumptions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      // Save assumptions
      const saveResponse = await fetch('/api/revenue/assumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          assumptions,
        }),
      });

      if (!saveResponse.ok) {
        setMessage('❌ Error saving revenue assumptions');
        return;
      }

      // Calculate projections
      await fetch('/api/revenue/projections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          years: 10,
        }),
      });

      setMessage('✅ Revenue assumptions saved and projections updated!');
    } catch (error) {
      console.error('Error saving assumptions:', error);
      setMessage('❌ Error saving revenue assumptions');
    } finally {
      setSaving(false);
    }
  }

  function updateAssumption(field: keyof RevenueAssumptions, value: string) {
    setAssumptions({
      ...assumptions,
      [field]: parseFloat(value) || 0,
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  // Calculate derived metrics
  const growthExponent = calculateGrowthExponent(assumptions);
  const targetCustomers = Math.round(assumptions.tam * assumptions.targetPenetration);
  const year5Target = Math.round(
    assumptions.tam *
      (assumptions.targetPenetration *
        Math.pow(5 / assumptions.yearsToTarget, growthExponent))
  );

  return (
    <div className="min-h-screen p-8 pb-20">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Revenue Assumptions</h1>
            <p className="text-gray-600 mt-2">
              Configure customer acquisition and revenue model
            </p>
          </div>
          <Link href="/" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            ← Back
          </Link>
        </div>

        {message && (
          <div
            className={`p-4 mb-6 rounded-lg ${
              message.includes('✅')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}
          >
            {message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Market & Growth Parameters */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Market Parameters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Total Addressable Market (TAM)
                </label>
                <input
                  type="number"
                  value={assumptions.tam}
                  onChange={(e) => updateAssumption('tam', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Number of potential customers</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Target Market Penetration (%)
                </label>
                <input
                  type="number"
                  value={assumptions.targetPenetration * 100}
                  onChange={(e) =>
                    updateAssumption('targetPenetration', (parseFloat(e.target.value) / 100).toString())
                  }
                  className="w-full px-3 py-2 border rounded"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Target: {targetCustomers.toLocaleString()} customers
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Years to Reach Target
                </label>
                <input
                  type="number"
                  value={assumptions.yearsToTarget}
                  onChange={(e) => updateAssumption('yearsToTarget', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                  max="20"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Growth Exponent (Calculated)
                </label>
                <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-700 font-mono">
                  {growthExponent.toFixed(3)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Auto-calculated from Year 1 customers and target penetration
                </p>
              </div>
            </div>
          </div>

          {/* Starting Conditions */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Starting Conditions</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Year 1 Customers
                </label>
                <input
                  type="number"
                  value={assumptions.year1Customers}
                  onChange={(e) => updateAssumption('year1Customers', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Churn Rate (%)
                </label>
                <input
                  type="number"
                  value={assumptions.churnRate * 100}
                  onChange={(e) =>
                    updateAssumption('churnRate', (parseFloat(e.target.value) / 100).toString())
                  }
                  className="w-full px-3 py-2 border rounded"
                  step="0.5"
                  min="0"
                  max="100"
                />
                <p className="text-xs text-gray-500 mt-1">Annual customer churn rate</p>
              </div>

              <div className="pt-4 border-t">
                <h3 className="font-medium mb-2">Calculated Metrics</h3>
                <div className="text-sm space-y-1">
                  <p className="text-gray-600">
                    Year 5 Target: <span className="font-semibold">{year5Target.toLocaleString()}</span> customers
                  </p>
                  <p className="text-gray-600">
                    Final Target: <span className="font-semibold">{targetCustomers.toLocaleString()}</span> customers
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Parameters */}
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Pricing</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Base ARR per Customer ($)
                </label>
                <input
                  type="number"
                  value={assumptions.baseArr}
                  onChange={(e) => updateAssumption('baseArr', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  step="1000"
                />
                <p className="text-xs text-gray-500 mt-1">Annual recurring revenue per customer</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Setup Fee ($)
                </label>
                <input
                  type="number"
                  value={assumptions.setupFee}
                  onChange={(e) => updateAssumption('setupFee', e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  step="100"
                />
                <p className="text-xs text-gray-500 mt-1">One-time fee per new customer</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Annual Price Increase (%)
                </label>
                <input
                  type="number"
                  value={assumptions.annualPriceIncrease * 100}
                  onChange={(e) =>
                    updateAssumption('annualPriceIncrease', (parseFloat(e.target.value) / 100).toString())
                  }
                  className="w-full px-3 py-2 border rounded"
                  step="0.5"
                  min="0"
                  max="20"
                />
                <p className="text-xs text-gray-500 mt-1">Yearly price escalation</p>
              </div>
            </div>
          </div>

          {/* Excel Validation */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-blue-900">
              📊 Excel Validation Targets
            </h2>

            <div className="space-y-3 text-sm">
              <div>
                <p className="text-blue-700 font-medium">Year 5 ARR</p>
                <p className="text-2xl font-bold text-blue-900">$15,332,765</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Year 5 Customers</p>
                <p className="text-2xl font-bold text-blue-900">631</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Year 5 Revenue</p>
                <p className="text-2xl font-bold text-blue-900">$15,946,894</p>
              </div>
              <div>
                <p className="text-blue-700 font-medium">Year 5 Gross Profit</p>
                <p className="text-2xl font-bold text-blue-900">$11,960,170</p>
              </div>
            </div>

            <p className="text-xs text-blue-600 mt-4">
              ℹ️ After saving, view the Revenue Dashboard to compare calculated vs expected values
            </p>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium"
          >
            {saving ? 'Saving...' : 'Save & Calculate'}
          </button>

          <Link
            href="/revenue/dashboard"
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium inline-block"
          >
            View Revenue Dashboard →
          </Link>
        </div>

        <div className="mt-8 p-4 bg-gray-50 border rounded-lg">
          <h3 className="font-semibold mb-2">ℹ️ How it Works</h3>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• <strong>S-Curve Growth</strong>: Customer acquisition follows Market% = Target% × (Year/YearsToTarget)^GrowthExponent</li>
            <li>• <strong>Growth Exponent</strong>: Auto-calculated using LOG(Year1/Target) / LOG(1/YearsToTarget) to create realistic startup growth</li>
            <li>• <strong>ARR Calculation</strong>: Total Customers × ARR per Customer (with annual price increases)</li>
            <li>• <strong>Revenue</strong>: ARR + Setup Fees from new customers</li>
            <li>• <strong>Churn</strong>: Annual customer loss rate applied each year</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

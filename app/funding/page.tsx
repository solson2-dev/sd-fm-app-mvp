'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { validateFundingAmount, validateValuation, validateRequired } from '@/lib/utils/validation';
import { CardSkeleton } from '@/components/skeletons/CardSkeleton';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { EmptyState } from '@/components/EmptyState';
import { Spinner } from '@/components/skeletons/Spinner';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

interface FundingRound {
  id: string;
  round_name: string;
  amount_raised: number;
  post_money_valuation: number;
  close_date: string;
  lead_investor: string | null;
}

const ROUND_TYPES = [
  'Bootstrap',
  'Friends & Family',
  'Pre-Seed',
  'Seed',
  'Bridge',
  'Series A',
  'Series B',
  'Series C',
];

export default function FundingPage() {
  const [fundingRounds, setFundingRounds] = useState<FundingRound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(false);
  const [validationError, setValidationError] = useState<string>('');

  const [formData, setFormData] = useState({
    roundName: 'Pre-Seed',
    amount: 0,
    valuation: 0,
    roundDate: new Date().toISOString().split('T')[0],
    investorNames: '',
  });

  useEffect(() => {
    loadFundingRounds();
  }, []);

  async function loadFundingRounds() {
    try {
      setError(null);
      const response = await fetch(
        `/api/funding?scenarioId=${DEFAULT_SCENARIO_ID}`
      );
      if (!response.ok) throw new Error('Failed to load funding rounds');
      const data = await response.json();

      if (data.fundingRounds) {
        setFundingRounds(data.fundingRounds);
      }
    } catch (error) {
      console.error('Error loading funding rounds:', error);
      setError(error instanceof Error ? error : new Error('Failed to load funding rounds'));
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setValidationError('');

    // Validate form data
    const requiredValidation = validateRequired(formData.roundName, 'Round name');
    if (!requiredValidation.isValid) {
      setValidationError(requiredValidation.error!);
      return;
    }

    const amountValidation = validateFundingAmount(formData.amount);
    if (!amountValidation.isValid) {
      setValidationError(amountValidation.error!);
      return;
    }

    const valuationValidation = validateValuation(formData.valuation, formData.amount);
    if (!valuationValidation.isValid) {
      setValidationError(valuationValidation.error!);
      return;
    }

    setEditing(true);

    try {
      const response = await fetch('/api/funding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          fundingRound: formData,
        }),
      });

      if (response.ok) {
        await loadFundingRounds();
        setShowModal(false);
        resetForm();
      } else {
        const error = await response.json();
        setValidationError(error.error || 'Failed to save funding round');
      }
    } catch (error) {
      console.error('Error saving funding round:', error);
      setValidationError('An unexpected error occurred');
    } finally {
      setEditing(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this funding round?')) return;

    try {
      const response = await fetch(`/api/funding?id=${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await loadFundingRounds();
      }
    } catch (error) {
      console.error('Error deleting funding round:', error);
    }
  }

  function resetForm() {
    setFormData({
      roundName: 'Pre-Seed',
      amount: 0,
      valuation: 0,
      roundDate: new Date().toISOString().split('T')[0],
      investorNames: '',
    });
  }

  function formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  function formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  const totalRaised = fundingRounds.reduce((sum, round) => sum + round.amount_raised, 0);

  // Calculate cumulative dilution
  let cumulativeDilution = 0;
  const roundsWithDilution = fundingRounds.map((round) => {
    const dilution = round.post_money_valuation > 0
      ? (round.amount_raised / round.post_money_valuation) * 100
      : 0;
    cumulativeDilution += dilution;
    return { ...round, dilution, cumulativeDilution };
  });

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
            <div className="flex gap-3">
              <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
              <div className="h-10 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <CardSkeleton count={3} />
          </div>

          <TableSkeleton rows={5} columns={7} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto">
          <ErrorState
            error={error}
            onRetry={loadFundingRounds}
            title="Failed to load funding rounds"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Funding Rounds</h1>
            <p className="text-gray-600 mt-2">
              Manage funding rounds and track capital raises
            </p>
          </div>
          <div className="flex gap-3">
            <Link
              href="/"
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              ← Back
            </Link>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + Add Funding Round
            </button>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="text-sm text-blue-600 font-medium">Total Raised</div>
            <div className="text-3xl font-bold text-blue-900 mt-2">
              {formatCurrency(totalRaised)}
            </div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="text-sm text-green-600 font-medium">
              Number of Rounds
            </div>
            <div className="text-3xl font-bold text-green-900 mt-2">
              {fundingRounds.length}
            </div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="text-sm text-purple-600 font-medium">
              Latest Round
            </div>
            <div className="text-3xl font-bold text-purple-900 mt-2">
              {fundingRounds.length > 0
                ? fundingRounds[fundingRounds.length - 1].round_name
                : 'None'}
            </div>
          </div>
        </div>

        {/* Funding Rounds Table */}
        <div className="bg-white border rounded-lg overflow-hidden">
          {fundingRounds.length === 0 ? (
            <EmptyState
              title="No funding rounds yet"
              description="Add your first funding round to start tracking capital raises and dilution"
              action={{
                label: '+ Add Funding Round',
                onClick: () => setShowModal(true)
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Round
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      Valuation
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      Dilution
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">
                      Investors
                    </th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {roundsWithDilution.map((round) => (
                    <tr key={round.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium">
                        {round.round_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(round.amount_raised)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {formatCurrency(round.post_money_valuation)}
                      </td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {round.dilution.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {formatDate(round.close_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {round.lead_investor || '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-right">
                        <button
                          onClick={() => handleDelete(round.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Add Funding Round</h2>

            {validationError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {validationError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Round Type *
                </label>
                <select
                  value={formData.roundName}
                  onChange={(e) =>
                    setFormData({ ...formData, roundName: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                >
                  {ROUND_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Amount Raised *
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      amount: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                  placeholder="500000"
                  step="1000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Post-Money Valuation *
                </label>
                <input
                  type="number"
                  value={formData.valuation}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valuation: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 border rounded"
                  placeholder="5000000"
                  step="10000"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Closing Date *
                </label>
                <input
                  type="date"
                  value={formData.roundDate}
                  onChange={(e) =>
                    setFormData({ ...formData, roundDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Investor Names (optional)
                </label>
                <textarea
                  value={formData.investorNames}
                  onChange={(e) =>
                    setFormData({ ...formData, investorNames: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded"
                  rows={2}
                  placeholder="Acme Ventures, XYZ Capital"
                />
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  disabled={editing}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={editing}
                >
                  {editing && <Spinner size="sm" className="text-white" />}
                  {editing ? 'Adding...' : 'Add Round'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

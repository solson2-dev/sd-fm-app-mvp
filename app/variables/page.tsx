'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface Assumption {
  id?: string;
  key: string;
  value: string;
  category: string;
  description?: string;
}

interface AssumptionGroup {
  [category: string]: Assumption[];
}

const CATEGORY_LABELS: { [key: string]: string } = {
  revenue: 'Revenue & Growth',
  pricing: 'Pricing & Discounts',
  customers: 'Customer Acquisition',
  churn: 'Churn & Retention',
  opex: 'Operating Expenses',
  personnel: 'Personnel & Hiring',
  funding: 'Funding & Capital',
  equity: 'Equity & Ownership',
  general: 'General Assumptions'
};

const CATEGORY_DESCRIPTIONS: { [key: string]: string } = {
  revenue: 'Core revenue assumptions including TAM, penetration targets, and growth parameters',
  pricing: 'Pricing tiers, discounts, and annual price escalation settings',
  customers: 'Customer acquisition targets, growth curves, and market penetration',
  churn: 'Customer churn rates, retention targets, and churn reduction schedules',
  opex: 'Operating expense assumptions including burn rates and cost structures',
  personnel: 'Hiring plans, compensation, and headcount assumptions',
  funding: 'Fundraising rounds, valuation assumptions, and capital requirements',
  equity: 'Founder ownership, option pools, and dilution parameters',
  general: 'Other scenario-specific assumptions and configuration'
};

export default function VariablesPage() {
  const searchParams = useSearchParams();
  const scenarioId = searchParams.get('scenarioId') || 'b0000000-0000-0000-0000-000000000001';

  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [grouped, setGrouped] = useState<AssumptionGroup>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('revenue');
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [newValue, setNewValue] = useState<string>('');

  useEffect(() => {
    fetchAssumptions();
  }, [scenarioId]);

  const fetchAssumptions = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/assumptions?scenarioId=${scenarioId}`);
      const data = await res.json();

      if (res.ok) {
        setAssumptions(data.assumptions);
        setGrouped(data.grouped);
      } else {
        console.error('Failed to fetch assumptions:', data.error);
      }
    } catch (error) {
      console.error('Error fetching assumptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (assumption: Assumption) => {
    setEditingKey(assumption.key);
    setNewValue(assumption.value);
  };

  const handleSave = async (key: string, category: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/assumptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId,
          key,
          value: newValue,
          category,
        }),
      });

      if (res.ok) {
        await fetchAssumptions();
        setEditingKey(null);
        setNewValue('');
      } else {
        const data = await res.json();
        console.error('Failed to save assumption:', data.error);
      }
    } catch (error) {
      console.error('Error saving assumption:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditingKey(null);
    setNewValue('');
  };

  const formatKey = (key: string): string => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatValue = (value: string, key: string): string => {
    // Try to format as number with appropriate suffix
    const num = parseFloat(value);
    if (isNaN(num)) return value;

    // Check if it's a percentage (between 0 and 1 or explicitly marked)
    if (key.includes('percent') || key.includes('rate') || key.includes('margin') || key.includes('growth')) {
      if (num <= 1) {
        return `${(num * 100).toFixed(2)}%`;
      }
      return `${num.toFixed(2)}%`;
    }

    // Check if it's a dollar amount
    if (key.includes('arr') || key.includes('revenue') || key.includes('price') || key.includes('fee') || key.includes('cost')) {
      return `$${num.toLocaleString()}`;
    }

    // Check if it's a count
    if (key.includes('customers') || key.includes('users') || key.includes('count') || key.includes('headcount')) {
      return num.toLocaleString();
    }

    // Default number formatting
    return num.toLocaleString();
  };

  const categories = Object.keys(grouped).sort();

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-6"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-12"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-800 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Variables & Assumptions
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Configure key assumptions and parameters for your financial model
          </p>
        </div>

        {/* Category Navigation */}
        <div className="mb-8 border-b border-gray-200 dark:border-gray-800">
          <nav className="flex space-x-8 overflow-x-auto">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeCategory === category
                    ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }`}
              >
                {CATEGORY_LABELS[category] || category}
              </button>
            ))}
          </nav>
        </div>

        {/* Category Description */}
        {CATEGORY_DESCRIPTIONS[activeCategory] && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              {CATEGORY_DESCRIPTIONS[activeCategory]}
            </p>
          </div>
        )}

        {/* Assumptions Table */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Variable
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Current Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {grouped[activeCategory]?.map((assumption) => (
                <tr key={assumption.key} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                    {formatKey(assumption.key)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                    {editingKey === assumption.key ? (
                      <input
                        type="text"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                        className="w-full px-3 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        autoFocus
                      />
                    ) : (
                      <span className="font-mono">{formatValue(assumption.value, assumption.key)}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {assumption.description || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {editingKey === assumption.key ? (
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleSave(assumption.key, assumption.category)}
                          disabled={saving}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          disabled={saving}
                          className="px-3 py-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEdit(assumption)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {(!grouped[activeCategory] || grouped[activeCategory].length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No assumptions in this category yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-sm text-gray-500 dark:text-gray-400">
          <p>
            💡 <strong>Tip:</strong> Changes to variables will automatically recalculate all dependent projections.
            Percentage values should be entered as decimals (e.g., 0.15 for 15%).
          </p>
        </div>
      </div>
    </div>
  );
}

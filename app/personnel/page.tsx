'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getDefaultPersonnelRoles, PersonnelRole } from '@/lib/calculations/personnel';
import { TableSkeleton } from '@/components/skeletons/TableSkeleton';
import { ErrorState } from '@/components/ErrorState';
import { Spinner } from '@/components/skeletons/Spinner';

const DEFAULT_SCENARIO_ID = 'b0000000-0000-0000-0000-000000000001';

export default function PersonnelPage() {
  const [roles, setRoles] = useState<PersonnelRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadRoles();
  }, []);

  async function loadRoles() {
    try {
      setError(null);
      const response = await fetch(`/api/personnel?scenarioId=${DEFAULT_SCENARIO_ID}`);
      if (!response.ok) throw new Error('Failed to load personnel roles');
      const data = await response.json();

      if (data.roles && data.roles.length > 0) {
        setRoles(data.roles);
      } else {
        // Load default roles from Excel
        setRoles(getDefaultPersonnelRoles());
      }
    } catch (error) {
      console.error('Error loading roles:', error);
      setError(error instanceof Error ? error : new Error('Failed to load personnel roles'));
      // Fallback to defaults on error
      setRoles(getDefaultPersonnelRoles());
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/personnel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: DEFAULT_SCENARIO_ID,
          roles,
        }),
      });

      if (response.ok) {
        setMessage('✅ Personnel roles saved successfully!');

        // Trigger OPEX recalculation
        await fetch('/api/opex/projections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scenarioId: DEFAULT_SCENARIO_ID,
            startMonth: 1,
            endMonth: 36,
          }),
        });

        setMessage('✅ Personnel roles saved and OPEX projections updated!');
      } else {
        setMessage('❌ Error saving personnel roles');
      }
    } catch (error) {
      console.error('Error saving roles:', error);
      setMessage('❌ Error saving personnel roles');
    } finally {
      setSaving(false);
    }
  }

  function updateRole(index: number, field: keyof PersonnelRole, value: string | number) {
    const newRoles = [...roles];
    if (field === 'baseSalary' || field === 'startMonth') {
      newRoles[index][field] = typeof value === 'string' ? parseFloat(value) : value;
    } else if (field === 'roleName') {
      newRoles[index][field] = value as string;
    } else if (field === 'endMonth') {
      newRoles[index][field] = value ? (typeof value === 'string' ? parseFloat(value) : value) : undefined;
    }
    setRoles(newRoles);
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded w-64 animate-pulse" />
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <TableSkeleton rows={15} columns={4} />
          <div className="mt-6 flex gap-4">
            <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
            <div className="h-12 w-48 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 pb-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Personnel Planning</h1>
            <p className="text-gray-600 mt-2">Configure personnel roles, salaries, and start dates</p>
          </div>
          <Link href="/" className="px-4 py-2 border rounded-lg hover:bg-gray-50">
            ← Back
          </Link>
        </div>

        {message && (
          <div className={`p-4 mb-6 rounded-lg ${message.includes('✅') ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {message}
          </div>
        )}

        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">Role Name</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Base Salary</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Start Month</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">End Month</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {roles.map((role, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={role.roleName}
                      onChange={(e) => updateRole(index, 'roleName', e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={role.baseSalary}
                      onChange={(e) => updateRole(index, 'baseSalary', e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      step="1000"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={role.startMonth}
                      onChange={(e) => updateRole(index, 'startMonth', e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      min="1"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={role.endMonth || ''}
                      onChange={(e) => updateRole(index, 'endMonth', e.target.value)}
                      className="w-full px-2 py-1 border rounded"
                      min="1"
                      placeholder="120"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-medium flex items-center gap-2"
          >
            {saving && <Spinner size="sm" className="text-white" />}
            {saving ? 'Saving...' : 'Save & Calculate'}
          </button>

          <Link
            href="/dashboard"
            className="px-6 py-3 border rounded-lg hover:bg-gray-50 font-medium inline-block"
          >
            View Dashboard →
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-800">ℹ️ Notes</h3>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• Base salaries are annual amounts</li>
            <li>• Benefits multiplier of 1.4x is automatically applied</li>
            <li>• Start month: When the role begins (1-120)</li>
            <li>• End month: When the role ends (optional, defaults to 120)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

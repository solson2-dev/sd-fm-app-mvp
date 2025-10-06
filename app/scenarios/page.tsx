'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

const DEFAULT_ORG_ID = 'a0000000-0000-0000-0000-000000000001';
const DEFAULT_USER_ID = '30099033-b36b-4f7f-aaa8-6dc26b98f799';

interface Scenario {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export default function ScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newScenarioName, setNewScenarioName] = useState('');
  const [newScenarioDescription, setNewScenarioDescription] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadScenarios();
  }, []);

  async function loadScenarios() {
    try {
      const response = await fetch(
        `/api/scenarios?organizationId=${DEFAULT_ORG_ID}`
      );
      const data = await response.json();

      if (data.scenarios) {
        setScenarios(data.scenarios);
      }
    } catch (error) {
      console.error('Error loading scenarios:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createScenario() {
    if (!newScenarioName.trim()) return;

    setCreating(true);
    try {
      const response = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationId: DEFAULT_ORG_ID,
          name: newScenarioName,
          description: newScenarioDescription || null,
          createdBy: DEFAULT_USER_ID,
        }),
      });

      if (response.ok) {
        setNewScenarioName('');
        setNewScenarioDescription('');
        setShowCreateModal(false);
        await loadScenarios();
      }
    } catch (error) {
      console.error('Error creating scenario:', error);
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center">
        <div className="text-xl">Loading scenarios...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Scenarios</h1>
            <p className="text-gray-600 mt-2">
              Manage and compare different financial scenarios
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
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              + New Scenario
            </button>
          </div>
        </div>

        {/* Scenarios List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map((scenario) => (
            <div
              key={scenario.id}
              className="bg-white border rounded-lg p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-xl font-semibold mb-2">{scenario.name}</h3>
              {scenario.description && (
                <p className="text-gray-600 text-sm mb-4">
                  {scenario.description}
                </p>
              )}
              <div className="text-xs text-gray-500 mb-4">
                Created {new Date(scenario.created_at).toLocaleDateString()}
              </div>
              <div className="flex gap-2">
                <Link
                  href={`/scenarios/${scenario.id}`}
                  className="flex-1 px-3 py-2 text-center bg-blue-50 text-blue-700 rounded hover:bg-blue-100"
                >
                  View
                </Link>
                <button className="flex-1 px-3 py-2 border rounded hover:bg-gray-50">
                  Edit
                </button>
              </div>
            </div>
          ))}

          {scenarios.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-500">
              No scenarios yet. Create your first scenario to get started!
            </div>
          )}
        </div>

        {/* Comparison Section */}
        {scenarios.length >= 2 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-4">Compare Scenarios</h2>
            <Link
              href="/scenarios/compare"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Compare Side-by-Side →
            </Link>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-2xl font-bold mb-4">Create New Scenario</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Scenario Name *
                </label>
                <input
                  type="text"
                  value={newScenarioName}
                  onChange={(e) => setNewScenarioName(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  placeholder="e.g., Conservative Growth"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <textarea
                  value={newScenarioDescription}
                  onChange={(e) => setNewScenarioDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded"
                  rows={3}
                  placeholder="Optional description..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewScenarioName('');
                  setNewScenarioDescription('');
                }}
                className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                disabled={creating}
              >
                Cancel
              </button>
              <button
                onClick={createScenario}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                disabled={!newScenarioName.trim() || creating}
              >
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

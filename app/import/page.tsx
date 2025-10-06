'use client';

/**
 * Excel Import Page
 *
 * Complete UI for importing Excel files with preview and validation
 */

import React, { useState } from 'react';
import { FileUpload } from '@/app/components/excel/FileUpload';
import type { ImportPreview, ValidationError, ValidationWarning } from '@/lib/excel/types';

type ImportStep = 'upload' | 'preview' | 'importing' | 'complete';

export default function ImportPage() {
  const [step, setStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<any>(null);

  // These would come from context or props in production
  const scenarioId = 'b0000000-0000-0000-0000-000000000001';
  const organizationId = 'a0000000-0000-0000-0000-000000000001';

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    setError(null);
    setIsLoading(true);

    try {
      // Call preview API
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('scenarioId', scenarioId);
      formData.append('organizationId', organizationId);

      const response = await fetch('/api/excel/preview', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to preview file');
      }

      setPreview(data.preview);
      setStep('preview');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to preview file');
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!file) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setStep('importing');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('scenarioId', scenarioId);
      formData.append('organizationId', organizationId);
      formData.append('mode', importMode);

      const response = await fetch('/api/excel/import', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Import failed');
      }

      setImportResult(data);
      setStep('complete');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
      setStep('preview');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    window.open('/api/excel/template', '_blank');
  };

  const handleReset = () => {
    setStep('upload');
    setFile(null);
    setPreview(null);
    setError(null);
    setImportResult(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Import Financial Data</h1>
        <p className="text-gray-600">
          Upload an Excel file to import assumptions, revenue, OPEX, personnel, and funding data
        </p>
      </div>

      {/* Download Template Button */}
      <div className="mb-6">
        <button
          onClick={handleDownloadTemplate}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Download Template
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <h3 className="text-sm font-medium text-red-800 mb-1">Error</h3>
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          <FileUpload onFileSelect={handleFileSelect} disabled={isLoading} />
          {isLoading && (
            <div className="text-center py-4">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">Processing file...</p>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && preview && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Import Preview</h2>

            {/* File Info */}
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium text-gray-900 mb-2">File Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">File name:</span>{' '}
                  <span className="font-medium">{preview.workbookData.metadata.fileName}</span>
                </div>
                <div>
                  <span className="text-gray-600">Sheets found:</span>{' '}
                  <span className="font-medium">{preview.workbookData.metadata.sheets.join(', ')}</span>
                </div>
              </div>
            </div>

            {/* Data Summary */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Data Summary</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <DataSummaryCard
                  title="Assumptions"
                  count={preview.workbookData.assumptions.length}
                  icon="📊"
                />
                <DataSummaryCard
                  title="Revenue"
                  count={preview.workbookData.revenueProjections.length}
                  icon="💰"
                />
                <DataSummaryCard
                  title="OPEX"
                  count={preview.workbookData.opexProjections.length}
                  icon="📉"
                />
                <DataSummaryCard
                  title="Personnel"
                  count={preview.workbookData.personnelRoles.length}
                  icon="👥"
                />
                <DataSummaryCard
                  title="Funding"
                  count={preview.workbookData.fundingRounds.length}
                  icon="💵"
                />
              </div>
            </div>

            {/* Validation Results */}
            {preview.validation.errors.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-red-800 mb-3">Validation Errors</h3>
                <div className="space-y-2">
                  {preview.validation.errors.map((error, index) => (
                    <ValidationErrorDisplay key={index} error={error} />
                  ))}
                </div>
              </div>
            )}

            {preview.validation.warnings.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-yellow-800 mb-3">Warnings</h3>
                <div className="space-y-2">
                  {preview.validation.warnings.map((warning, index) => (
                    <ValidationWarningDisplay key={index} warning={warning} />
                  ))}
                </div>
              </div>
            )}

            {/* Conflicts */}
            {preview.conflicts && preview.conflicts.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-orange-800 mb-3">Potential Conflicts</h3>
                <div className="space-y-2">
                  {preview.conflicts.map((conflict, index) => (
                    <div key={index} className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                      <p className="text-sm text-orange-700">{conflict.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Mode Selection */}
            {preview.validation.isValid && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Import Mode</h3>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="merge"
                      checked={importMode === 'merge'}
                      onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">Merge</div>
                      <div className="text-sm text-gray-600">
                        Add new data and update existing records (recommended)
                      </div>
                    </div>
                  </label>
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={(e) => setImportMode(e.target.value as 'merge' | 'replace')}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div>
                      <div className="font-medium">Replace</div>
                      <div className="text-sm text-gray-600">
                        Delete all existing data and import fresh (caution!)
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex space-x-4">
              <button
                onClick={handleReset}
                className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {preview.validation.isValid && (
                <button
                  onClick={handleImport}
                  disabled={isLoading}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Importing...' : 'Import Data'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mb-4"></div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">Importing Data...</h2>
          <p className="text-gray-600">Please wait while we import your data</p>
        </div>
      )}

      {/* Step 4: Complete */}
      {step === 'complete' && importResult && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Import Complete!</h2>
            <p className="text-gray-600">Your data has been successfully imported</p>
          </div>

          {/* Import Summary */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Import Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <DataSummaryCard
                title="Assumptions"
                count={importResult.summary.recordsImported.assumptions}
                icon="📊"
              />
              <DataSummaryCard
                title="Revenue"
                count={importResult.summary.recordsImported.revenueProjections}
                icon="💰"
              />
              <DataSummaryCard
                title="OPEX"
                count={importResult.summary.recordsImported.opexProjections}
                icon="📉"
              />
              <DataSummaryCard
                title="Personnel"
                count={importResult.summary.recordsImported.personnelRoles}
                icon="👥"
              />
              <DataSummaryCard
                title="Funding"
                count={importResult.summary.recordsImported.fundingRounds}
                icon="💵"
              />
            </div>
          </div>

          <div className="text-sm text-gray-600 mb-6">
            Import completed in {(importResult.summary.duration / 1000).toFixed(2)} seconds
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              onClick={handleReset}
              className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Import Another File
            </button>
            <a
              href="/dashboard"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Go to Dashboard
            </a>
          </div>
        </div>
      )}
    </div>
  );
}

// Helper Components

function DataSummaryCard({ title, count, icon }: { title: string; count: number; icon: string }) {
  return (
    <div className="p-4 bg-gray-50 rounded-md text-center">
      <div className="text-2xl mb-2">{icon}</div>
      <div className="text-2xl font-bold text-gray-900">{count}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
}

function ValidationErrorDisplay({ error }: { error: ValidationError }) {
  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-red-800">
            {error.sheet && `${error.sheet} - `}
            {error.field}
            {error.row && ` (Row ${error.row})`}
          </p>
          <p className="text-sm text-red-700 mt-1">{error.message}</p>
        </div>
      </div>
    </div>
  );
}

function ValidationWarningDisplay({ warning }: { warning: ValidationWarning }) {
  return (
    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
      <div className="flex items-start">
        <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
        <div className="flex-1">
          <p className="text-sm font-medium text-yellow-800">
            {warning.sheet && `${warning.sheet} - `}
            {warning.field}
            {warning.row && ` (Row ${warning.row})`}
          </p>
          <p className="text-sm text-yellow-700 mt-1">{warning.message}</p>
        </div>
      </div>
    </div>
  );
}

'use client';

/**
 * Global Error Boundary
 *
 * This error boundary catches errors thrown in:
 * - Root layout (app/layout.tsx)
 * - Global components that crash before route-level error boundaries can catch them
 * - Errors in error.tsx itself
 *
 * IMPORTANT: This must render its own <html> and <body> tags
 * because it replaces the entire root layout when an error occurs.
 */

import Link from 'next/link';

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  // Log error details for debugging (in production, send to error tracking service)
  if (typeof window !== 'undefined') {
    console.error('Global error caught by global error boundary:', error);
  }

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
          <div className="max-w-lg w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-8 shadow-xl">
            <div className="flex items-center gap-4 mb-6">
              <div className="flex-shrink-0">
                <svg
                  className="w-12 h-12 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  Application Error
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  A critical error occurred
                </p>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-gray-700 dark:text-gray-300 mb-3">
                The application encountered a critical error and needs to reload.
                Your work may not have been saved.
              </p>

              {error.message && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded p-3 mb-3">
                  <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                    Error details:
                  </p>
                  <p className="text-xs text-red-700 dark:text-red-300 font-mono">
                    {error.message}
                  </p>
                </div>
              )}

              {error.digest && (
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
                  Reference ID: {error.digest}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Reload application
              </button>

              <Link
                href="/"
                className="block w-full px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-center font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Return to home page
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                If this problem persists, please contact support and provide the reference ID above.
              </p>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}

'use client';

/**
 * Route Segment Error Boundary
 *
 * This error boundary catches errors thrown in:
 * - Page components
 * - Route handlers within this segment
 * - Client components in this route
 *
 * Errors in layout.tsx or global components are caught by global-error.tsx
 */

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function Error({ error, reset }: ErrorProps) {
  // Log error details for debugging (in production, send to error tracking service)
  if (typeof window !== 'undefined') {
    console.error('Route error caught by error boundary:', error);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950 p-8">
      <div className="max-w-md w-full bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <svg
            className="w-6 h-6 text-red-600 dark:text-red-400"
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
          <h2 className="text-xl font-bold text-red-900 dark:text-red-100">
            Something went wrong
          </h2>
        </div>

        <p className="text-red-700 dark:text-red-300 mb-4 text-sm">
          {error.message || 'An unexpected error occurred while loading this page.'}
        </p>

        {error.digest && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-4 font-mono bg-red-100 dark:bg-red-900/30 p-2 rounded">
            Error ID: {error.digest}
          </p>
        )}

        <div className="flex gap-3">
          <button
            onClick={reset}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Try again
          </button>
          <a
            href="/"
            className="flex-1 px-4 py-2 border border-red-600 dark:border-red-400 text-red-600 dark:text-red-400 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-center focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          >
            Go home
          </a>
        </div>

        <div className="mt-4 pt-4 border-t border-red-200 dark:border-red-800">
          <p className="text-xs text-red-600 dark:text-red-400">
            If this problem persists, please contact support with the error ID above.
          </p>
        </div>
      </div>
    </div>
  );
}

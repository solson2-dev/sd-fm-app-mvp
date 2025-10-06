interface ErrorStateProps {
  error?: Error | string;
  onRetry?: () => void;
  title?: string;
  className?: string;
}

export function ErrorState({
  error,
  onRetry,
  title = 'Something went wrong',
  className = ''
}: ErrorStateProps) {
  const errorMessage = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred';

  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-200">{title}</h3>
          <div className="mt-2 text-sm text-red-700 dark:text-red-300">{errorMessage}</div>
          {onRetry && (
            <div className="mt-4">
              <button
                onClick={onRetry}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

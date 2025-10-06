'use client';

import { Component, ReactNode } from 'react';

/**
 * Chart Error Boundary Component
 *
 * This component-level error boundary is designed to catch errors in:
 * - Chart rendering components (Recharts, custom charts)
 * - Data visualization components
 * - Any component that might fail due to data issues
 *
 * Usage:
 * ```tsx
 * <ChartErrorBoundary fallback={<CustomErrorUI />}>
 *   <MyChart data={data} />
 * </ChartErrorBoundary>
 * ```
 *
 * Benefits:
 * 1. Prevents entire page from crashing when a single chart fails
 * 2. Shows graceful error message in place of broken chart
 * 3. Logs error details for debugging
 * 4. Allows rest of the page to function normally
 */

interface ChartErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ChartErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ChartErrorBoundary extends Component<
  ChartErrorBoundaryProps,
  ChartErrorBoundaryState
> {
  constructor(props: ChartErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ChartErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details for debugging
    console.error('Chart error caught by ChartErrorBoundary:', error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to an error tracking service:
    // logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render custom fallback if provided, otherwise use default
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="p-6 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5"
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
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Unable to render chart
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                There was an error displaying this visualization. Please refresh the page or check your data.
              </p>
              {this.state.error?.message && (
                <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2 font-mono bg-yellow-100 dark:bg-yellow-900/30 p-2 rounded">
                  {this.state.error.message}
                </p>
              )}
              <button
                onClick={() => window.location.reload()}
                className="mt-3 text-sm text-yellow-800 dark:text-yellow-200 underline hover:no-underline focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
              >
                Refresh page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based alternative for functional components that need error boundaries
 * Note: This is a wrapper component, not a true hook
 */
export function withChartErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
): React.FC<P> {
  return function WithErrorBoundary(props: P) {
    return (
      <ChartErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ChartErrorBoundary>
    );
  };
}

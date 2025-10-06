import type { SaveStatus } from '@/hooks/useAutoSave';

interface SaveStatusIndicatorProps {
  status: SaveStatus;
}

export function SaveStatusIndicator({ status }: SaveStatusIndicatorProps) {
  if (status === 'idle') return null;

  const statusConfig = {
    saving: {
      text: 'Saving...',
      icon: (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ),
      className: 'text-blue-600 dark:text-blue-400',
    },
    saved: {
      text: 'Saved',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
      className: 'text-green-600 dark:text-green-400',
    },
    error: {
      text: 'Error saving',
      icon: (
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      className: 'text-red-600 dark:text-red-400',
    },
  };

  const config = statusConfig[status];

  return (
    <div className={`flex items-center gap-2 text-sm ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  );
}

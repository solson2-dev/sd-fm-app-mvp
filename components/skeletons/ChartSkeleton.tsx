export function ChartSkeleton({ height = 300 }: { height?: number }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-6 animate-pulse">
      <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded w-1/4 mb-4" />
      <div
        className="bg-gray-200 dark:bg-gray-800 rounded"
        style={{ height: `${height}px` }}
      >
        <div className="flex items-end justify-around h-full p-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="w-8 bg-gray-300 dark:bg-gray-700 rounded-t"
              style={{ height: `${Math.random() * 60 + 40}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

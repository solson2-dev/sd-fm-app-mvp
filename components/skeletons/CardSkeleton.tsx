export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg animate-pulse"
        >
          <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3 mb-2" />
          <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-2/3 mb-1" />
          <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2" />
        </div>
      ))}
    </>
  );
}

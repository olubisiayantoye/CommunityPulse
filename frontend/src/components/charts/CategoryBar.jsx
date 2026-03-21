/**
 * Category Bar Chart - CommunityPulse
 * Horizontal bar chart for category distribution
 */

export function CategoryBar({ categories = [], feedback = [] }) {
  const data = categories.map(cat => {
    const count = feedback.filter(f => f.category_id === cat.id).length;
    return { ...cat, count };
  }).filter(c => c.count > 0).sort((a, b) => b.count - a.count);

  if (data.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No category data available
      </div>
    );
  }

  const maxCount = Math.max(...data.map(d => d.count));

  return (
    <div className="space-y-3">
      {data.slice(0, 5).map((cat, index) => (
        <div key={index} className="flex items-center gap-3">
          <span className="text-sm text-gray-700 dark:text-gray-300 w-24 truncate">{cat.name}</span>
          <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
            <div
              className="h-4 rounded-full transition-all"
              style={{ 
                width: `${(cat.count / maxCount) * 100}%`,
                backgroundColor: cat.color || '#3B82F6'
              }}
            />
          </div>
          <span className="text-sm font-medium text-gray-900 dark:text-white w-8 text-right">
            {cat.count}
          </span>
        </div>
      ))}
      {data.length > 5 && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          + {data.length - 5} more categories
        </p>
      )}
    </div>
  );
}
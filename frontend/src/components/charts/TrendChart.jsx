/**
 * Trend Chart Component - CommunityPulse
 * Simple bar chart showing 7-day feedback trends
 */

export function TrendChart({ feedback = [] }) {
  // Generate last 7 days dates
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return date.toISOString().split('T')[0];
  });

  // Aggregate feedback by day
  const chartData = last7Days.map((date) => {
    const dayFeedback = feedback.filter((f) => f.created_at?.startsWith(date));
    return {
      date,
      label: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
      count: dayFeedback.length,
      positive: dayFeedback.filter((f) => f.sentiment_label === 'Positive').length,
      negative: dayFeedback.filter((f) => f.sentiment_label === 'Negative').length,
    };
  });

  // Find max count for scaling bars
  const maxCount = Math.max(...chartData.map((d) => d.count), 1);

  // No data state
  if (chartData.every((d) => d.count === 0)) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No feedback data available for the last 7 days
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Bar Chart */}
      <div className="flex items-end justify-between gap-2 h-40">
        {chartData.map((day, index) => (
          <div key={index} className="flex-1 flex flex-col items-center gap-1">
            {/* Bars container */}
            <div className="w-full flex flex-col items-center gap-px">
              {/* Positive bar */}
              {day.positive > 0 && (
                <div
                  className="w-full bg-green-500 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(day.positive / maxCount) * 100}px`,
                    minHeight: '4px',
                  }}
                  title={`Positive: ${day.positive}`}
                />
              )}
              {/* Negative bar */}
              {day.negative > 0 && (
                <div
                  className="w-full bg-red-500 rounded-t transition-all hover:opacity-80"
                  style={{
                    height: `${(day.negative / maxCount) * 100}px`,
                    minHeight: '4px',
                  }}
                  title={`Negative: ${day.negative}`}
                />
              )}
              {/* Empty state bar */}
              {day.count === 0 && (
                <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded" />
              )}
            </div>
            {/* Day label */}
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {day.label}
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-xs">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-green-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Positive</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 bg-red-500 rounded" />
          <span className="text-gray-600 dark:text-gray-400">Negative</span>
        </div>
      </div>
    </div>
  );
}

// ✅ Single export only - no duplicates
export default TrendChart;
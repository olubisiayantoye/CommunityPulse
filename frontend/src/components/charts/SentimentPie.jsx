/**
 * Sentiment Pie Chart - CommunityPulse
 * Simple SVG pie chart for sentiment distribution
 */

import { useMemo } from 'react';

export function SentimentPie({ data }) {
  const { positive, neutral, negative, total } = data;

  const segments = useMemo(() => {
    if (!total || total === 0) return [];

    const segments = [];
    let currentAngle = 0;

    const colors = {
      positive: '#10B981',
      neutral: '#F59E0B',
      negative: '#EF4444'
    };

    const values = [
      { label: 'Positive', value: positive, color: colors.positive },
      { label: 'Neutral', value: neutral, color: colors.neutral },
      { label: 'Negative', value: negative, color: colors.negative }
    ];

    values.forEach(({ label, value, color }) => {
      if (value > 0) {
        const percentage = (value / total) * 100;
        const angle = (percentage / 100) * 360;
        
        segments.push({
          label,
          value,
          percentage,
          color,
          startAngle: currentAngle,
          endAngle: currentAngle + angle
        });
        
        currentAngle += angle;
      }
    });

    return segments;
  }, [positive, neutral, negative, total]);

  if (!total || total === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-500 dark:text-gray-400">
        No data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Pie Chart */}
      <div className="flex justify-center">
        <svg viewBox="0 0 100 100" className="w-40 h-40 md:w-48 md:h-48">
          {segments.map((segment, index) => {
            const startRad = (segment.startAngle - 90) * (Math.PI / 180);
            const endRad = (segment.endAngle - 90) * (Math.PI / 180);
            
            const x1 = 50 + 40 * Math.cos(startRad);
            const y1 = 50 + 40 * Math.sin(startRad);
            const x2 = 50 + 40 * Math.cos(endRad);
            const y2 = 50 + 40 * Math.sin(endRad);
            
            const largeArc = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
            
            const pathData = [
              `M 50 50`,
              `L ${x1} ${y1}`,
              `A 40 40 0 ${largeArc} 1 ${x2} ${y2}`,
              `Z`
            ].join(' ');

            return (
              <path
                key={index}
                d={pathData}
                fill={segment.color}
                className="transition-opacity hover:opacity-80"
              >
                <title>{segment.label}: {segment.percentage.toFixed(1)}%</title>
              </path>
            );
          })}
          {/* Center circle for donut effect */}
          <circle cx="50" cy="50" r="20" fill="white" className="dark:fill-gray-800" />
        </svg>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {segments.map((segment, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-center gap-1">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: segment.color }}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {segment.label}
              </span>
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {segment.percentage.toFixed(0)}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
import { DateTime } from 'luxon';
import { useMemo } from 'react';
import { Bar, BarChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { CalendarEvent } from '@/lib/nanit-api';

interface WeeklyFeedChartProps {
  allEvents: CalendarEvent[];
  weekStart: DateTime;
  onPrevWeek: () => void;
  onNextWeek: () => void;
}

export function WeeklyFeedChart({
  allEvents,
  weekStart,
  onPrevWeek,
  onNextWeek,
}: WeeklyFeedChartProps) {
  const weekEnd = weekStart.plus({ days: 7 }).minus({ seconds: 1 });

  // Check if we're on the current week
  const now = DateTime.now();
  const currentWeekStart = now.startOf('week').minus({ days: 1 }); // Get Sunday of current week
  const isCurrentWeek = weekStart.hasSame(currentWeekStart, 'day');

  const chartData = useMemo(() => {
    // Create 168 hourly buckets (7 days × 24 hours)
    const buckets: Array<{
      hourTimestamp: number;
      ml: number;
      hour: number;
      dayOfWeek: number;
    }> = [];

    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const hourStart = weekStart.plus({ days: day, hours: hour });
        buckets.push({
          hourTimestamp: hourStart.toUnixInteger(),
          ml: 0,
          hour,
          dayOfWeek: hourStart.weekday % 7, // Convert to 0=Sunday
        });
      }
    }

    // Fill buckets with feed data
    const feeds = allEvents.filter((e) => e.type === 'bottle_feed');

    for (const feed of feeds) {
      const feedTime = DateTime.fromSeconds(feed.time);

      // Only include feeds in this week
      if (feedTime < weekStart || feedTime > weekEnd) continue;

      // Find the matching hour bucket
      const feedHourStart = feedTime.startOf('hour');
      const bucket = buckets.find((b) => b.hourTimestamp === feedHourStart.toUnixInteger());

      if (bucket) {
        bucket.ml += feed.feed_amount || 0;
      }
    }

    return buckets;
  }, [allEvents, weekStart, weekEnd]);

  const hasData = chartData.some((d) => d.ml > 0);

  // Calculate 12am and 12pm timestamps for reference lines
  const referenceLines = useMemo(() => {
    const lines: number[] = [];
    for (let day = 0; day < 7; day++) {
      const midnight = weekStart.plus({ days: day, hours: 0 }).toUnixInteger();
      const noon = weekStart.plus({ days: day, hours: 12 }).toUnixInteger();
      lines.push(midnight, noon);
    }
    return lines;
  }, [weekStart]);

  const formatDateRange = () => {
    const start = weekStart.toFormat('MMM d');
    const end = weekEnd.toFormat('MMM d');
    return `${start} - ${end}`;
  };

  const mlToOz = (ml: number) => (ml / 29.5735).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
      {/* Header with navigation */}
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">🍼 Weekly Feed Chart</h3>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-1.5 hover:bg-gray-100 rounded transition"
            aria-label="Previous week"
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="prev-week-icon"
            >
              <title id="prev-week-icon">Previous week</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 min-w-[140px] text-center">
            {formatDateRange()}
          </span>
          <button
            type="button"
            onClick={onNextWeek}
            disabled={isCurrentWeek}
            className={`p-1.5 rounded transition ${
              isCurrentWeek ? 'text-gray-300 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label="Next week"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="next-week-icon"
            >
              <title id="next-week-icon">Next week</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200"></div>

      {/* Chart or empty state */}
      {!hasData ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p className="text-sm">No feeds this week</p>
        </div>
      ) : (
        <div className="pt-4">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 30 }}>
              <XAxis
                dataKey="hourTimestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="linear"
                ticks={chartData
                  .filter((d) => d.hour === 0 || d.hour === 12)
                  .map((d) => d.hourTimestamp)}
                tick={(props) => {
                  const { x, y, payload } = props;
                  const dt = DateTime.fromSeconds(payload.value);
                  const hour = dt.hour;

                  // Show day name at midnight (hour 0)
                  if (hour === 0) {
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={15} textAnchor="middle" fill="#6b7280" fontSize={11}>
                          {dt.toFormat('EEE d')}
                        </text>
                      </g>
                    );
                  }

                  // Show "12pm" at noon (hour 12)
                  if (hour === 12) {
                    return (
                      <g transform={`translate(${x},${y})`}>
                        <text x={0} y={15} textAnchor="middle" fill="#6b7280" fontSize={11}>
                          12pm
                        </text>
                      </g>
                    );
                  }

                  return null;
                }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
                height={60}
                interval={0}
                minTickGap={0}
              />
              <YAxis
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                label={{
                  value: 'ml',
                  angle: -90,
                  position: 'insideLeft',
                  style: { fill: '#6b7280', fontSize: 12 },
                }}
              />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;

                  const hourTime = DateTime.fromSeconds(data.hourTimestamp);
                  const displayTime = hourTime.toFormat('EEE @ h:mm a');

                  if (!data.ml || data.ml === 0) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium text-gray-900">{displayTime}</p>
                        <p className="text-sm text-gray-500">No feeds this hour</p>
                      </div>
                    );
                  }

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                      <p className="text-sm font-medium text-gray-900">{displayTime}</p>
                      <p className="text-sm font-semibold text-blue-600">
                        {Math.round(data.ml)}ml ({mlToOz(data.ml)}oz)
                      </p>
                    </div>
                  );
                }}
              />
              {/* Reference lines at 12am and 12pm each day */}
              {referenceLines.map((timestamp) => (
                <ReferenceLine
                  key={timestamp}
                  x={timestamp}
                  stroke="#d1d5db"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              ))}
              <Bar dataKey="ml" fill="#3b82f6" radius={[2, 2, 0, 0]} barSize={6} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import {
  Bar,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { CalendarEvent } from '@/api';

interface WeeklyFeedChartProps {
  allEvents: CalendarEvent[];
  weekStart: DateTime;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  isLoading?: boolean;
}

export function WeeklyFeedChart({
  allEvents,
  weekStart,
  onPrevWeek,
  onNextWeek,
  isLoading = false,
}: WeeklyFeedChartProps) {
  const weekEnd = weekStart.plus({ days: 7 }).minus({ seconds: 1 });
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');

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

    // Add avgMl property to each bucket (will be calculated later)
    return buckets.map((b) => ({ ...b, avgMl: null as number | null }));
  }, [allEvents, weekStart, weekEnd]);

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

  // Calculate average feed amount per 12-hour period and add to chart data
  const chartDataWithAvg = useMemo(() => {
    const dataWithAvg = [...chartData];

    for (let day = 0; day < 7; day++) {
      // Morning period (12am - 12pm)
      const morningStart = weekStart.plus({ days: day, hours: 0 }).toUnixInteger();
      const morningEnd = weekStart.plus({ days: day, hours: 12 }).toUnixInteger();
      const morningData = dataWithAvg.filter(
        (d) => d.hourTimestamp >= morningStart && d.hourTimestamp < morningEnd,
      );
      const morningTotal = morningData.reduce((sum, d) => sum + d.ml, 0);
      const morningCount = morningData.filter((d) => d.ml > 0).length;
      const morningAvg = morningCount > 0 ? morningTotal / morningCount : 0;

      // Afternoon/Evening period (12pm - 12am)
      const eveningStart = weekStart.plus({ days: day, hours: 12 }).toUnixInteger();
      const eveningEnd = weekStart.plus({ days: day + 1, hours: 0 }).toUnixInteger();
      const eveningData = dataWithAvg.filter(
        (d) => d.hourTimestamp >= eveningStart && d.hourTimestamp < eveningEnd,
      );
      const eveningTotal = eveningData.reduce((sum, d) => sum + d.ml, 0);
      const eveningCount = eveningData.filter((d) => d.ml > 0).length;
      const eveningAvg = eveningCount > 0 ? eveningTotal / eveningCount : 0;

      // Fill average for morning period
      if (morningAvg > 0) {
        for (const point of dataWithAvg) {
          if (point.hourTimestamp >= morningStart && point.hourTimestamp < morningEnd) {
            point.avgMl = morningAvg;
          }
        }
      }

      // Fill average for evening period
      if (eveningAvg > 0) {
        for (const point of dataWithAvg) {
          if (point.hourTimestamp >= eveningStart && point.hourTimestamp < eveningEnd) {
            point.avgMl = eveningAvg;
          }
        }
      }
    }

    return dataWithAvg;
  }, [chartData, weekStart]);

  const hasData = chartDataWithAvg.some((d) => d.ml > 0);

  const formatDateRange = () => {
    const start = weekStart.toFormat('MMM d');
    const end = weekEnd.toFormat('MMM d');
    return `${start} - ${end}`;
  };

  const mlToOz = (ml: number) => (ml / 29.5735).toFixed(1);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      {/* Header with navigation */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">🍼 Weekly Feed Chart</h3>
        <div className="flex items-center gap-2">
          {/* Unit toggle */}
          <div className="flex gap-1 mr-2">
            <button
              type="button"
              onClick={() => setUnit('ml')}
              className={`px-2 py-1 text-xs font-medium rounded transition ${
                unit === 'ml'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              ml
            </button>
            <button
              type="button"
              onClick={() => setUnit('oz')}
              className={`px-2 py-1 text-xs font-medium rounded transition ${
                unit === 'oz'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              oz
            </button>
          </div>
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
                isCurrentWeek
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-700 hover:bg-gray-100'
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
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-200"></div>

      {/* Chart or empty state */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-500">Loading chart...</p>
          </div>
        </div>
      ) : !hasData ? (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p className="text-sm">No feeds this week</p>
        </div>
      ) : (
        <div className="pt-2">
          <ResponsiveContainer width="100%" height={400}>
            <ComposedChart
              data={chartDataWithAvg}
              margin={{ top: 5, right: 5, left: 5, bottom: 35 }}
            >
              <XAxis
                dataKey="hourTimestamp"
                type="number"
                domain={['dataMin', 'dataMax']}
                scale="linear"
                ticks={chartDataWithAvg
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
                tick={({ x, y, payload }) => {
                  const value = unit === 'oz' ? mlToOz(payload.value) : payload.value;
                  return (
                    <text x={x} y={y} textAnchor="end" fill="#6b7280" fontSize={11} dy={4}>
                      {value}
                      {unit}
                    </text>
                  );
                }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload;

                  const hourTime = DateTime.fromSeconds(data.hourTimestamp);
                  const displayTime = hourTime.toFormat('EEE @ h:mm a');

                  const avgValue = data.avgMl
                    ? unit === 'oz'
                      ? `${mlToOz(data.avgMl)}oz (${Math.round(data.avgMl)}ml)`
                      : `${Math.round(data.avgMl)}ml (${mlToOz(data.avgMl)}oz)`
                    : null;

                  if (!data.ml || data.ml === 0) {
                    return (
                      <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                        <p className="text-sm font-medium text-gray-900 mb-2">{displayTime}</p>
                        <p className="text-sm text-gray-500">No feeds this hour</p>
                        {avgValue && <p className="text-sm text-amber-600">12hr avg: {avgValue}</p>}
                      </div>
                    );
                  }

                  const displayValue =
                    unit === 'oz'
                      ? `${mlToOz(data.ml)}oz (${Math.round(data.ml)}ml)`
                      : `${Math.round(data.ml)}ml (${mlToOz(data.ml)}oz)`;

                  return (
                    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg">
                      <p className="text-sm font-medium text-gray-900 mb-2">{displayTime}</p>
                      <p className="text-sm font-semibold text-blue-600">{displayValue}</p>
                      {avgValue && <p className="text-sm text-amber-600">12hr avg: {avgValue}</p>}
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
              <Line
                dataKey="avgMl"
                stroke="#f59e0b"
                strokeWidth={2}
                dot={false}
                connectNulls={false}
                type="monotone"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

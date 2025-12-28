import { DateTime } from 'luxon';
import { useEffect, useState } from 'react';
import type { CalendarEvent } from '@/api';
import { DailyFeedChart } from './DailyFeedChart';
import { WeeklyFeedChart } from './WeeklyFeedChart';

interface FeedChartProps {
  allEvents: CalendarEvent[];
  weekStart: DateTime;
  dayStart: DateTime;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onPrevDay: () => void;
  onNextDay: () => void;
  isLoading?: boolean;
}

export function FeedChart({
  allEvents,
  weekStart,
  dayStart,
  onPrevWeek,
  onNextWeek,
  onPrevDay,
  onNextDay,
  isLoading = false,
}: FeedChartProps) {
  // Default to daily on mobile, weekly on desktop
  const [view, setView] = useState<'daily' | 'weekly'>(() => {
    return window.innerWidth < 640 ? 'daily' : 'weekly';
  });
  const [unit, setUnit] = useState<'ml' | 'oz'>('ml');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const now = DateTime.now();
  // Get Sunday of the week containing today
  const currentWeekStart =
    now.weekday === 7 ? now.startOf('day') : now.startOf('week').minus({ days: 1 });
  // Disable next if we're already viewing the current week (the week that contains today)
  const isCurrentOrFutureWeek = weekStart >= currentWeekStart;
  const isToday = dayStart.hasSame(now, 'day');

  const formatDateRange = () => {
    if (view === 'daily') {
      return dayStart.toFormat('MMM d, yyyy');
    }
    const weekEnd = weekStart.plus({ days: 7 }).minus({ seconds: 1 });
    const start = weekStart.toFormat('MMM d');
    const end = weekEnd.toFormat('MMM d');
    return `${start} - ${end}`;
  };

  const handlePrev = () => {
    if (view === 'daily') {
      onPrevDay();
    } else {
      onPrevWeek();
    }
  };

  const handleNext = () => {
    if (view === 'daily') {
      onNextDay();
    } else {
      onNextWeek();
    }
  };

  const isNextDisabled = view === 'daily' ? isToday : isCurrentOrFutureWeek;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 md:p-4 shadow-sm">
      {/* Header with all controls */}
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900">🍼 Feed Chart</h3>

        {isMobile ? (
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 hover:bg-gray-100 rounded transition"
              aria-label="Chart settings"
            >
              <svg
                className="w-5 h-5 text-gray-700"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                role="img"
                aria-labelledby="settings-icon"
              >
                <title id="settings-icon">Settings</title>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="p-2">
                  <div className="mb-2">
                    <p className="text-xs text-gray-500 mb-1 px-2">View</p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setView('daily')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
                          view === 'daily'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Daily
                      </button>
                      <button
                        type="button"
                        onClick={() => setView('weekly')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
                          view === 'weekly'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        Weekly
                      </button>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1 px-2">Unit</p>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setUnit('ml')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
                          unit === 'ml'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        ml
                      </button>
                      <button
                        type="button"
                        onClick={() => setUnit('oz')}
                        className={`flex-1 px-2 py-1 text-xs font-medium rounded transition ${
                          unit === 'oz'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        oz
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setView('daily')}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  view === 'daily'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Daily
              </button>
              <button
                type="button"
                onClick={() => setView('weekly')}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  view === 'weekly'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                Weekly
              </button>
            </div>
            {/* Unit toggle */}
            <div className="flex gap-1">
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
          </div>
        )}
      </div>

      {/* Centered date navigation */}
      <div className="mb-3 flex justify-center">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handlePrev}
            className="p-1.5 hover:bg-gray-100 rounded transition"
            aria-label={view === 'daily' ? 'Previous day' : 'Previous week'}
          >
            <svg
              className="w-5 h-5 text-gray-700"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="prev-icon"
            >
              <title id="prev-icon">{view === 'daily' ? 'Previous day' : 'Previous week'}</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span className="text-xs sm:text-sm font-medium text-gray-700 min-w-[120px] sm:min-w-[140px] text-center">
            {formatDateRange()}
          </span>
          <button
            type="button"
            onClick={handleNext}
            disabled={isNextDisabled}
            className={`p-1.5 rounded transition ${
              isNextDisabled
                ? 'text-gray-300 cursor-not-allowed'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
            aria-label={view === 'daily' ? 'Next day' : 'Next week'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="next-icon"
            >
              <title id="next-icon">{view === 'daily' ? 'Next day' : 'Next week'}</title>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <div className="border-t border-gray-200 mb-2"></div>

      {/* Render appropriate chart */}
      <div className="pt-2">
        {view === 'daily' ? (
          <DailyFeedChart
            allEvents={allEvents}
            dayStart={dayStart}
            unit={unit}
            isLoading={isLoading}
          />
        ) : (
          <WeeklyFeedChart
            allEvents={allEvents}
            weekStart={weekStart}
            unit={unit}
            isLoading={isLoading}
          />
        )}
      </div>
    </div>
  );
}

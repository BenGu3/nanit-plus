import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useEffect, useMemo, useState } from 'react';
import { nanitAPI } from '@/api';
import { FeedChart } from '@/components/FeedChart';

export function Dashboard() {
  const [timeRange, setTimeRange] = useState<12 | 24>(12);

  // Add a refresh key that updates to trigger "now" recalculation
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastBlurTime, setLastBlurTime] = useState<number | null>(null);

  // Week navigation state - start with current week (Sunday-Saturday)
  const [weekStart, setWeekStart] = useState(() => {
    const now = DateTime.now();
    // Get Sunday of current week - if today is Sunday (weekday 7), use today, otherwise get previous Sunday
    return now.weekday === 7 ? now.startOf('day') : now.startOf('week').minus({ days: 1 });
  });

  // Day navigation state - start with today
  const [dayStart, setDayStart] = useState(() => DateTime.now().startOf('day'));

  // Listen for window focus/blur to update refresh key only if away for >1 minute
  useEffect(() => {
    const handleBlur = () => {
      setLastBlurTime(Date.now());
    };

    const handleFocus = () => {
      if (lastBlurTime !== null) {
        const timeAway = Date.now() - lastBlurTime;
        const oneMinute = 60 * 1000;

        if (timeAway > oneMinute) {
          setRefreshKey((prev) => prev + 1);
        }
      }
    };

    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    return () => {
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, [lastBlurTime]);

  const { data: babiesData } = useQuery({
    queryKey: ['babies'],
    queryFn: () => nanitAPI.getBabies(),
    refetchOnWindowFocus: true,
  });

  const babyUid = babiesData?.babies[0]?.uid;

  // Calculate time range for recent data - recalculate on refresh
  // Fetch last 7 days to find last poop, but only show 12/24hr for cards
  // Use a stable query key so cached data is preserved when refetching
  const {
    data: recentCalendarData,
    isLoading: isLoadingRecent,
    isFetching: isFetchingRecent,
  } = useQuery({
    queryKey: ['calendar', 'recent', babyUid],
    queryFn: () => {
      if (!babyUid) throw new Error('No baby UID');
      const currentTime = DateTime.now();
      const recentStartTime = currentTime.minus({ days: 7 }).toUnixInteger();
      const recentEndTime = currentTime.toUnixInteger();
      return nanitAPI.getCalendar(babyUid, recentStartTime, recentEndTime);
    },
    enabled: !!babyUid,
    staleTime: 0, // Always consider data stale to refetch on focus
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnWindowFocus: true,
  });

  // Recalculate 'now' whenever refreshKey changes to update all "time ago" displays
  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshKey intentionally triggers recalculation
  const now = useMemo(() => DateTime.now(), [refreshKey]);

  // Fetch data for the selected week/day for the chart
  // Need to cover both weekStart and dayStart ranges
  const { chartStartTime, chartEndTime } = useMemo(() => {
    const weekEnd = weekStart.plus({ days: 7 });
    const dayEnd = dayStart.plus({ days: 1 });

    // Get the earliest start and latest end between week and day ranges
    const earliestStart = weekStart < dayStart ? weekStart : dayStart;
    const latestEnd = weekEnd > dayEnd ? weekEnd : dayEnd;

    return {
      chartStartTime: earliestStart.toUnixInteger(),
      chartEndTime: latestEnd.toUnixInteger(),
    };
  }, [weekStart, dayStart]);

  const { data: chartCalendarData, isFetching: isFetchingChart } = useQuery({
    queryKey: ['calendar', 'chart', babyUid, chartStartTime, chartEndTime],
    queryFn: () => {
      if (!babyUid) throw new Error('No baby UID');
      return nanitAPI.getCalendar(babyUid, chartStartTime, chartEndTime);
    },
    enabled: !!babyUid,
    staleTime: 0, // Always consider data stale to refetch on focus
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnWindowFocus: true,
  });

  const handlePrevWeek = () => {
    setWeekStart((prev) => prev.minus({ weeks: 1 }));
  };

  const handleNextWeek = () => {
    setWeekStart((prev) => prev.plus({ weeks: 1 }));
  };

  const handlePrevDay = () => {
    setDayStart((prev) => prev.minus({ days: 1 }));
  };

  const handleNextDay = () => {
    setDayStart((prev) => prev.plus({ days: 1 }));
  };

  // Get events from recent data for diapers/feeds cards
  const recentEvents = recentCalendarData?.calendar || [];

  // Get events from chart data (covers both week and day ranges)
  const chartEvents = chartCalendarData?.calendar || [];

  const lastPoop = useMemo(() => {
    const poop = recentEvents
      .filter(
        (e) => e.type === 'diaper_change' && (e.change_type === 'poo' || e.change_type === 'mixed'),
      )
      .sort((a, b) => b.time - a.time)[0];

    // Only return if it's within the last 7 days, otherwise return undefined for N/A
    if (poop) {
      const poopTime = DateTime.fromSeconds(poop.time);
      const weekAgo = now.minus({ days: 7 });
      if (poopTime >= weekAgo) {
        return poop;
      }
    }
    return undefined;
  }, [recentEvents, now]);

  const lastFeed = useMemo(() => {
    return recentEvents.filter((e) => e.type === 'bottle_feed').sort((a, b) => b.time - a.time)[0];
  }, [recentEvents]);

  // Memoize filtered events to prevent re-filtering on time range change
  const { diapers, feeds } = useMemo(() => {
    const cutoff = now.minus({ hours: timeRange }).toUnixInteger();

    const diaperChanges = recentEvents
      .filter((e) => e.time >= cutoff && e.type === 'diaper_change')
      .sort((a, b) => b.time - a.time);

    const bottleFeeds = recentEvents
      .filter((e) => e.time >= cutoff && e.type === 'bottle_feed')
      .sort((a, b) => b.time - a.time);

    return { diapers: diaperChanges, feeds: bottleFeeds };
  }, [recentEvents, timeRange, now]);

  const totalFeedMl = useMemo(
    () => feeds.reduce((sum, feed) => sum + (feed.feed_amount || 0), 0),
    [feeds],
  );

  const totalFeedOz = (totalFeedMl / 29.5735).toFixed(1);

  const formatTimeSince = (timestamp: number) => {
    const eventTime = DateTime.fromSeconds(timestamp);
    const diff = now.diff(eventTime, ['days', 'hours', 'minutes']).toObject();

    const days = Math.floor(diff.days || 0);
    const hours = Math.floor(diff.hours || 0);
    const minutes = Math.floor(diff.minutes || 0);

    if (days >= 1) {
      return `${days}d ${hours}h ago`;
    }
    return `${hours}h ${minutes}m ago`;
  };

  const formatExactTime = (timestamp: number) => {
    const dt = DateTime.fromSeconds(timestamp);
    const daysAgo = Math.floor(now.diff(dt, 'days').days);

    let dateStr: string;
    if (daysAgo < 7) {
      // Within last 7 days - show day of week
      dateStr = dt.toFormat('EEE'); // Mon, Tue, Wed, etc.
    } else {
      // Older than 7 days - show month + day
      dateStr = dt.toFormat('MMM d');
    }

    const time = dt.toFormat('h:mm a');
    return `${dateStr} @ ${time}`;
  };

  const getDiaperEmoji = (changeType?: string) => {
    if (changeType === 'pee') return '💧';
    if (changeType === 'poo') return '💩';
    if (changeType === 'mixed') return '💧💩';
    if (changeType === 'dry') return '🌵';
    return '?';
  };

  const mlToOz = (ml: number) => (ml / 29.5735).toFixed(1);

  const formatTimeDiff = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const calculateAverageInterval = (events: typeof diapers | typeof feeds) => {
    if (events.length < 2) return null;
    const intervals = [];
    for (let i = 0; i < events.length - 1; i++) {
      intervals.push(events[i].time - events[i + 1].time);
    }
    const avgSeconds = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return formatTimeDiff(avgSeconds);
  };

  // Show full page loading only on very first load (when data doesn't exist)
  // This includes:
  // 1. When we don't have a babyUid yet (calendar queries can't even start)
  // 2. When calendar data is loading without cached data
  if (!babyUid || (isLoadingRecent && !recentCalendarData)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <main className="container mx-auto p-3 md:p-8">
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimeRange(12)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                timeRange === 12
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              12h
            </button>
            <button
              type="button"
              onClick={() => setTimeRange(24)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                timeRange === 24
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              24h
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Feeds Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm">
              <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-shrink-0">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {isFetchingRecent ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <span>🍼</span>
                    )}
                    Feeds ({feeds.length})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {totalFeedMl}ml ({totalFeedOz}oz)
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="text-center border border-gray-200 dark:border-gray-600 rounded-md py-1.5 px-2.5 bg-gray-50 dark:bg-gray-700 flex-1 sm:flex-initial min-w-24">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Avg Interval</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {feeds.length > 1 ? calculateAverageInterval(feeds) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center border border-gray-200 dark:border-gray-600 rounded-md py-1.5 px-2.5 bg-gray-50 dark:bg-gray-700 flex-1 sm:flex-initial min-w-24">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Last Feed</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {lastFeed ? formatTimeSince(lastFeed.time) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <div className="space-y-1 pt-2">
                {feeds.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    No feeds in this period
                  </p>
                ) : (
                  feeds.map((feed, index) => (
                    <div key={feed.id}>
                      <div className="flex items-center text-xs sm:text-sm gap-2 min-h-8">
                        <span className="text-gray-700 dark:text-gray-300 w-20 sm:w-32 flex-shrink-0">
                          {feed.feed_amount}ml ({mlToOz(feed.feed_amount || 0)}oz)
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 flex-1 min-w-0 truncate sm:truncate-none">
                          {formatExactTime(feed.time)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-right w-24 sm:w-32 flex-shrink-0">
                          {formatTimeSince(feed.time)}
                        </span>
                      </div>
                      {index < feeds.length - 1 && (
                        <div className="relative my-2">
                          <div className="border-b border-gray-200 dark:border-gray-700"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTimeDiff(feed.time - feeds[index + 1].time)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Diapers Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 md:p-6 shadow-sm">
              <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="flex-shrink-0">
                  <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    {isFetchingRecent ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    ) : (
                      <span>🐣</span>
                    )}
                    Diapers ({diapers.length})
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    last poop: {lastPoop ? formatTimeSince(lastPoop.time) : 'N/A'}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <div className="text-center border border-gray-200 dark:border-gray-600 rounded-md py-1.5 px-2.5 bg-gray-50 dark:bg-gray-700 flex-1 sm:flex-initial min-w-24">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Avg Interval</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {diapers.length > 1 ? calculateAverageInterval(diapers) : 'N/A'}
                    </p>
                  </div>
                  <div className="text-center border border-gray-200 dark:border-gray-600 rounded-md py-1.5 px-2.5 bg-gray-50 dark:bg-gray-700 flex-1 sm:flex-initial min-w-24">
                    <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">Last Change</p>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {diapers.length > 0 ? formatTimeSince(diapers[0].time) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700"></div>
              <div className="space-y-1 pt-2">
                {diapers.length === 0 ? (
                  <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                    No diaper changes in this period
                  </p>
                ) : (
                  diapers.map((event, index) => (
                    <div key={event.id}>
                      <div className="flex items-center text-xs sm:text-sm gap-2 min-h-8">
                        <span className="text-gray-700 dark:text-gray-300 w-20 sm:w-32 text-sm flex-shrink-0">
                          {getDiaperEmoji(event.change_type)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 flex-1 min-w-0 truncate sm:truncate-none">
                          {formatExactTime(event.time)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-right w-24 sm:w-32 flex-shrink-0">
                          {formatTimeSince(event.time)}
                        </span>
                      </div>
                      {index < diapers.length - 1 && (
                        <div className="relative my-2">
                          <div className="border-b border-gray-200 dark:border-gray-700"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 px-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              {formatTimeDiff(event.time - diapers[index + 1].time)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Feed Chart */}
          <FeedChart
            allEvents={chartEvents}
            weekStart={weekStart}
            dayStart={dayStart}
            onPrevWeek={handlePrevWeek}
            onNextWeek={handleNextWeek}
            onPrevDay={handlePrevDay}
            onNextDay={handleNextDay}
            isLoading={isFetchingChart}
          />
        </div>
      </main>
    </div>
  );
}

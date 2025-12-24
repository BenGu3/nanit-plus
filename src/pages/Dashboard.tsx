import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanitAPI } from '@/lib/nanit-api';

export function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<12 | 24>(12);

  const { data: babiesData } = useQuery({
    queryKey: ['babies'],
    queryFn: () => nanitAPI.getBabies(),
  });

  const babyUid = babiesData?.babies[0]?.uid;

  const now = DateTime.now();
  const startTime = now.minus({ days: 7 }).toUnixInteger();
  const endTime = now.toUnixInteger();

  const { data: calendarData, isLoading } = useQuery({
    queryKey: ['calendar', babyUid, startTime, endTime],
    queryFn: () => {
      if (!babyUid) throw new Error('No baby UID');
      return nanitAPI.getCalendar(babyUid, startTime, endTime);
    },
    enabled: !!babyUid,
  });

  const handleSignOut = () => {
    nanitAPI.clearToken();
    navigate('/sign-in');
  };

  // Get all events for last poop/feed calculation
  const allEvents = calendarData?.calendar || [];

  const lastPoop = useMemo(() => {
    return allEvents
      .filter(
        (e) =>
          e.type === 'diaper_change' && (e.change_type === 'poop' || e.change_type === 'mixed'),
      )
      .sort((a, b) => b.time - a.time)[0];
  }, [allEvents]);

  const lastFeed = useMemo(() => {
    return allEvents.filter((e) => e.type === 'bottle_feed').sort((a, b) => b.time - a.time)[0];
  }, [allEvents]);

  // Memoize filtered events to prevent re-filtering on time range change
  const { diapers, feeds } = useMemo(() => {
    const cutoff = now.minus({ hours: timeRange }).toUnixInteger();

    const diaperChanges = allEvents
      .filter((e) => e.time >= cutoff && e.type === 'diaper_change')
      .sort((a, b) => b.time - a.time);

    const bottleFeeds = allEvents
      .filter((e) => e.time >= cutoff && e.type === 'bottle_feed')
      .sort((a, b) => b.time - a.time);

    return { diapers: diaperChanges, feeds: bottleFeeds };
  }, [allEvents, timeRange, now]);

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
    if (changeType === 'poop') return '💩';
    if (changeType === 'mixed') return '💧💩';
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Nanit Insights</h1>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-gray-600 hover:text-gray-900 transition"
          >
            Sign Out
          </button>
        </div>
      </header>

      <main className="container mx-auto p-3 md:p-8">
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimeRange(12)}
              className={`px-3 py-1.5 text-sm font-medium rounded transition ${
                timeRange === 12
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
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
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              24h
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Diapers Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-shrink-0">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                  🐣 Diapers ({diapers.length})
                </h3>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="text-center border border-gray-200 rounded-md py-1.5 px-2.5 bg-gray-50 flex-1 sm:flex-initial min-w-24">
                  <p className="text-xs text-gray-400 mb-0.5">Last Poop</p>
                  <p className="text-sm font-medium text-gray-700">
                    {lastPoop ? formatTimeSince(lastPoop.time) : 'N/A'}
                  </p>
                </div>
                <div className="text-center border border-gray-200 rounded-md py-1.5 px-2.5 bg-gray-50 flex-1 sm:flex-initial min-w-24">
                  <p className="text-xs text-gray-400 mb-0.5">Avg Interval</p>
                  <p className="text-sm font-medium text-gray-700">
                    {diapers.length > 1 ? calculateAverageInterval(diapers) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200"></div>
            <div className="space-y-1 pt-2">
              {diapers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">
                  No diaper changes in this period
                </p>
              ) : (
                <>
                  {diapers.map((event, index) => (
                    <div key={event.id}>
                      <div className="flex items-center text-xs sm:text-sm gap-2 min-h-8">
                        <span className="text-gray-700 w-20 sm:w-32 text-sm flex-shrink-0">
                          {getDiaperEmoji(event.change_type)}
                        </span>
                        <span className="text-gray-500 flex-1 min-w-0 truncate sm:truncate-none">
                          {formatExactTime(event.time)}
                        </span>
                        <span className="text-gray-500 text-right w-24 sm:w-32 flex-shrink-0">
                          {formatTimeSince(event.time)}
                        </span>
                      </div>
                      {index < diapers.length - 1 && (
                        <div className="relative my-2">
                          <div className="border-b border-gray-200"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white px-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeDiff(event.time - diapers[index + 1].time)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>

          {/* Feeds Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 shadow-sm">
            <div className="mb-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-shrink-0">
                <h3 className="text-xl md:text-2xl font-bold text-gray-900">
                  🍼 Feeds ({feeds.length})
                </h3>
                <p className="text-sm text-gray-600">
                  {totalFeedMl}ml ({totalFeedOz}oz)
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <div className="text-center border border-gray-200 rounded-md py-1.5 px-2.5 bg-gray-50 flex-1 sm:flex-initial min-w-24">
                  <p className="text-xs text-gray-400 mb-0.5">Last Feed</p>
                  <p className="text-sm font-medium text-gray-700">
                    {lastFeed ? formatTimeSince(lastFeed.time) : 'N/A'}
                  </p>
                </div>
                <div className="text-center border border-gray-200 rounded-md py-1.5 px-2.5 bg-gray-50 flex-1 sm:flex-initial min-w-24">
                  <p className="text-xs text-gray-400 mb-0.5">Avg Interval</p>
                  <p className="text-sm font-medium text-gray-700">
                    {feeds.length > 1 ? calculateAverageInterval(feeds) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-200"></div>
            <div className="space-y-1 pt-2">
              {feeds.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">No feeds in this period</p>
              ) : (
                <>
                  {feeds.map((feed, index) => (
                    <div key={feed.id}>
                      <div className="flex items-center text-xs sm:text-sm gap-2 min-h-8">
                        <span className="text-gray-700 w-20 sm:w-32 flex-shrink-0">
                          {feed.feed_amount}ml ({mlToOz(feed.feed_amount || 0)}oz)
                        </span>
                        <span className="text-gray-500 flex-1 min-w-0 truncate sm:truncate-none">
                          {formatExactTime(feed.time)}
                        </span>
                        <span className="text-gray-500 text-right w-24 sm:w-32 flex-shrink-0">
                          {formatTimeSince(feed.time)}
                        </span>
                      </div>
                      {index < feeds.length - 1 && (
                        <div className="relative my-2">
                          <div className="border-b border-gray-200"></div>
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 bg-white px-2">
                            <span className="text-xs text-gray-400">
                              {formatTimeDiff(feed.time - feeds[index + 1].time)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

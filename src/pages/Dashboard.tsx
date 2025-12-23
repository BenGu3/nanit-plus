import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanitAPI } from '@/lib/nanit-api';

export function Dashboard() {
  const navigate = useNavigate();
  const [timeRange, setTimeRange] = useState<12 | 24>(24);

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

  // Memoize filtered events to prevent re-filtering on time range change
  const { diapers, feeds } = useMemo(() => {
    const events = calendarData?.calendar || [];
    const cutoff = now.minus({ hours: timeRange }).toUnixInteger();

    const diaperChanges = events
      .filter((e) => e.time >= cutoff && e.type === 'diaper_change')
      .sort((a, b) => b.time - a.time);

    const bottleFeeds = events
      .filter((e) => e.time >= cutoff && e.type === 'bottle_feed')
      .sort((a, b) => b.time - a.time);

    return { diapers: diaperChanges, feeds: bottleFeeds };
  }, [calendarData, timeRange, now]);

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
    return DateTime.fromSeconds(timestamp).toLocaleString(DateTime.DATETIME_MED);
  };

  const getDiaperEmoji = (changeType?: string) => {
    if (changeType === 'pee') return '💧';
    if (changeType === 'poop') return '💩';
    if (changeType === 'mixed') return '💧💩';
    return '?';
  };

  const mlToOz = (ml: number) => (ml / 29.5735).toFixed(1);

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

      <main className="container mx-auto p-4 md:p-8">
        <div className="flex justify-end items-center mb-6">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTimeRange(12)}
              className={`px-4 py-2 text-sm font-medium rounded transition ${
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
              className={`px-4 py-2 text-sm font-medium rounded transition ${
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
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🐣 Diapers ({diapers.length})</h3>
              <div className="text-right">
                <p className="text-xs text-gray-400">💩 last poop</p>
                <p className="text-sm text-gray-600">
                  {(() => {
                    const lastPoop = diapers.find(
                      (e) => e.change_type === 'poop' || e.change_type === 'mixed',
                    );
                    return lastPoop ? formatTimeSince(lastPoop.time) : 'N/A';
                  })()}
                </p>
              </div>
            </div>
            <div className="space-y-2 border-t border-gray-200 pt-4">
              {diapers.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">
                  No diaper changes in this period
                </p>
              ) : (
                diapers.map((event) => (
                  <div key={event.id} className="flex items-center text-sm gap-3">
                    <span className="text-gray-700 w-12">{getDiaperEmoji(event.change_type)}</span>
                    <span className="text-gray-500 flex-1">{formatExactTime(event.time)}</span>
                    <span className="text-gray-500 text-right min-w-28">
                      {formatTimeSince(event.time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Feeds Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">🍼 Feeds ({feeds.length})</h3>
              <div className="text-right">
                <p className="text-xs text-gray-400">{totalFeedOz}oz</p>
                <p className="text-sm text-gray-600">{totalFeedMl}ml</p>
              </div>
            </div>
            <div className="space-y-2 border-t border-gray-200 pt-4">
              {feeds.length === 0 ? (
                <p className="text-gray-500 text-sm text-center">No feeds in this period</p>
              ) : (
                feeds.map((feed) => (
                  <div key={feed.id} className="flex items-center text-sm gap-3">
                    <span className="text-gray-700 w-32">
                      {feed.feed_amount}ml ({mlToOz(feed.feed_amount || 0)}oz)
                    </span>
                    <span className="text-gray-500 flex-1">{formatExactTime(feed.time)}</span>
                    <span className="text-gray-500 text-right min-w-28">
                      {formatTimeSince(feed.time)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

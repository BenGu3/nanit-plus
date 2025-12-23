import { useQuery } from '@tanstack/react-query';
import { DateTime } from 'luxon';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanitAPI } from '@/lib/nanit-api';

export function Dashboard() {
  const navigate = useNavigate();
  const [feedTimeRange, setFeedTimeRange] = useState<12 | 24>(24);
  const [showFeedDetails, setShowFeedDetails] = useState(false);

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

  const events = calendarData?.calendar || [];

  // Filter events
  const poops = events
    .filter(
      (e) => e.type === 'diaper_change' && (e.change_type === 'poop' || e.change_type === 'mixed'),
    )
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  const pees = events
    .filter((e) => e.type === 'diaper_change' && e.change_type === 'pee')
    .sort((a, b) => b.time - a.time)
    .slice(0, 5);

  const feedCutoff = now.minus({ hours: feedTimeRange }).toUnixInteger();
  const feeds = events
    .filter((e) => e.type === 'bottle_feed' && e.time >= feedCutoff)
    .sort((a, b) => b.time - a.time);

  const totalFeedMl = feeds.reduce((sum, feed) => sum + (feed.feed_amount || 0), 0);
  const totalFeedOz = (totalFeedMl / 29.5735).toFixed(1);

  const formatTimeSince = (timestamp: number) => {
    const eventTime = DateTime.fromSeconds(timestamp);
    const diff = now.diff(eventTime, ['days', 'hours']).toObject();

    if (diff.days && diff.days >= 1) {
      return `${Math.floor(diff.days)}d ago`;
    }
    return `${Math.floor(diff.hours || 0)}h ago`;
  };

  const mlToOz = (ml: number) => (ml / 29.5735).toFixed(1);

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
        <h2 className="text-3xl font-bold text-gray-900 mb-6">Dashboard</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Poops Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Poops</h3>
            {poops.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent poops</p>
            ) : (
              <div className="space-y-2">
                {poops.map((event) => (
                  <div key={event.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{event.change_type}</span>
                    <span className="text-gray-500">{formatTimeSince(event.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pees Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Pees</h3>
            {pees.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent pees</p>
            ) : (
              <div className="space-y-2">
                {pees.map((event) => (
                  <div key={event.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">pee</span>
                    <span className="text-gray-500">{formatTimeSince(event.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Feeds Card */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Feed Volume</h3>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFeedTimeRange(12)}
                  className={`px-3 py-1 text-sm rounded ${
                    feedTimeRange === 12
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  12h
                </button>
                <button
                  type="button"
                  onClick={() => setFeedTimeRange(24)}
                  className={`px-3 py-1 text-sm rounded ${
                    feedTimeRange === 24
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  24h
                </button>
              </div>
            </div>

            <div className="mb-4">
              <p className="text-3xl font-bold text-gray-900">
                {totalFeedMl}ml
                <span className="text-lg font-normal text-gray-500"> ({totalFeedOz}oz)</span>
              </p>
              <p className="text-sm text-gray-500">{feeds.length} feeds</p>
            </div>

            <button
              type="button"
              onClick={() => setShowFeedDetails(!showFeedDetails)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              {showFeedDetails ? 'Hide details' : 'Show details'}
            </button>

            {showFeedDetails && (
              <div className="mt-4 space-y-2 border-t border-gray-200 pt-4">
                {feeds.map((feed) => (
                  <div key={feed.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">
                      {feed.feed_amount}ml ({mlToOz(feed.feed_amount || 0)}oz)
                    </span>
                    <span className="text-gray-500">{formatTimeSince(feed.time)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

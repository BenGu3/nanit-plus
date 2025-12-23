import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { nanitAPI } from '@/lib/nanit-api';

export function Home() {
  const navigate = useNavigate();

  const { data, isLoading, error } = useQuery({
    queryKey: ['babies'],
    queryFn: () => nanitAPI.getBabies(),
    retry: false,
  });

  const handleSignOut = () => {
    nanitAPI.clearToken();
    navigate('/signin');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading baby data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white border border-gray-200 rounded-lg p-8 shadow-sm text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-600 mb-6">
            {error instanceof Error ? error.message : 'Failed to load data'}
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  const babies = data?.babies || [];

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

      <main className="container mx-auto p-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome!</h2>
          <p className="text-gray-600 mb-8">
            Successfully authenticated with Nanit. Here's your baby data:
          </p>

          <div className="space-y-4">
            {babies.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm text-center">
                <p className="text-gray-600">No babies found in your account.</p>
              </div>
            ) : (
              babies.map((baby) => (
                <div
                  key={baby.uid}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-semibold text-gray-900 mb-2">
                        {baby.first_name} {baby.last_name || ''}
                      </h3>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">UID:</span> {baby.uid}
                        </p>
                        {baby.birthday && (
                          <p>
                            <span className="font-medium">Birthday:</span> {baby.birthday}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="mt-8 bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Authentication Successful! 🎉
            </h3>
            <p className="text-sm text-gray-700">
              You've successfully signed in and retrieved your baby data from the Nanit API. Next
              steps: add care activity tracking and insights!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

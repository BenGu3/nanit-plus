import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { nanitAPI } from '@/api';

export function SignIn() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'mfa'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user already has a token on mount
  useEffect(() => {
    const token = nanitAPI.getToken();
    if (token) {
      // User already has a token, redirect to home
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Email/password step
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // MFA step
  const [mfaToken, setMfaToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [channel, setChannel] = useState('');
  const [phoneSuffix, setPhoneSuffix] = useState('');

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await nanitAPI.login(email, password);

      if (response.mfa_token) {
        // MFA required
        setMfaToken(response.mfa_token);
        setChannel(response.channel || '');
        setPhoneSuffix(response.phone_suffix || '');
        setStep('mfa');
      } else if (response.access_token || response.token) {
        // Direct login (unlikely but handle it)
        navigate('/');
      } else {
        setError('Unexpected response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await nanitAPI.verifyMFA(email, password, mfaToken, mfaCode, channel);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'MFA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-gray-200 rounded-lg p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Nanit+</h1>

          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium mb-2">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                  placeholder="••••••••"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-md text-sm border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleMfaSubmit} className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-md mb-4">
                <p className="text-sm text-gray-700">
                  MFA code sent via <span className="font-semibold">{channel}</span>
                  {phoneSuffix && (
                    <>
                      {' '}
                      to phone ending in <span className="font-semibold">{phoneSuffix}</span>
                    </>
                  )}
                </p>
              </div>

              <div>
                <label htmlFor="mfaCode" className="block text-sm font-medium mb-2">
                  Verification Code
                </label>
                <input
                  id="mfaCode"
                  type="text"
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder:text-gray-400"
                  placeholder="Enter code"
                />
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 border border-red-200 px-4 py-3 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setStep('email');
                    setMfaCode('');
                    setError(null);
                  }}
                  className="flex-1 border py-2 rounded-md font-medium border-gray-300 hover:bg-gray-50 transition"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-md font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Verifying...' : 'Verify'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

import { Link, useLocation, useNavigate } from 'react-router-dom';
import { nanitAPI } from '@/api';

export function Navigation() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    nanitAPI.clearToken();
    navigate('/sign-in');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="border-b border-gray-200 bg-white">
      <div className="px-4 py-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Nanit+</h1>

        <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-6">
          <Link
            to="/"
            className={`flex items-center gap-2 transition cursor-pointer ${
              isActive('/')
                ? 'text-blue-600 font-bold'
                : 'text-gray-700 hover:text-gray-900 font-medium'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="home-icon"
            >
              <title id="home-icon">Home</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Home
          </Link>
          <Link
            to="/formula-calculator"
            className={`flex items-center gap-2 transition cursor-pointer ${
              isActive('/formula-calculator')
                ? 'text-blue-600 font-bold'
                : 'text-gray-700 hover:text-gray-900 font-medium'
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              role="img"
              aria-labelledby="tools-icon"
            >
              <title id="tools-icon">Tools</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
              />
            </svg>
            Tools
          </Link>
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            role="img"
            aria-labelledby="signout-icon"
          >
            <title id="signout-icon">Sign Out</title>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>
    </header>
  );
}

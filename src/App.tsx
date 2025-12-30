import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { nanitAPI } from '@/api';
import { Navigation } from '@/components/Navigation';
import { Dashboard } from '@/pages/Dashboard';
import { FormulaCalculator } from '@/pages/FormulaCalculator';
import { SignIn } from '@/pages/SignIn';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = nanitAPI.getToken();
  if (!token) {
    return <Navigate to="/sign-in" replace />;
  }
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/sign-in" element={<SignIn />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tools"
            element={
              <ProtectedRoute>
                <FormulaCalculator />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;

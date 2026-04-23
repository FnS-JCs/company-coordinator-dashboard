import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { DevBanner } from './components/DevBanner';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import CompanyDetail from './pages/CompanyDetail';
import { toolRoutes } from './tools/index';
import { useAuth } from './context/AuthContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode; requireAdmin?: boolean }> = ({ children, requireAdmin }) => {
  const { user, devRole, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-gray-100">Loading...</div>;
  }

  if (!user && !devRole) {
    return <Navigate to="/login" replace />;
  }

  if (requireAdmin && devRole !== 'admin' && user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AutoRefreshProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const FIVE_MINUTES = 5 * 60 * 1000;
    const interval = setInterval(() => {
      const currentPath = window.location.pathname;
      if (currentPath.startsWith('/dashboard') || currentPath.startsWith('/admin')) {
        window.location.reload();
      }
    }, FIVE_MINUTES);

    return () => clearInterval(interval);
  }, []);

  return <>{children}</>;
};

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <AutoRefreshProvider>
      <DevBanner />
      {children}
    </AutoRefreshProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center dark:bg-gray-900 dark:text-gray-100">Loading...</div>}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/company/:id"
              element={
                <ProtectedRoute>
                  <AppLayout>
                    <CompanyDetail />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              }
            />
            {toolRoutes}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
    </ThemeProvider>
  );
}

export default App;

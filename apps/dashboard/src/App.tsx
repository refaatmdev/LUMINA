import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/auth-store';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Register from './pages/public/Register';

import Suspended from './pages/public/Suspended';
import Pricing from './pages/public/Pricing';

// import Dashboard from './pages/admin/Dashboard';

// import Settings from './pages/admin/Settings';
// import UpdatePassword from './pages/admin/UpdatePassword';
import { UpdatePasswordPage, LoginPage } from './features/auth';
import { DashboardPage } from './features/dashboard';
import { SettingsPage } from './features/settings';

// Legacy Pages

// Legacy Pages

import { MarketingPage, FinancePage, SystemStatsPage } from './features/analytics';
import { OnboardingPage } from './features/onboarding';

import { MediaLibraryPage } from './features/media';
import { SlidesListPage } from './features/slides';
import { SlideEditorPage } from './features/editor';
import { PlaylistEditorPage, PlaylistsListPage } from './features/playlists';
import { BillingPage, PlanManagerPage, TenantsManagerPage } from './features/subscription';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
// import AdminLayout from './components/layout/AdminLayout';
import { MainLayout } from './features/layout';

import { useUserRole } from './hooks/useUserRole';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { orgStatus, orgId, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  // If user has no organization, force them to onboarding
  // We check window.location.pathname to avoid infinite loop if we are already trying to access a restricted page
  if (!orgId) {
    // Identify if we are already handling this case or if the user is a super admin who might not need one (though typicaly they do)
    // For now, strict enforcement: No org -> Onboarding
    return <Navigate to="/onboarding" replace />;
  }

  if (orgStatus === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  return <>{children}</>;
}

function App() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const initializeAuth = useAuthStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
  }, []);



  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div>Config Missing</div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          {/* <Route path="/connect" element={<Connect />} /> */}
          <Route path="/suspended" element={<Suspended />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<LoginPage />} />

          {/* Onboarding Route (Verified User but No Org) */}
          <Route path="/onboarding" element={<OnboardingPage />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/editor"
            element={
              <ProtectedRoute>
                <SlideEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute>
                <BillingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <MainLayout title="Settings">
                  <SettingsPage />
                </MainLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slides"
            element={
              <ProtectedRoute>
                <SlidesListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute>
                <MediaLibraryPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/playlists"
            element={
              <ProtectedRoute>
                <PlaylistsListPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/playlists/:id"
            element={
              <ProtectedRoute>
                <PlaylistEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-password"
            element={
              <ProtectedRoute>
                <UpdatePasswordPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tenants"
            element={
              <ProtectedRoute>
                <TenantsManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute>
                <PlanManagerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/marketing"
            element={
              <ProtectedRoute>
                <MarketingPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/finance"
            element={
              <ProtectedRoute>
                <FinancePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute>
                <SystemStatsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/super"
            element={
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/admin/Login';
import Register from './pages/public/Register';

import Suspended from './pages/public/Suspended';
import Pricing from './pages/public/Pricing';

import Dashboard from './pages/admin/Dashboard';
import SlideEditor from './pages/admin/SlideEditor';
import Settings from './pages/admin/Settings';
import UpdatePassword from './pages/admin/UpdatePassword';
import SlidesList from './pages/admin/SlidesList';
import PlaylistEditor from './pages/admin/PlaylistEditor';
import Billing from './pages/admin/Billing';
import TenantsManager from './pages/admin/TenantsManager';
import PlanManager from './pages/admin/PlanManager';
import MarketingDashboard from './pages/admin/MarketingDashboard';
import FinanceAnalytics from './pages/admin/FinanceAnalytics';
import SystemStats from './pages/admin/SystemStats';
import MediaLibrary from './pages/admin/MediaLibrary';
import Connect from './pages/public/Connect';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';
import AdminLayout from './components/layout/AdminLayout';

import { useUserRole } from './hooks/useUserRole';


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const { orgStatus, loading: roleLoading } = useUserRole();

  if (authLoading || roleLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  if (orgStatus === 'suspended') {
    return <Navigate to="/suspended" replace />;
  }

  return <>{children}</>;
}

function App() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
          <Route path="/connect" element={<Connect />} />
          <Route path="/suspended" element={<Suspended />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<Login />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/editor"
            element={
              <ProtectedRoute>
                <SlideEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/billing"
            element={
              <ProtectedRoute>
                <AdminLayout title="Billing & Subscription">
                  <Billing />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/slides"
            element={
              <ProtectedRoute>
                <SlidesList />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/media"
            element={
              <ProtectedRoute>
                <MediaLibrary />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/playlists/:id"
            element={
              <ProtectedRoute>
                <PlaylistEditor />
              </ProtectedRoute>
            }
          />
          <Route
            path="/update-password"
            element={
              <ProtectedRoute>
                <UpdatePassword />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/tenants"
            element={
              <ProtectedRoute>
                <AdminLayout title="Tenants Manager">
                  <TenantsManager />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/plans"
            element={
              <ProtectedRoute>
                <AdminLayout title="Subscription Plans">
                  <PlanManager />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/marketing"
            element={
              <ProtectedRoute>
                <AdminLayout title="Marketing & Promotions">
                  <MarketingDashboard />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/finance"
            element={
              <ProtectedRoute>
                <AdminLayout title="Financial Analytics">
                  <FinanceAnalytics />
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/stats"
            element={
              <ProtectedRoute>
                <AdminLayout title="System Statistics">
                  <SystemStats />
                </AdminLayout>
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
          <Route path="/" element={<Login />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

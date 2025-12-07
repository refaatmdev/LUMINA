import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/admin/Login';
import Dashboard from './pages/admin/Dashboard';
import SlideEditor from './pages/admin/SlideEditor';
import Settings from './pages/admin/Settings';
import UpdatePassword from './pages/admin/UpdatePassword';
import SlidesList from './pages/admin/SlidesList';
import PlaylistEditor from './pages/admin/PlaylistEditor';
import Connect from './pages/public/Connect';
import Player from './pages/public/Player';
import SuperAdminDashboard from './components/admin/SuperAdminDashboard';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}

function App() {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <h1 className="text-2xl font-bold mb-4 text-red-600">Configuration Missing</h1>
          <p className="text-gray-700 mb-4">
            Please create a <code className="bg-gray-200 px-1 rounded">.env.local</code> file in the project root with your Supabase credentials.
          </p>
          <pre className="bg-gray-900 text-white p-4 rounded text-left text-sm overflow-x-auto">
            VITE_SUPABASE_URL=your_url{'\n'}
            VITE_SUPABASE_ANON_KEY=your_key
          </pre>
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/connect" element={<Connect />} />
          <Route path="/player/:id" element={<Player />} />

          {/* Admin Routes */}
          <Route path="/admin/login" element={<Login />} />
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
            path="/admin/super"
            element={
              <ProtectedRoute>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />

          {/* Redirect root to connect for now, or admin login */}
          <Route path="/" element={<Navigate to="/connect" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;

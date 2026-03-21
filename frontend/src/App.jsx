/**
 * Main App Component - CommunityPulse
 * Updated to use ProtectedRoute wrapper
 */

import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { ProtectedRoute, PublicRoute, AdminRoute } from './components/layout/ProtectedRoute';
import { Header } from './components/layout/Header';
import { Landing } from './pages/Landing';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { SubmitFeedback } from './pages/SubmitFeedback';
import { AdminPanel } from './pages/AdminPanel';
import { Profile } from './pages/Profile';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1
    }
  }
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={
                <PublicRoute>
                  <Landing />
                </PublicRoute>
              } />
              <Route path="/login" element={
                <PublicRoute redirectTo="/dashboard">
                  <Login />
                </PublicRoute>
              } />
              <Route path="/register" element={
                <PublicRoute redirectTo="/dashboard">
                  <Register />
                </PublicRoute>
              } />

              {/* Protected Routes (Members) */}
              <Route path="/dashboard" element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } />
              <Route path="/feedback/submit" element={
                <ProtectedRoute>
                  <SubmitFeedback />
                </ProtectedRoute>
              } />
              <Route path="/profile" element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              } />

              {/* Admin-Only Routes */}
              <Route path="/admin" element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              } />

              {/* 404 - Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="border-t border-gray-200 dark:border-gray-800 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
            © {new Date().getFullYear()} CommunityPulse. All rights reserved.
          </footer>
        </div>
      </AuthProvider>
    </QueryClientProvider>
  );
}
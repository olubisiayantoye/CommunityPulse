/**
 * Protected Route Component - CommunityPulse
 * Wrapper for routes that require authentication
 */

import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

/**
 * ProtectedRoute - Protects routes that require authentication
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {boolean} [props.adminOnly=false] - If true, only admin users can access
 * @param {string} [props.redirectTo='/login'] - Route to redirect if not authenticated
 */
export function ProtectedRoute({ 
  children, 
  adminOnly = false, 
  redirectTo = '/login' 
}) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    // Save the intended destination for redirect after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  // Redirect to dashboard if admin access required but user is not admin
  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" state={{ message: 'Admin access required' }} replace />;
  }

  // Render protected content
  return children;
}

/**
 * PublicRoute - Protects routes that should only be accessible when NOT authenticated
 * (e.g., login, register pages)
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} [props.redirectTo='/dashboard'] - Route to redirect if already authenticated
 */
export function PublicRoute({ 
  children, 
  redirectTo = '/dashboard' 
}) {
  const { user, loading } = useAuth();

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto" />
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to dashboard if already authenticated
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  // Render public content
  return children;
}

/**
 * AdminRoute - Shorthand for admin-only protected routes
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 */
export function AdminRoute({ children }) {
  return <ProtectedRoute adminOnly>{children}</ProtectedRoute>;
}
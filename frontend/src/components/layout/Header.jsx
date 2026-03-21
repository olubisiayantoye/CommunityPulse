/**
 * Header Component - CommunityPulse
 */

import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Button } from '../ui/Button';
import { 
  LogOut, User, BarChart3, MessageSquare, Home, ChevronDown 
} from 'lucide-react';
import { useState } from 'react';

export function Header() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="bg-primary-600 text-white p-2 rounded-lg group-hover:bg-primary-700 transition">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span className="text-lg font-bold text-gray-900 dark:text-white">CommunityPulse</span>
          </Link>

          {/* Desktop Navigation */}
          {user ? (
            <nav className="hidden md:flex items-center gap-6">
              <Link 
                to="/dashboard" 
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive('/dashboard') 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600'
                )}
              >
                <div className="flex items-center gap-1">
                  <Home className="w-4 h-4" />
                  Dashboard
                </div>
              </Link>
              
              <Link 
                to="/feedback/submit" 
                className={cn(
                  'text-sm font-medium transition-colors',
                  isActive('/feedback/submit') 
                    ? 'text-primary-600 dark:text-primary-400' 
                    : 'text-gray-600 dark:text-gray-300 hover:text-primary-600'
                )}
              >
                <div className="flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" />
                  Submit
                </div>
              </Link>
              
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className={cn(
                    'text-sm font-medium transition-colors',
                    isActive('/admin') 
                      ? 'text-primary-600 dark:text-primary-400' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-primary-600'
                  )}
                >
                  <div className="flex items-center gap-1">
                    <BarChart3 className="w-4 h-4" />
                    Admin
                  </div>
                </Link>
              )}
              
              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary-600 transition"
                >
                  <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary-700 dark:text-primary-300">
                      {user.username?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="hidden lg:inline text-sm font-medium">{user.username}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-20">
                      <Link 
                        to="/profile" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Profile
                      </Link>
                      <Link 
                        to="/dashboard?filter=my" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Feedback
                      </Link>
                      <div className="border-t border-gray-100 dark:border-gray-700 my-1" />
                      <button
                        onClick={() => { setUserMenuOpen(false); handleLogout(); }}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <div className="flex items-center gap-2">
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </div>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </nav>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <Link 
                to="/login" 
                className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-primary-600 transition"
              >
                Sign In
              </Link>
              <Button asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={() => {/* TODO: Implement mobile menu */}}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}

// Helper for class merging
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}
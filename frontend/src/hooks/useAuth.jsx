/**
 * Authentication Hook - CommunityPulse
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check for existing session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const profile = await authApi.getProfile();
          setUser(profile);
        } catch (err) {
          localStorage.removeItem('token');
          console.error('Failed to restore session:', err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const register = async (data) => {
    setError(null);
    try {
      const result = await authApi.register(data);
      localStorage.setItem('token', result.token);
      setUser(result.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const login = async (data) => {
    setError(null);
    try {
      const result = await authApi.login(data);
      localStorage.setItem('token', result.token);
      setUser(result.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setError(null);
  };

  const updateProfile = async (data) => {
    try {
      const result = await authApi.updateProfile(data);
      setUser(result.user);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const changePassword = async (data) => {
    try {
      await authApi.changePassword(data);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    }
  };

  const checkUsername = async (username) => {
    try {
      const result = await authApi.checkUsername(username);
      return result;
    } catch {
      return { taken: false, valid: true };
    }
  };

  const value = {
    user,
    loading,
    error,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    checkUsername,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
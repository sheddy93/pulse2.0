/**
 * src/lib/AuthContextDecoupled.jsx
 * ================================
 * Authentication context completamente indipendente da Base44
 * Usa authService che chiama REST API
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '@/services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [isLoadingPublicSettings] = useState(false);

  useEffect(() => {
    checkUserAuth();
  }, []);

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = authService.getCurrentUser();
      
      if (currentUser && authService.getToken()) {
        setUser(currentUser);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const navigateToLogin = (nextUrl) => {
    if (nextUrl) {
      sessionStorage.setItem('nextUrl', nextUrl);
    }
    window.location.href = '/auth/login';
  };

  const login = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      const result = await authService.login(email, password);
      setUser(result.user);
      setIsAuthenticated(true);
      setAuthError(null);
      return result;
    } catch (error) {
      setAuthError({
        type: 'login_error',
        message: error.message,
      });
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const refreshAuth = async () => {
    try {
      await authService.refreshToken();
      await checkUserAuth();
    } catch (error) {
      console.error('Refresh failed:', error);
      await logout();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoadingAuth,
        isLoadingPublicSettings,
        authError,
        authChecked,
        login,
        logout,
        refreshAuth,
        checkUserAuth,
        navigateToLogin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
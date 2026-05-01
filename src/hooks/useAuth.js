/**
 * hooks/useAuth.js
 * Hook centralizzato per autenticazione e info utente
 * TODO MIGRATION: Domani farà chiamate HTTP a /api/auth/me/
 */

import { useState, useEffect } from 'react';
import { apiClient } from '@/api/client';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await apiClient.getMe();
        setUser(currentUser);
        setError(null);
      } catch (err) {
        setError(err.message);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  const logout = async () => {
    try {
      await apiClient.logout();
      setUser(null);
    } catch (err) {
      setError(err.message);
    }
  };

  return {
    user,
    isLoading,
    error,
    isAuthenticated: !!user,
    logout,
  };
};
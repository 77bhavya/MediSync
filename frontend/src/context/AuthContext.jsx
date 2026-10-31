import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('medisync_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });
  const [settings, setSettings] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('medisync_token'));
  const [loading, setLoading] = useState(true);

  // Sync profile on mount if token exists
  useEffect(() => {
    async function loadCurrentUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await api.getMe();
        if (res.success) {
          setUser(res.user);
          setSettings(res.settings);
          localStorage.setItem('medisync_user', JSON.stringify(res.user));
        }
      } catch (err) {
        console.warn('[AuthContext] Session verification failed:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadCurrentUser();
  }, [token]);

  const login = async (email, password) => {
    const res = await api.login({ email, password });
    if (res.success) {
      localStorage.setItem('medisync_token', res.token);
      localStorage.setItem('medisync_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res;
    }
  };

  const register = async (userData) => {
    const res = await api.register(userData);
    if (res.success) {
      localStorage.setItem('medisync_token', res.token);
      localStorage.setItem('medisync_user', JSON.stringify(res.user));
      setToken(res.token);
      setUser(res.user);
      return res;
    }
  };

  const logout = () => {
    localStorage.removeItem('medisync_token');
    localStorage.removeItem('medisync_user');
    setToken(null);
    setUser(null);
    setSettings(null);
  };

  const updateUserProfile = (updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('medisync_user', JSON.stringify(updatedUser));
  };

  const updateUserSettings = (updatedSettings) => {
    setSettings(updatedSettings);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        settings,
        token,
        loading,
        isAuthenticated: !!token,
        login,
        register,
        logout,
        updateUserProfile,
        updateUserSettings,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


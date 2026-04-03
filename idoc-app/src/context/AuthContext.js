import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import storage from '../utils/storage';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initializing, setInitializing] = useState(true);

  // ─── Check stored session on app start ───
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const token = await storage.getItem('access_token');
      if (token) {
        const { data } = await authAPI.getProfile();
        setUser(data);
        socketService.connect().catch(() => {}); // non-blocking
      }
    } catch (error) {
      console.log('No valid session found');
      await storage.deleteItem('access_token');
      await storage.deleteItem('refresh_token');
    } finally {
      setLoading(false);
      setInitializing(false);
    }
  };

  // ─── Register ───
  const register = useCallback(async ({ name, email, password, role, phone, ...extra }) => {
    setLoading(true);
    try {
      const { data } = await authAPI.register({ name, email, password, role, phone, ...extra });
      if (data.tokens) {
        await storage.setItem('access_token', data.tokens.access);
        await storage.setItem('refresh_token', data.tokens.refresh);
        setUser(data.user);
        socketService.connect().catch(() => {}); // non-blocking
      }
      return { success: true, needsApproval: data.needsApproval, user: data.user };
    } catch (error) {
      const message = error.response?.data?.detail
        || error.response?.data?.message
        || error.response?.data?.non_field_errors?.[0]
        || 'Registration failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Login ───
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const { data } = await authAPI.login({ email, password });
      await storage.setItem('access_token', data.tokens.access);
      await storage.setItem('refresh_token', data.tokens.refresh);
      setUser(data.user);
      socketService.connect().catch(() => {}); // non-blocking
      return data.user;
    } catch (error) {
      const message = error.response?.data?.detail
        || error.response?.data?.message
        || error.response?.data?.non_field_errors?.[0]
        || error.message
        || 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Logout ───
  const logout = useCallback(async () => {
    try {
      const refreshToken = await storage.getItem('refresh_token');
      if (refreshToken) {
        await authAPI.logout(refreshToken);
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      await storage.deleteItem('access_token');
      await storage.deleteItem('refresh_token');
      socketService.disconnect();
      setUser(null);
    }
  }, []);

  // ─── Update Profile ───
  const updateProfile = useCallback(async (data) => {
    try {
      const { data: updatedUser } = await authAPI.updateProfile(data);
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Update failed');
    }
  }, [user]);

  const value = {
    user,
    loading,
    initializing,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isPharmacy: user?.role === 'pharmacy',
    isGeneral: user?.role === 'general',
    register,
    login,
    logout,
    updateProfile,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

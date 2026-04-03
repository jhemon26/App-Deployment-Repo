import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import storage from '../utils/storage';
import { authAPI } from '../services/api';
import socketService from '../services/socket';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// ─── Mock data for development (remove when backend is ready) ───
const MOCK_USERS = {
  'admin@idoc.com': { id: 1, email: 'admin@idoc.com', name: 'System Admin', role: 'admin', phone: '+1234567890', avatar: null, isApproved: true },
  'doctor@idoc.com': { id: 2, email: 'doctor@idoc.com', name: 'Dr. Sarah Chen', role: 'doctor', phone: '+1234567891', avatar: null, specialty: 'General Medicine', experience: '12 years', fee: 500, isApproved: true },
  'pharmacy@idoc.com': { id: 3, email: 'pharmacy@idoc.com', name: 'MedPlus Pharmacy', role: 'pharmacy', phone: '+1234567892', avatar: null, license: 'PH-12345', isApproved: true },
  'user@idoc.com': { id: 4, email: 'user@idoc.com', name: 'John Patient', role: 'general', phone: '+1234567893', avatar: null, isApproved: true },
};

const DEMO_LOGIN_USERS = {
  'john@idoc.com': {
    password: 'user123',
    user: { id: 4, email: 'john@idoc.com', name: 'John Patient', role: 'general', phone: '+1234567893', avatar: null, isApproved: true },
  },
  'sarah@idoc.com': {
    password: 'doctor123',
    user: { id: 2, email: 'sarah@idoc.com', name: 'Dr. Sarah Chen', role: 'doctor', phone: '+1234567891', avatar: null, specialty: 'General Medicine', experience: '12 years', fee: 500, isApproved: true },
  },
  'medplus@idoc.com': {
    password: 'pharmacy123',
    user: { id: 3, email: 'medplus@idoc.com', name: 'MedPlus Pharmacy', role: 'pharmacy', phone: '+1234567892', avatar: null, license: 'PH-12345', isApproved: true },
  },
  'admin@idoc.com': {
    password: 'admin123',
    user: { id: 1, email: 'admin@idoc.com', name: 'System Admin', role: 'admin', phone: '+1234567890', avatar: null, isApproved: true },
  },
};

const USE_MOCK = false; // Set to false when Django backend is ready

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
      // On web, always start from public landing/login flow to make role-switch testing easier.
      if (Platform.OS === 'web') {
        await storage.deleteItem('access_token');
        await storage.deleteItem('refresh_token');
        await storage.deleteItem('mock_user');
        setUser(null);
        return;
      }

      if (USE_MOCK) {
        const storedUser = await storage.getItem('mock_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } else {
        const storedDemoUser = await storage.getItem('mock_user');
        if (storedDemoUser) {
          setUser(JSON.parse(storedDemoUser));
          return;
        }

        const token = await storage.getItem('access_token');
        if (token) {
          const { data } = await authAPI.getProfile();
          setUser(data);
          socketService.connect().catch(() => {}); // non-blocking
        }
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
      if (USE_MOCK) {
        // Simulate registration
        const newUser = {
          id: Date.now(),
          name,
          email,
          role,
          phone,
          avatar: null,
          isApproved: role === 'general', // Admin approval needed for doctor/pharmacy
          ...extra,
        };

        if (role === 'general') {
          await storage.setItem('mock_user', JSON.stringify(newUser));
          setUser(newUser);
        }

        return {
          success: true,
          needsApproval: role !== 'general',
          user: newUser,
        };
      } else {
        const { data } = await authAPI.register({ name, email, password, role, phone, ...extra });
        if (data.tokens) {
          await storage.setItem('access_token', data.tokens.access);
          await storage.setItem('refresh_token', data.tokens.refresh);
          setUser(data.user);
          socketService.connect().catch(() => {}); // non-blocking
        }
        return { success: true, needsApproval: data.needsApproval, user: data.user };
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Login ───
  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      if (USE_MOCK) {
        // Mock login - accept any password
        const mockUser = MOCK_USERS[email.toLowerCase()];
        if (!mockUser) throw new Error('User not found. Try: admin@idoc.com, doctor@idoc.com, pharmacy@idoc.com, or user@idoc.com');

        await storage.setItem('mock_user', JSON.stringify(mockUser));
        setUser(mockUser);
        return mockUser;
      } else {
        const emailLower = email.trim().toLowerCase();
        const demo = DEMO_LOGIN_USERS[emailLower];

        if (demo && password === demo.password) {
          await storage.deleteItem('access_token');
          await storage.deleteItem('refresh_token');
          await storage.setItem('mock_user', JSON.stringify(demo.user));
          setUser(demo.user);
          return demo.user;
        }

        const { data } = await authAPI.login({ email, password });
        await storage.setItem('access_token', data.tokens.access);
        await storage.setItem('refresh_token', data.tokens.refresh);
        await storage.deleteItem('mock_user');
        setUser(data.user);
        socketService.connect().catch(() => {}); // non-blocking
        return data.user;
      }
    } catch (error) {
      const message = error.response?.data?.message || error.message || 'Login failed';
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── Logout ───
  const logout = useCallback(async () => {
    try {
      if (!USE_MOCK) {
        const refreshToken = await storage.getItem('refresh_token');
        await authAPI.logout(refreshToken);
      }
    } catch (e) {
      // Ignore logout errors
    } finally {
      await storage.deleteItem('access_token');
      await storage.deleteItem('refresh_token');
      await storage.deleteItem('mock_user');
      socketService.disconnect();
      setUser(null);
    }
  }, []);

  // ─── Update Profile ───
  const updateProfile = useCallback(async (data) => {
    try {
      if (USE_MOCK) {
        const updated = { ...user, ...data };
        await storage.setItem('mock_user', JSON.stringify(updated));
        setUser(updated);
        return updated;
      } else {
        const { data: updatedUser } = await authAPI.updateProfile(data);
        setUser(updatedUser);
        return updatedUser;
      }
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

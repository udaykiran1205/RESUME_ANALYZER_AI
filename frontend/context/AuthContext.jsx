'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const AuthContext = createContext(null);

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach token to every request
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('aia_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aia_token');
        localStorage.removeItem('aia_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const router = useRouter();

  // ─── Load user from storage on mount ─────────────────────────────────────
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('aia_token');
      const cachedUser = localStorage.getItem('aia_user');
      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
          localStorage.setItem('aia_user', JSON.stringify(data.user));
        } catch {
          localStorage.removeItem('aia_token');
          localStorage.removeItem('aia_user');
          setUser(null);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async ({ name, email, password }) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/register', { name, email, password });
      localStorage.setItem('aia_token', data.token);
      localStorage.setItem('aia_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(data.message);
      router.push('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('aia_token', data.token);
      localStorage.setItem('aia_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(data.message);
      router.push('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // ─── Google Login ─────────────────────────────────────────────────────────
  const googleLogin = useCallback(async (credential) => {
    setAuthLoading(true);
    try {
      const { data } = await api.post('/auth/google', { credential });
      localStorage.setItem('aia_token', data.token);
      localStorage.setItem('aia_user', JSON.stringify(data.user));
      setUser(data.user);
      toast.success(data.message);
      router.push('/dashboard');
    } catch (error) {
      const msg = error.response?.data?.message || 'Google sign-in failed';
      toast.error(msg);
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, [router]);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try { await api.post('/auth/logout'); } catch { /* ignore */ }
    localStorage.removeItem('aia_token');
    localStorage.removeItem('aia_user');
    setUser(null);
    toast.success('Logged out successfully');
    router.push('/login');
  }, [router]);

  // ─── Update User ──────────────────────────────────────────────────────────
  const updateUser = useCallback((updatedData) => {
    setUser((prev) => {
      const updated = { ...prev, ...updatedData };
      localStorage.setItem('aia_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const value = {
    user,
    loading,
    authLoading,
    isAuthenticated: !!user,
    register,
    login,
    googleLogin,
    logout,
    updateUser,
    api,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}

export { api };

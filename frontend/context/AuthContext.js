'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../lib/axios';
import { getCSRFToken } from '../lib/csrf';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const checkAuth = async () => {
    try {
      const res = await api.get('/api/auth/me/');
      setUser(res.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Restore auth state on page refresh
  useEffect(() => {
    checkAuth();
  }, []);

  const login = async (username, password) => {
    // Step 1: Force Django to set the csrftoken cookie
    await api.get('/api/auth/csrf/');
    const csrfToken = getCSRFToken();

    // Step 2: Authenticate
    const res = await api.post(
      '/api/auth/login/',
      { username, password },
      { headers: { 'X-CSRFToken': csrfToken } }
    );

    setUser(res.data);

    // Step 3: Role-based redirect
    const { role } = res.data;
    if (role === 'manager') router.push('/dashboard/manager');
    else if (role === 'staff') router.push('/dashboard/staff');
    else router.push('/dashboard/resident');
  };

  const logout = async () => {
    const csrfToken = getCSRFToken();
    try {
      await api.post('/api/auth/logout/', {}, {
        headers: { 'X-CSRFToken': csrfToken },
      });
    } catch {
      // Swallow errors — still clear local state
    }
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

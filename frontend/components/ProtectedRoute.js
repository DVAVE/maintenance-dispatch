'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, checkAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user || !allowedRoles.includes(user.role)) {
      router.push('/login');
    }
  }, [loading, user]);

  if (loading) {
    return (
      <div style={{
        display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '100vh',
        fontSize: '1rem', color: '#6b7280',
      }}>
        Checking authentication…
      </div>
    );
  }

  if (!user || !allowedRoles.includes(user.role)) return null;

  return children;
}

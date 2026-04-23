'use client';

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError('Invalid credentials or login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', backgroundColor: '#f3f4f6'
    }}>
      <div style={{
        backgroundColor: 'white', padding: '2.5rem', borderRadius: '8px',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', width: '100%', maxWidth: '400px'
      }}>
        <h1 style={{
          fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center',
          color: '#111827', marginBottom: '0.5rem'
        }}>
          Maintenance Dispatch System
        </h1>
        <h2 style={{
          fontSize: '1rem', textAlign: 'center', color: '#6b7280', marginBottom: '2rem'
        }}>
          Sign in to your account
        </h2>

        {error && (
          <div style={{
            backgroundColor: '#fee2e2', color: '#dc2626', padding: '0.75rem',
            borderRadius: '6px', marginBottom: '1.5rem', fontSize: '0.875rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label htmlFor="username" style={{
              display: 'block', fontSize: '0.875rem', fontWeight: '500',
              color: '#374151', marginBottom: '0.5rem'
            }}>Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              style={{
                width: '100%', padding: '0.75rem', border: '1px solid #d1d5db',
                borderRadius: '6px', outline: 'none'
              }}
            />
          </div>

          <div>
            <label htmlFor="password" style={{
              display: 'block', fontSize: '0.875rem', fontWeight: '500',
              color: '#374151', marginBottom: '0.5rem'
            }}>Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%', padding: '0.75rem', border: '1px solid #d1d5db',
                borderRadius: '6px', outline: 'none'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            style={{
              width: '100%', padding: '0.75rem', backgroundColor: '#2563eb',
              color: 'white', fontWeight: '500', borderRadius: '6px',
              border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
              opacity: isLoading ? 0.7 : 1, marginTop: '0.5rem'
            }}
          >
            {isLoading ? 'Loading...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}

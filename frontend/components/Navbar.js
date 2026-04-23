'use client';

import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = {
  manager: 'Property Manager',
  staff: 'Maintenance Staff',
  resident: 'Resident',
};

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '0.875rem 1.5rem',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%)',
      color: '#fff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <div>
        <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>
          Maintenance Dispatch System
        </span>
        {user && (
          <span style={{ marginLeft: '1.25rem', fontSize: '0.875rem', opacity: 0.85 }}>
            {user.username} &mdash; {ROLE_LABELS[user.role] ?? user.role}
          </span>
        )}
      </div>
      <button
        onClick={logout}
        style={{
          background: 'rgba(255,255,255,0.15)', color: '#fff',
          border: '1px solid rgba(255,255,255,0.4)', borderRadius: '6px',
          padding: '0.4rem 1rem', cursor: 'pointer', fontSize: '0.875rem',
          transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.target.style.background = 'rgba(255,255,255,0.25)'}
        onMouseLeave={e => e.target.style.background = 'rgba(255,255,255,0.15)'}
      >
        Logout
      </button>
    </nav>
  );
}

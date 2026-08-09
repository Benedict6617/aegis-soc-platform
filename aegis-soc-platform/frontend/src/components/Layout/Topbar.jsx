import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export default function Topbar() {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 32px',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-primary)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: 'var(--status-good)',
            boxShadow: '0 0 0 3px rgba(34,197,94,0.15)',
          }}
        />
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
          All monitoring sources reporting normally
        </span>
      </div>

      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen((o) => !o)}
          className="btn"
          style={{ background: 'transparent', border: 'none', padding: '6px 8px' }}
        >
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--bg-elevated)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {user?.fullName?.slice(0, 1) || '?'}
          </div>
          <span style={{ fontSize: 13.5 }}>{user?.fullName}</span>
        </button>

        {menuOpen && (
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: 42,
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-color)',
              borderRadius: 8,
              minWidth: 180,
              boxShadow: 'var(--shadow-elevated)',
              zIndex: 20,
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>{user?.fullName}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', textTransform: 'capitalize' }}>
                {user?.role?.replace(/_/g, ' ')}
              </div>
            </div>
            <button
              onClick={logout}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                color: 'var(--severity-critical)',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Link2, PlusCircle, Settings, LogOut, ShieldCheck, X, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
          <div className="brand-icon">
            <Link2 size={20} strokeWidth={2.5} />
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span className="brand-title">PayLink</span>
              <span style={{
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                background: 'rgba(99, 102, 241, 0.15)',
                color: '#A5B4FC',
                border: '1px solid rgba(99, 102, 241, 0.3)',
                padding: '1px 5px',
                borderRadius: '4px'
              }}>
                v2.4
              </span>
            </div>
            <div style={{
              fontSize: '0.68rem',
              color: '#94A3B8',
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              marginTop: '1px'
            }}>
              <ShieldCheck size={11} color="#10B981" /> Multi-Gateway Engine
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="btn-sidebar-close"
          aria-label="Close sidebar navigation"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Links */}
      <div style={{ padding: '1rem 1rem 0.25rem', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-dim)' }}>
        Navigation
      </div>
      <nav className="sidebar-nav" style={{ paddingTop: '0.25rem' }}>
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/links"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Link2 size={18} />
          <span>Payment Links</span>
        </NavLink>

        <NavLink
          to="/links/create"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <PlusCircle size={18} />
          <span>Create Link</span>
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Settings size={18} />
          <span>Gateways & Settings</span>
        </NavLink>
      </nav>

      {/* System Status Pill */}
      <div style={{ padding: '0 0.85rem 0.75rem' }}>
        <div style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid var(--border-light)',
          borderRadius: 'var(--radius-md)',
          padding: '0.65rem 0.85rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="status-dot-ping" style={{ backgroundColor: '#10B981' }} />
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Webhooks Live</span>
          </div>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}>99.98%</span>
        </div>
      </div>

      {/* User Footer */}
      <div className="sidebar-footer">
        <div className="user-card">
          <div style={{ position: 'relative' }}>
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
            </div>
            <span
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                backgroundColor: '#10B981',
                border: '2px solid var(--bg-card)'
              }}
            />
          </div>
          <div className="user-details">
            <div className="user-name" title={user?.name || 'Merchant'}>
              {user?.name || 'Merchant'}
            </div>
            <div className="user-role" title={user?.email || 'Active Account'}>
              {user?.email || 'Active Account'}
            </div>
          </div>
          <button
            onClick={logout}
            className="btn-icon-logout"
            title="Log Out"
            aria-label="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}


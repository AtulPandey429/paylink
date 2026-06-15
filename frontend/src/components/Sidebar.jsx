import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Link2, PlusCircle, Settings, LogOut, ShieldCheck, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
          <div className="brand-icon">
            <Link2 size={20} />
          </div>
          <div>
            <span className="brand-title">PayLink</span>
            <div style={{ fontSize: '0.68rem', color: '#818CF8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <ShieldCheck size={11} /> Multi-Gateway
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

      <nav className="sidebar-nav">
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <LayoutDashboard size={18} />
          Overview
        </NavLink>

        <NavLink
          to="/links"
          end
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Link2 size={18} />
          Payment Links
        </NavLink>

        <NavLink
          to="/links/create"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <PlusCircle size={18} />
          Create Link
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <Settings size={18} />
          Gateways & Settings
        </NavLink>
      </nav>

      <div className="sidebar-footer">
        <div className="user-card">
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'M'}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.name || 'Merchant'}</div>
            <div className="user-role">{user?.email || 'Active Account'}</div>
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

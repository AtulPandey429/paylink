import React from 'react';
import { Menu, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ title, onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleSidebar}
          className="btn-mobile-menu"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)', fontWeight: 600, display: 'none' }} className="nav-breadcrumb-root">
            PayLink
          </span>
          <ChevronRight size={14} color="var(--text-dim)" style={{ display: 'none' }} className="nav-breadcrumb-root" />
          <h1 className="page-title">{title}</h1>
        </div>
      </div>

      <div className="topbar-right">
        <div className="topbar-sandbox-badge" title="Orchestration running in Sandbox & Test Mode">
          <span className="status-dot-ping" style={{ backgroundColor: '#F59E0B', width: '6px', height: '6px' }} />
          <span className="badge-label">Sandbox Mode</span>
        </div>

        <Link to="/links/create" className="btn btn-primary topbar-create-btn">
          <Plus size={16} />
          <span className="btn-text">New Link</span>
        </Link>
      </div>
    </header>
  );
}


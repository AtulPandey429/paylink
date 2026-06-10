import React from 'react';
import { Menu, Sparkles, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ title, onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost"
          style={{ padding: '0.4rem', display: 'none' }}
          id="mobile-menu-btn"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.15)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            color: '#FCD34D',
            fontSize: '0.78rem',
            fontWeight: 600
          }}
        >
          <Sparkles size={12} />
          Sandbox / Demo Mode
        </div>

        <Link to="/links/create" className="btn btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
          <Plus size={16} />
          Create Link
        </Link>
      </div>
    </header>
  );
}

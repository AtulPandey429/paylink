import React from 'react';
import { Menu, Sparkles, Plus, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Navbar({ title, onToggleSidebar }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          onClick={onToggleSidebar}
          className="btn btn-ghost btn-mobile-menu"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>
        <h1 className="page-title">{title}</h1>
      </div>

      <div className="topbar-right">
        <div className="topbar-sandbox-badge">
          <Sparkles size={12} className="badge-icon" />
          <span className="badge-label">Sandbox Mode</span>
        </div>

        <Link to="/links/create" className="btn btn-primary topbar-create-btn">
          <Plus size={16} />
          <span className="btn-text">Create Link</span>
        </Link>
      </div>
    </header>
  );
}

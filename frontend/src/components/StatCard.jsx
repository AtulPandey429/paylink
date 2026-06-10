import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = '#6366F1' }) {
  return (
    <div className="stat-card">
      <div className="stat-header">
        <span>{title}</span>
        <div
          className="stat-icon"
          style={{ backgroundColor: `${color}20`, color: color }}
        >
          {Icon && <Icon size={18} />}
        </div>
      </div>
      <div className="stat-value">{value}</div>
      {subtext && <div className="stat-sub">{subtext}</div>}
    </div>
  );
}

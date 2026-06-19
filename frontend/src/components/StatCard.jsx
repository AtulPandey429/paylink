import React from 'react';

export default function StatCard({ title, value, subtext, icon: Icon, color = '#6366F1', trend }) {
  return (
    <div
      className="stat-card"
      style={{
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Top subtle color highlight */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '2px',
          background: `linear-gradient(90deg, ${color} 0%, transparent 80%)`,
          opacity: 0.8
        }}
      />

      <div className="stat-header">
        <span style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>{title}</span>
        <div
          className="stat-icon"
          style={{
            backgroundColor: `${color}18`,
            color: color,
            border: `1px solid ${color}33`,
            boxShadow: `0 0 12px ${color}15`
          }}
        >
          {Icon && <Icon size={18} strokeWidth={2.2} />}
        </div>
      </div>

      <div className="stat-value tabular-nums" style={{ color: 'var(--text-main)', marginTop: '0.25rem' }}>
        {value}
      </div>

      {subtext && (
        <div className="stat-sub" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          {trend && (
            <span style={{ color: color, fontWeight: 700 }}>
              {trend}
            </span>
          )}
          <span>{subtext}</span>
        </div>
      )}
    </div>
  );
}


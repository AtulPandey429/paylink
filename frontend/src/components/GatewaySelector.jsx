import React from 'react';
import { Check } from 'lucide-react';

export default function GatewaySelector({ specs, selectedGateway, onSelectGateway }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
      {specs.map((gw) => {
        const Icon = gw.icon;
        const isSelected = selectedGateway === gw.id;
        return (
          <div
            key={gw.id}
            onClick={() => onSelectGateway(gw.id)}
            style={{
              background: isSelected ? 'rgba(99, 102, 241, 0.12)' : 'var(--bg-subtle)',
              border: `1.5px solid ${isSelected ? '#6366F1' : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: gw.color }}>
                <Icon size={18} />
                {gw.name}
              </div>
              {isSelected && <Check size={16} color="#6366F1" />}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
              {gw.tagline}
            </span>
          </div>
        );
      })}
    </div>
  );
}

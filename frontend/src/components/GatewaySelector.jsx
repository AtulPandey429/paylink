import React from 'react';
import { Check } from 'lucide-react';

export default function GatewaySelector({ specs, selectedGateway, onSelectGateway }) {
  return (
    <div className="gateway-selector-grid" role="radiogroup" aria-label="Select Payment Gateway">
      {specs.map((gw) => {
        const Icon = gw.icon;
        const isSelected = selectedGateway === gw.id;
        return (
          <div
            key={gw.id}
            role="radio"
            aria-checked={isSelected}
            tabIndex={0}
            onClick={() => onSelectGateway(gw.id)}
            onKeyDown={(e) => {
              if (e.key === ' ' || e.key === 'Enter') {
                e.preventDefault();
                onSelectGateway(gw.id);
              }
            }}
            style={{
              background: isSelected ? 'var(--bg-card)' : 'var(--bg-subtle)',
              border: `1.5px solid ${isSelected ? gw.color : 'var(--border-light)'}`,
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.6rem',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: isSelected
                ? `0 0 0 1px ${gw.color}40, 0 8px 24px -4px ${gw.color}25, inset 0 1px 0 0 rgba(255, 255, 255, 0.08)`
                : 'var(--shadow-sm)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    backgroundColor: `${gw.color}15`,
                    color: gw.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: `1px solid ${gw.color}30`
                  }}
                >
                  <Icon size={17} strokeWidth={2.2} />
                </div>
                <span style={{ fontWeight: 700, fontSize: '0.95rem', color: isSelected ? 'var(--text-main)' : 'var(--text-secondary)' }}>
                  {gw.name}
                </span>
              </div>

              {/* Radio Indicator */}
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: `1.5px solid ${isSelected ? gw.color : 'rgba(255, 255, 255, 0.2)'}`,
                  backgroundColor: isSelected ? gw.color : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                {isSelected && <Check size={13} color="white" strokeWidth={3} />}
              </div>
            </div>

            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45, flex: 1 }}>
              {gw.tagline}
            </span>

            {/* Currency tags */}
            <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '0.2rem' }}>
              {gw.currencies?.slice(0, 4).map((c) => (
                <span
                  key={c}
                  style={{
                    fontSize: '0.65rem',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--text-dim)',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-light)',
                    padding: '1px 5px',
                    borderRadius: '4px'
                  }}
                >
                  {c}
                </span>
              ))}
              {gw.currencies?.length > 4 && (
                <span style={{ fontSize: '0.65rem', color: 'var(--text-dim)', alignSelf: 'center' }}>
                  +{gw.currencies.length - 4}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


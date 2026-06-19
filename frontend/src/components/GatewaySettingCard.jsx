import React from 'react';
import { CheckCircle2, AlertTriangle, Check, Copy, ExternalLink, ShieldCheck } from 'lucide-react';

export default function GatewaySettingCard({
  name,
  apiName,
  icon: Icon,
  iconColor,
  iconBg,
  gatewayData,
  currencies,
  features,
  dashboardUrl,
  dashboardLabel,
  onCopy,
  isCopied
}) {
  const isConfigured = Boolean(gatewayData?.isConfigured);
  const maskedKey = gatewayData?.maskedKey || `Not Set (Set ${name.toUpperCase()}_SECRET_KEY)`;
  const hasWebhookSecret = Boolean(gatewayData?.hasWebhookSecret);
  const webhookUrl = gatewayData?.webhookUrl || '';

  return (
    <div
      style={{
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'relative',
        boxShadow: 'var(--shadow-card)',
        transition: 'transform 0.15s, border-color 0.15s'
      }}
    >
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                backgroundColor: iconBg || `${iconColor}18`,
                color: iconColor,
                padding: '8px',
                borderRadius: '8px',
                display: 'flex',
                border: `1px solid ${iconColor}30`
              }}
            >
              <Icon size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>{name}</h3>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>{apiName}</span>
            </div>
          </div>
          {isConfigured ? (
            <span
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: '#6EE7B7',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <CheckCircle2 size={12} strokeWidth={2.5} /> Active
            </span>
          ) : (
            <span
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: '#FCD34D',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                padding: '3px 10px',
                borderRadius: '20px',
                fontSize: '0.75rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px'
              }}
            >
              <AlertTriangle size={12} strokeWidth={2.5} /> Demo Fallback
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.6rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>API Credentials:</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: '#CBD5E1', backgroundColor: 'var(--bg-subtle)', padding: '2px 8px', borderRadius: '4px', border: '1px solid var(--border-light)', wordBreak: 'break-all', maxWidth: '100%' }}>
              {maskedKey}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.6rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Webhook Secret:</span>
            <span style={{ color: hasWebhookSecret ? '#10B981' : '#F59E0B', fontWeight: 600, fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              {hasWebhookSecret ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {hasWebhookSecret ? 'Verified Active' : 'Fallback Simulator'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.6rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Supported Currencies:</span>
            <span style={{ color: '#CBD5E1', textAlign: 'right', fontWeight: 500, fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>{currencies}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '0.6rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Payment Rails:</span>
            <span style={{ color: '#CBD5E1', textAlign: 'right', fontSize: '0.82rem' }}>{features}</span>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.35rem' }}>
            Webhook Endpoint ({name} Dashboard)
          </label>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-subtle)',
              border: '1px solid var(--border-light)',
              borderRadius: 'var(--radius-md)',
              padding: '0.4rem 0.6rem'
            }}
          >
            <input
              readOnly
              value={webhookUrl}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-secondary)',
                fontSize: '0.78rem',
                fontFamily: 'var(--font-mono)',
                flex: 1,
                outline: 'none'
              }}
            />
            <button
              onClick={() => onCopy(webhookUrl)}
              className="btn btn-secondary"
              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
              title="Copy URL"
            >
              {isCopied ? <Check size={14} style={{ color: '#10B981' }} /> : <Copy size={14} />}
            </button>
          </div>
        </div>
      </div>

      {dashboardUrl && (
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-light)' }}>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#818CF8', fontSize: '0.82rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px', textDecoration: 'none' }}
          >
            {dashboardLabel || `${name} Developer Portal`} <ExternalLink size={13} />
          </a>
        </div>
      )}
    </div>
  );
}


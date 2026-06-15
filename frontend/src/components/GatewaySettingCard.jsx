import React from 'react';
import { CheckCircle2, AlertTriangle, Check, Copy, ExternalLink } from 'lucide-react';

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
    <div style={{
      backgroundColor: '#1E293B',
      border: '1px solid #334155',
      borderRadius: '12px',
      padding: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      position: 'relative'
    }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              backgroundColor: iconBg || `${iconColor}20`,
              color: iconColor,
              padding: '8px',
              borderRadius: '8px',
              display: 'flex'
            }}>
              <Icon size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#F8FAFC' }}>{name}</h3>
              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{apiName}</span>
            </div>
          </div>
          {isConfigured ? (
            <span style={{
              backgroundColor: '#10B98120',
              color: '#10B981',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <CheckCircle2 size={12} /> Configured
            </span>
          ) : (
            <span style={{
              backgroundColor: '#F59E0B20',
              color: '#F59E0B',
              padding: '3px 10px',
              borderRadius: '20px',
              fontSize: '0.75rem',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <AlertTriangle size={12} /> Demo Fallback
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            <span style={{ color: '#94A3B8' }}>API Key:</span>
            <span style={{ fontFamily: 'monospace', color: '#CBD5E1', backgroundColor: '#0F172A', padding: '2px 6px', borderRadius: '4px', wordBreak: 'break-all', maxWidth: '100%' }}>
              {maskedKey}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            <span style={{ color: '#94A3B8' }}>Webhook Secret:</span>
            <span style={{ color: hasWebhookSecret ? '#10B981' : '#F59E0B', fontWeight: 600 }}>
              {hasWebhookSecret ? 'Verified Active' : 'Fallback Simulator'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            <span style={{ color: '#94A3B8' }}>Currencies:</span>
            <span style={{ color: '#CBD5E1', textAlign: 'right' }}>{currencies}</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
            <span style={{ color: '#94A3B8' }}>Features:</span>
            <span style={{ color: '#CBD5E1', textAlign: 'right' }}>{features}</span>
          </div>
        </div>

        <div style={{ marginTop: '1.25rem' }}>
          <label style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
            Webhook URL ({name} Dashboard)
          </label>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#0F172A',
            border: '1px solid #334155',
            borderRadius: '6px',
            padding: '0.4rem 0.6rem'
          }}>
            <input
              readOnly
              value={webhookUrl}
              style={{
                background: 'none',
                border: 'none',
                color: '#94A3B8',
                fontSize: '0.78rem',
                fontFamily: 'monospace',
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
        <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #334155' }}>
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noreferrer"
            style={{ color: '#818CF8', fontSize: '0.8rem', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}
          >
            {dashboardLabel || `${name} Dashboard`} <ExternalLink size={12} />
          </a>
        </div>
      )}
    </div>
  );
}

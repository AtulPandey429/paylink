import React, { useState } from 'react';
import { Clock, CheckCircle2, RefreshCw, XCircle, ShieldAlert, ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

export default function EventTimeline({ auditLogs = [] }) {
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem', background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
        No lifecycle audit events recorded yet for this payment link.
      </div>
    );
  }

  const getActionConfig = (action) => {
    switch (action) {
      case 'PAYMENT_CAPTURED':
        return {
          color: '#10B981',
          icon: CheckCircle2,
          label: 'Payment Captured & Verified',
          badgeBg: 'rgba(16, 185, 129, 0.12)',
          badgeColor: '#6EE7B7'
        };
      case 'LINK_CREATED':
        return {
          color: '#6366F1',
          icon: Clock,
          label: 'Payment Link Generated',
          badgeBg: 'rgba(99, 102, 241, 0.12)',
          badgeColor: '#A5B4FC'
        };
      case 'STATUS_SYNCED':
        return {
          color: '#0EA5E9',
          icon: RefreshCw,
          label: 'Gateway Reconciled / Synced',
          badgeBg: 'rgba(14, 165, 233, 0.12)',
          badgeColor: '#7DD3FC'
        };
      case 'LINK_CANCELLED':
        return {
          color: '#EF4444',
          icon: XCircle,
          label: 'Payment Link Cancelled',
          badgeBg: 'rgba(239, 68, 68, 0.12)',
          badgeColor: '#FCA5A5'
        };
      case 'WEBHOOK_RECEIVED':
      default:
        return {
          color: '#F59E0B',
          icon: ShieldAlert,
          label: 'Webhook Event Processed',
          badgeBg: 'rgba(245, 158, 11, 0.12)',
          badgeColor: '#FCD34D'
        };
    }
  };

  const handleCopyPayload = (id, details) => {
    navigator.clipboard.writeText(JSON.stringify(details, null, 2)).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  return (
    <div className="timeline">
      {auditLogs.map((log) => {
        const config = getActionConfig(log.action);
        const Icon = config.icon;
        const dateStr = new Date(log.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        const isExpanded = expandedLogId === log._id;
        const hasDetails = log.details && Object.keys(log.details).length > 0;

        return (
          <div key={log._id} className="timeline-item">
            {/* Pulsing Dot */}
            <div
              className="timeline-dot"
              style={{
                borderColor: config.color,
                boxShadow: `0 0 8px ${config.color}40`,
                backgroundColor: 'var(--bg-main)'
              }}
            />

            <div
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '0.85rem 1rem',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '6px',
                      backgroundColor: config.badgeBg,
                      color: config.badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Icon size={14} strokeWidth={2.2} />
                  </span>
                  <span>{config.label}</span>
                </span>
                <span className="tabular-nums" style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  {dateStr}
                </span>
              </div>

              {hasDetails && (
                <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.04)' }}>
                  <button
                    type="button"
                    onClick={() => setExpandedLogId(isExpanded ? null : log._id)}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: 0
                    }}
                  >
                    {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    <span>{isExpanded ? 'Hide Payload' : 'View Event Payload'}</span>
                  </button>

                  {isExpanded && (
                    <div style={{ marginTop: '0.5rem', position: 'relative' }}>
                      <pre
                        style={{
                          background: 'rgba(0, 0, 0, 0.45)',
                          padding: '0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          color: '#A5B4FC',
                          overflowX: 'auto',
                          maxHeight: '200px',
                          margin: 0,
                          border: '1px solid var(--border-light)'
                        }}
                      >
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                      <button
                        onClick={() => handleCopyPayload(log._id, log.details)}
                        title="Copy JSON Payload"
                        style={{
                          position: 'absolute',
                          top: '6px',
                          right: '6px',
                          background: 'rgba(255, 255, 255, 0.08)',
                          border: 'none',
                          color: '#CBD5E1',
                          borderRadius: '4px',
                          padding: '3px 6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          fontSize: '0.7rem'
                        }}
                      >
                        {copiedId === log._id ? <Check size={11} color="#10B981" /> : <Copy size={11} />}
                        <span>{copiedId === log._id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}


import React from 'react';
import { Clock, CheckCircle2, RefreshCw, XCircle, ShieldAlert } from 'lucide-react';

export default function EventTimeline({ auditLogs = [] }) {
  if (!auditLogs || auditLogs.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
        No historical events recorded yet for this payment link.
      </div>
    );
  }

  const getActionConfig = (action) => {
    switch (action) {
      case 'PAYMENT_CAPTURED':
        return {
          color: '#10B981',
          icon: CheckCircle2,
          label: 'Payment Captured & Verified'
        };
      case 'LINK_CREATED':
        return {
          color: '#6366F1',
          icon: Clock,
          label: 'Payment Link Generated'
        };
      case 'STATUS_SYNCED':
        return {
          color: '#0EA5E9',
          icon: RefreshCw,
          label: 'Gateway Reconciled / Synced'
        };
      case 'LINK_CANCELLED':
        return {
          color: '#EF4444',
          icon: XCircle,
          label: 'Payment Link Cancelled'
        };
      case 'WEBHOOK_RECEIVED':
      default:
        return {
          color: '#F59E0B',
          icon: ShieldAlert,
          label: 'Webhook Event Processed'
        };
    }
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

        return (
          <div key={log._id} className="timeline-item">
            <div className="timeline-dot" style={{ borderColor: config.color }} />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Icon size={14} color={config.color} />
                {config.label}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                {dateStr}
              </span>
            </div>

            {log.details && Object.keys(log.details).length > 0 && (
              <div
                style={{
                  background: 'rgba(0, 0, 0, 0.25)',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontFamily: 'var(--font-mono)',
                  color: '#94A3B8',
                  marginTop: '0.35rem',
                  wordBreak: 'break-all'
                }}
              >
                {JSON.stringify(log.details, null, 2)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

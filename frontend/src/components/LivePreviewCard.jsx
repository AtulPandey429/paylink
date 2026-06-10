import React from 'react';
import { Check } from 'lucide-react';
import GatewayBadge from './GatewayBadge';

export default function LivePreviewCard({ selectedGateway, title, amount, currency, customerName, customerEmail }) {
  return (
    <aside style={{ position: 'sticky', top: '90px' }}>
      <div className="card" style={{ background: 'linear-gradient(145deg, #18223B, #131B2E)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A5B4FC', fontWeight: 700 }}>
            Live Link Preview
          </span>
          <GatewayBadge gateway={selectedGateway} />
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)' }}>
            {title || 'Untitled Invoice'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Billed to {customerName || customerEmail || 'Guest Customer'}
          </p>
        </div>

        <div style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', marginBottom: '1.5rem', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.2rem' }}>Total Payable</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'white' }}>
            {currency} {parseFloat(amount || 0).toFixed(2)}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={14} color="#10B981" /> PCI-DSS SAQ-A Delegated Checkout
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={14} color="#10B981" /> Webhook HMAC Signed Reconciliation
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Check size={14} color="#10B981" /> Idempotent Event Deduplication
          </div>
        </div>
      </div>
    </aside>
  );
}

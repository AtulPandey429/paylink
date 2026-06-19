import React from 'react';
import { Check, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import GatewayBadge from './GatewayBadge';

export default function LivePreviewCard({ selectedGateway, title, amount, currency, customerName, customerEmail }) {
  const formattedAmount = isNaN(parseFloat(amount)) ? '0.00' : parseFloat(amount).toFixed(2);

  return (
    <aside className="live-preview-aside">
      {/* Device Mockup Shell */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(160deg, #111A2E 0%, #0B1120 100%)',
          border: '1px solid rgba(99, 102, 241, 0.25)',
          boxShadow: '0 20px 40px -15px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        {/* Mock Window Controls Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--border-light)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.7)' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.7)' }} />
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'rgba(16, 185, 129, 0.7)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginLeft: '6px', fontFamily: 'var(--font-mono)' }}>
              checkout.paylink.dev
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', color: '#10B981', fontWeight: 600 }}>
            <Lock size={11} /> 256-Bit
          </div>
        </div>

        {/* Live Badge & Gateway */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A5B4FC', fontWeight: 700 }}>
            Live Link Preview
          </span>
          <GatewayBadge gateway={selectedGateway} />
        </div>

        {/* Product Details */}
        <div style={{ marginBottom: '1.25rem' }}>
          <h4 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.35rem', color: 'var(--text-main)', wordBreak: 'break-word' }}>
            {title || 'Untitled Invoice'}
          </h4>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
            Recipient: <span style={{ color: 'var(--text-secondary)' }}>{customerName || customerEmail || 'Guest Customer'}</span>
          </p>
        </div>

        {/* Amount Box */}
        <div
          style={{
            background: 'rgba(7, 10, 18, 0.6)',
            borderRadius: 'var(--radius-md)',
            padding: '1.15rem',
            marginBottom: '1.5rem',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.3rem' }}>
            Amount Due
          </div>
          <div className="tabular-nums" style={{ fontSize: '2rem', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
            {currency} {formattedAmount}
          </div>
        </div>

        {/* Simulated Action Button */}
        <div
          style={{
            background: selectedGateway === 'stripe' ? 'linear-gradient(135deg, #635BFF, #4F46E5)' : selectedGateway === 'razorpay' ? 'linear-gradient(135deg, #0EA5E9, #0284C7)' : selectedGateway === 'cashfree' ? 'linear-gradient(135deg, #10B981, #059669)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.88rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 14px rgba(0, 0, 0, 0.4)',
            marginBottom: '1.5rem',
            opacity: 0.95
          }}
        >
          <span>Pay {currency} {formattedAmount}</span>
          <ArrowRight size={15} />
        </div>

        {/* Security & Verification Guarantees */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem', fontSize: '0.76rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid var(--border-light)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={13} color="#10B981" />
            <span>PCI-DSS SAQ-A Delegated Checkout</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={13} color="#10B981" />
            <span>HMAC Signed Webhook Reconciled</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Check size={13} color="#10B981" />
            <span>Idempotent Event Deduplication</span>
          </div>
        </div>
      </div>
    </aside>
  );
}


import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';

export default function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('linkId');

  return (
    <div className="auth-page-container">
      <div 
        className="checkout-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid rgba(244, 63, 94, 0.4)',
          boxShadow: 'var(--shadow-lg), 0 20px 40px -15px rgba(0, 0, 0, 0.8)',
          textAlign: 'center'
        }}
      >
        {/* Cancelled Icon */}
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          backgroundColor: 'rgba(244, 63, 94, 0.15)',
          color: '#F43F5E',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 0 30px rgba(244, 63, 94, 0.35)'
        }}>
          <XCircle size={36} strokeWidth={2.2} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
          Payment Cancelled
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
          The checkout session was cancelled or timed out. No charges were made to your account.
        </p>

        <div style={{
          backgroundColor: 'var(--bg-subtle)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-light)',
          padding: '1.15rem',
          margin: '1.75rem 0',
          color: 'var(--text-dim)',
          fontSize: '0.85rem',
          lineHeight: 1.45
        }}>
          You can retry this payment using the button below or contact the merchant for an updated payment link.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {linkId && (
            <Link
              to={`/pay/preview/${linkId}`}
              className="btn btn-primary"
              style={{ padding: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> Retry Checkout
            </Link>
          )}

          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ padding: '0.6rem', width: '100%', fontSize: '0.85rem' }}
          >
            Return to Home
          </Link>
        </div>

        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: 'var(--text-dim)',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} style={{ color: 'var(--text-muted)' }} />
          <span>PayLink Secure Payment Orchestration</span>
        </div>
      </div>
    </div>
  );
}


import React from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { XCircle, ArrowLeft, RefreshCw, ShieldCheck } from 'lucide-react';

export default function PaymentCancelled() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('linkId');

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0A0F1D',
      padding: '2rem 1rem',
      backgroundImage: 'radial-gradient(ellipse at 50% -20%, #7F1D1D 0%, #0A0F1D 70%)'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '480px',
        backgroundColor: '#111827',
        border: '1px solid #DC262640',
        borderRadius: '20px',
        padding: '2.5rem 2rem',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
        textAlign: 'center'
      }}>
        {/* Cancelled Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#EF444420',
          color: '#EF4444',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: '0 0 25px rgba(239, 68, 68, 0.3)'
        }}>
          <XCircle size={36} />
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F9FAFB', margin: 0, letterSpacing: '-0.02em' }}>
          Payment Cancelled
        </h1>
        <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.4rem' }}>
          The checkout session was cancelled or timed out. No charges were made to your account.
        </p>

        <div style={{
          backgroundColor: '#1F2937',
          borderRadius: '12px',
          border: '1px solid #374151',
          padding: '1rem',
          margin: '1.75rem 0',
          color: '#9CA3AF',
          fontSize: '0.85rem'
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
          borderTop: '1px solid #1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#6B7280',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} style={{ color: '#9CA3AF' }} />
          <span>PayLink Secure Payment Orchestration</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ShieldCheck, CheckCircle2, XCircle, Sparkles, CreditCard, ArrowLeft, RefreshCw, Lock, Smartphone, ExternalLink, AlertCircle } from 'lucide-react';
import { fetchPublicPaymentLink, simulatePayment } from '../api/paymentLinks';
import { getErrorMessage } from '../api/client';

export default function PublicPayPreview() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [result, setResult] = useState(null);

  const fetchPublicLink = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPublicPaymentLink(id);
      if (res.success) {
        setLink(res.data.link);
      }
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load payment checkout session'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicLink();
  }, [id]);

  const handleSimulatePayment = async (actionType) => {
    if (actionLoading) return;
    setActionLoading(true);
    try {
      const res = await simulatePayment(id, actionType);
      if (res.success) {
        setResult({
          type: actionType === 'success' ? 'success' : 'fail',
          message: res.message
        });
        fetchPublicLink();
      }
    } catch (err) {
      setResult({
        type: 'fail',
        message: getErrorMessage(err, 'Simulation error occurred')
      });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B0F17' }}>
        <RefreshCw size={32} className="spin" style={{ color: '#6366F1' }} />
      </div>
    );
  }

  if (error && !link) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B0F17', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle size={40} style={{ color: 'var(--danger)', marginBottom: '1rem' }} />
        <h2 style={{ marginBottom: '0.5rem' }}>Failed to Load Payment Session</h2>
        <p style={{ color: '#94A3B8', marginBottom: '2rem', maxWidth: '400px' }}>{error}</p>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={fetchPublicLink} className="btn btn-primary">
            <RefreshCw size={16} /> Try Again
          </button>
          <Link to="/" className="btn btn-secondary">Merchant Portal</Link>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B0F17', color: 'white', padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ marginBottom: '1rem' }}>Payment Link Expired or Not Found</h2>
        <p style={{ color: '#94A3B8', marginBottom: '2rem' }}>This checkout session is no longer active.</p>
        <Link to="/" className="btn btn-secondary">Go to PayLink Dashboard</Link>
      </div>
    );
  }

  const isAlreadyPaid = link.status === 'paid';
  const isUpiEligible = link.currency === 'INR' || link.gateway === 'razorpay' || link.gateway === 'cashfree' || link.gateway === 'demo';
  const upiIntentUrl = `upi://pay?pa=paylink.merchant@icici&pn=PayLink%20Merchant&am=${Number(link.amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(link.title || 'Payment')}&tr=${link._id}`;

  return (
    <div className="auth-page-container">
      <div
        className="checkout-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: '1px solid var(--border-light)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'linear-gradient(135deg, #6366F1, #8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 0 14px rgba(99, 102, 241, 0.4)' }}>
              <CreditCard size={18} strokeWidth={2.2} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>PayLink Checkout</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#10B981', fontWeight: 600, background: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '2px 8px', borderRadius: 'var(--radius-full)' }}>
            <Lock size={11} /> 256-Bit TLS
          </div>
        </div>

        {/* Invoice Summary */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
            Amount Due
          </span>
          <div className="tabular-nums" style={{ fontSize: '2.75rem', fontWeight: 800, color: 'white', margin: '0.3rem 0', letterSpacing: '-0.03em' }}>
            {link.currency} {Number(link.amount).toFixed(2)}
          </div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            {link.title}
          </h3>
          {link.customer?.name && (
            <p style={{ fontSize: '0.82rem', color: 'var(--text-dim)', marginTop: '0.25rem' }}>
              Billed to {link.customer.name}
            </p>
          )}
        </div>

        {/* Success / Failure Banner */}
        {(result || isAlreadyPaid) && (
          <div
            style={{
              padding: '1.15rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: (result?.type === 'success' || isAlreadyPaid) ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
              border: `1px solid ${(result?.type === 'success' || isAlreadyPaid) ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
              color: (result?.type === 'success' || isAlreadyPaid) ? '#6EE7B7' : '#FCA5A5',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              marginBottom: '1.5rem',
              fontSize: '0.88rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              {(result?.type === 'success' || isAlreadyPaid) ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
              <span style={{ fontWeight: 600 }}>{result?.message || 'This payment link has been completed and verified!'}</span>
            </div>
            {isAlreadyPaid && (
              <Link
                to={`/payment-success?linkId=${id}`}
                className="btn btn-secondary"
                style={{ alignSelf: 'flex-start', marginTop: '0.35rem', fontSize: '0.78rem', padding: '0.35rem 0.75rem' }}
              >
                View Official Receipt →
              </Link>
            )}
          </div>
        )}

        {/* Mobile UPI Deep-Link Action (if eligible & unpaid) */}
        {!isAlreadyPaid && isUpiEligible && (
          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#38BDF8', fontWeight: 700, fontSize: '0.85rem', marginBottom: '0.4rem' }}>
              <Smartphone size={16} /> Mobile UPI Intent (GPay / PhonePe / Paytm)
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '0.85rem', lineHeight: 1.45 }}>
              On mobile devices with installed UPI banking apps, tap below to launch your payment app directly.
            </p>
            <a
              href={upiIntentUrl}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.65rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', textDecoration: 'none', fontSize: '0.85rem' }}
            >
              <Smartphone size={16} /> Pay via Installed UPI App
            </a>
          </div>
        )}

        {/* Demo Mode Simulator Actions */}
        {!isAlreadyPaid && (
          <div style={{ background: 'var(--bg-subtle)', border: '1px dashed rgba(245, 158, 11, 0.4)', borderRadius: 'var(--radius-md)', padding: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#FCD34D', fontWeight: 700, fontSize: '0.82rem', marginBottom: '0.5rem' }}>
              <Sparkles size={14} /> Interactive Payment Simulator
            </div>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', lineHeight: 1.45, marginBottom: '1rem' }}>
              This checkout link is running in sandbox/simulation mode. Click below to simulate an authenticated customer payment or rejection. A cryptographically signed webhook will be dispatched to the backend.
            </p>

            <div className="checkout-simulator-actions">
              <button
                onClick={() => handleSimulatePayment('success')}
                disabled={actionLoading || isAlreadyPaid}
                className="btn btn-primary"
                style={{ flex: 1, backgroundColor: '#10B981', background: '#10B981', borderColor: '#059669', fontSize: '0.82rem', padding: '0.6rem 0.5rem' }}
              >
                {actionLoading ? 'Simulating...' : '✓ Simulate Success'}
              </button>

              <button
                onClick={() => handleSimulatePayment('fail')}
                disabled={actionLoading || isAlreadyPaid}
                className="btn btn-danger"
                style={{ flex: 1, fontSize: '0.82rem', padding: '0.6rem 0.5rem' }}
              >
                ✗ Simulate Failure
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: 'center', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
          <Link to="/" style={{ color: '#818CF8', fontSize: '0.82rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
            <ArrowLeft size={14} /> Return to Merchant Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, FileText, Clock, AlertTriangle, RotateCcw } from 'lucide-react';
import { fetchPublicPaymentLink } from '../api/paymentLinks';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const linkId = searchParams.get('linkId');
  const sessionId = searchParams.get('session_id');
  const cfLinkId = searchParams.get('cf_link_id');

  const [link, setLink] = useState(null);
  const [loading, setLoading] = useState(Boolean(linkId));
  const [pollCount, setPollCount] = useState(0);
  const [isPolling, setIsPolling] = useState(false);
  const pollTimerRef = useRef(null);

  const MAX_POLL_ATTEMPTS = 5;
  const POLL_INTERVAL_MS = 2000;

  const fetchStatus = async () => {
    if (!linkId) return null;
    try {
      const res = await fetchPublicPaymentLink(linkId);
      if (res.success) {
        const fetchedLink = res.data.link;
        setLink(fetchedLink);
        return fetchedLink;
      }
    } catch (err) {
      console.error('Failed to load payment confirmation', err);
    }
    return null;
  };

  useEffect(() => {
    if (!linkId) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    async function initialLoadAndPoll() {
      setLoading(true);
      const initialLink = await fetchStatus();
      if (!isMounted) return;
      setLoading(false);

      // If status is still pending, poll up to MAX_POLL_ATTEMPTS times
      if (initialLink && initialLink.status === 'pending') {
        setIsPolling(true);
        let attempts = 0;

        const poll = async () => {
          if (!isMounted) return;
          attempts += 1;
          setPollCount(attempts);

          const updatedLink = await fetchStatus();
          if (!isMounted) return;

          if (updatedLink && updatedLink.status === 'paid') {
            setIsPolling(false);
            return;
          }

          if (attempts < MAX_POLL_ATTEMPTS) {
            pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
          } else {
            setIsPolling(false);
          }
        };

        pollTimerRef.current = setTimeout(poll, POLL_INTERVAL_MS);
      }
    }

    initialLoadAndPoll();

    return () => {
      isMounted = false;
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    };
  }, [linkId]);

  const isPaid = link?.status === 'paid';
  const isPending = link?.status === 'pending';
  const isFailed = link?.status === 'failed' || link?.status === 'cancelled';

  return (
    <div className="auth-page-container">
      <div 
        className="checkout-card"
        style={{
          backgroundColor: 'var(--bg-card)',
          border: `1px solid ${isPaid ? 'rgba(16, 185, 129, 0.4)' : isPending ? 'rgba(245, 158, 11, 0.4)' : 'rgba(244, 63, 94, 0.4)'}`,
          boxShadow: 'var(--shadow-lg), 0 20px 40px -15px rgba(0, 0, 0, 0.8)',
          textAlign: 'center'
        }}
      >
        {/* Status Icon */}
        <div style={{
          width: '68px',
          height: '68px',
          borderRadius: '50%',
          backgroundColor: isPaid ? 'rgba(16, 185, 129, 0.15)' : isPending ? 'rgba(245, 158, 11, 0.15)' : 'rgba(244, 63, 94, 0.15)',
          color: isPaid ? '#10B981' : isPending ? '#F59E0B' : '#F43F5E',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: `0 0 30px ${isPaid ? 'rgba(16, 185, 129, 0.35)' : isPending ? 'rgba(245, 158, 11, 0.35)' : 'rgba(244, 63, 94, 0.35)'}`
        }}>
          {loading || isPolling ? (
            <RefreshCw size={36} className="spin" />
          ) : isPaid ? (
            <CheckCircle2 size={36} strokeWidth={2.5} />
          ) : isPending ? (
            <Clock size={36} strokeWidth={2.2} />
          ) : (
            <AlertTriangle size={36} strokeWidth={2.2} />
          )}
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
          {isPaid
            ? 'Payment Completed'
            : isPending
            ? isPolling
              ? 'Verifying Settlement...'
              : 'Payment Processing'
            : isFailed
            ? 'Payment Not Completed'
            : 'Payment Status'}
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.5 }}>
          {isPaid
            ? 'Your transaction has been securely captured and verified by the payment gateway.'
            : isPending
            ? isPolling
              ? `Confirming settlement with provider (attempt ${pollCount}/${MAX_POLL_ATTEMPTS})...`
              : 'Awaiting webhook confirmation from your payment provider. We will update the link as soon as the bank settles.'
            : isFailed
            ? 'The payment was cancelled or failed by the gateway. No funds were debited.'
            : 'Check payment transaction details below.'}
        </p>

        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', justifyContent: 'center' }}>
            <RefreshCw size={24} className="spin" style={{ color: 'var(--primary)' }} />
          </div>
        ) : link ? (
          <div style={{
            backgroundColor: 'var(--bg-subtle)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-light)',
            padding: '1.25rem',
            margin: '1.75rem 0',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>
              Invoice Details
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginTop: '0.25rem', wordBreak: 'break-word' }}>
              {link.title}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Amount:</span>
              <span className="tabular-nums" style={{ fontWeight: 800, color: isPaid ? '#10B981' : isPending ? '#F59E0B' : '#F43F5E', fontFamily: 'var(--font-mono)', fontSize: '1.05rem' }}>
                {link.currency} {Number(link.amount).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Status:</span>
              <span style={{
                fontWeight: 700,
                fontSize: '0.78rem',
                textTransform: 'uppercase',
                color: isPaid ? '#10B981' : isPending ? '#F59E0B' : '#F43F5E'
              }}>
                {link.status}
              </span>
            </div>

            {link.customer?.name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Payer:</span>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{link.customer.name}</span>
              </div>
            )}

            {(sessionId || cfLinkId) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>Gateway Ref:</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                  {(sessionId || cfLinkId).slice(0, 16)}...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: 'var(--bg-subtle)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', margin: 0 }}>
              Transaction confirmation recorded for reference #{linkId ? linkId.slice(-8) : 'RECEIPT'}.
            </p>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {isPending && (
            <button
              onClick={fetchStatus}
              className="btn btn-secondary"
              style={{ padding: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <RefreshCw size={16} /> Re-check Status
            </button>
          )}

          {linkId && (
            <Link
              to={`/pay/preview/${linkId}`}
              className="btn btn-primary"
              style={{ padding: '0.75rem', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <FileText size={16} /> View Payment Receipt
            </Link>
          )}

          <Link
            to="/login"
            className="btn btn-secondary"
            style={{ padding: '0.6rem', width: '100%', fontSize: '0.85rem' }}
          >
            Merchant Sign In
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
          <ShieldCheck size={14} style={{ color: '#10B981' }} />
          <span>PayLink Multi-Gateway Cryptographic Verification</span>
        </div>
      </div>
    </div>
  );
}


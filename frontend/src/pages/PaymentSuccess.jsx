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
          border: `1px solid ${isPaid ? '#05966940' : isPending ? '#D9770640' : '#DC262640'}`,
          textAlign: 'center'
        }}
      >
        {/* Status Icon */}
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: isPaid ? '#10B98120' : isPending ? '#F59E0B20' : '#EF444420',
          color: isPaid ? '#10B981' : isPending ? '#F59E0B' : '#EF4444',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
          boxShadow: `0 0 25px ${isPaid ? 'rgba(16, 185, 129, 0.3)' : isPending ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`
        }}>
          {loading || isPolling ? (
            <RefreshCw size={36} className="spin" />
          ) : isPaid ? (
            <CheckCircle2 size={36} />
          ) : isPending ? (
            <Clock size={36} />
          ) : (
            <AlertTriangle size={36} />
          )}
        </div>

        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F9FAFB', margin: 0, letterSpacing: '-0.02em' }}>
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

        <p style={{ color: '#9CA3AF', fontSize: '0.9rem', marginTop: '0.4rem' }}>
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
            <RefreshCw size={24} className="spin" style={{ color: '#10B981' }} />
          </div>
        ) : link ? (
          <div style={{
            backgroundColor: '#1F2937',
            borderRadius: '12px',
            border: '1px solid #374151',
            padding: '1.25rem',
            margin: '1.75rem 0',
            textAlign: 'left'
          }}>
            <div style={{ fontSize: '0.75rem', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Invoice Details
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F3F4F6', marginTop: '0.25rem' }}>
              {link.title}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #374151' }}>
              <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Amount:</span>
              <span style={{ fontWeight: 800, color: isPaid ? '#10B981' : isPending ? '#F59E0B' : '#EF4444', fontFamily: 'var(--font-mono)' }}>
                {link.currency} {Number(link.amount).toFixed(2)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
              <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Status:</span>
              <span style={{
                fontWeight: 700,
                fontSize: '0.8rem',
                textTransform: 'uppercase',
                color: isPaid ? '#10B981' : isPending ? '#F59E0B' : '#EF4444'
              }}>
                {link.status}
              </span>
            </div>

            {link.customer?.name && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Payer:</span>
                <span style={{ color: '#E5E7EB', fontSize: '0.85rem' }}>{link.customer.name}</span>
              </div>
            )}

            {(sessionId || cfLinkId) && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.4rem' }}>
                <span style={{ color: '#9CA3AF', fontSize: '0.85rem' }}>Gateway Ref:</span>
                <span style={{ color: '#9CA3AF', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                  {(sessionId || cfLinkId).slice(0, 16)}...
                </span>
              </div>
            )}
          </div>
        ) : (
          <div style={{ margin: '1.5rem 0', padding: '1rem', backgroundColor: '#1F2937', borderRadius: '8px' }}>
            <p style={{ color: '#9CA3AF', fontSize: '0.85rem', margin: 0 }}>
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
          borderTop: '1px solid #1F2937',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: '#6B7280',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} style={{ color: '#10B981' }} />
          <span>PayLink Multi-Gateway Cryptographic Verification</span>
        </div>
      </div>
    </div>
  );
}

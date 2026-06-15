import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Copy, Check, ExternalLink, RefreshCw, XCircle, ArrowLeft, Shield, Clock, User, CreditCard, AlertCircle } from 'lucide-react';
import { fetchPaymentLinkEvents, syncPaymentLink, cancelPaymentLink } from '../api/paymentLinks';
import { getErrorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import GatewayBadge from '../components/GatewayBadge';
import EventTimeline from '../components/EventTimeline';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export default function PaymentLinkDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [link, setLink] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const fetchLinkDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchPaymentLinkEvents(id);
      if (res.success) {
        setLink(res.data.link);
        setAuditLogs(res.data.auditLogs || []);
        setTransactions(res.data.transactions || []);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load link details');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinkDetails();
  }, [id]);

  const handleCopy = () => {
    if (!link?.gatewayPaymentUrl) return;
    navigator.clipboard.writeText(link.gatewayPaymentUrl).then(() => {
      setCopied(true);
      showToast('Payment link copied to clipboard!', 'success');
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      showToast('Reconciling status with gateway...', 'info');
      const res = await syncPaymentLink(id);
      if (res.success) {
        showToast(`Sync complete. Status is: ${res.data.link.status}`, 'success');
        fetchLinkDetails();
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Sync failed'), 'error');
    } finally {
      setSyncing(false);
    }
  };

  const handleCancelConfirm = async () => {
    if (cancelLoading) return;
    setCancelLoading(true);
    try {
      const res = await cancelPaymentLink(id);
      if (res.success) {
        showToast('Payment link cancelled', 'success');
        setCancelModalOpen(false);
        fetchLinkDetails();
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Cancel failed'), 'error');
    } finally {
      setCancelLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading payment link details...</p>
      </div>
    );
  }

  if (error && !link) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <AlertCircle size={36} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Failed to Load Link Details</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button onClick={fetchLinkDetails} className="btn btn-primary">
            <RefreshCw size={16} /> Retry
          </button>
          <button onClick={() => navigate('/links')} className="btn btn-secondary">
            <ArrowLeft size={16} /> Back to Links
          </button>
        </div>
      </div>
    );
  }

  if (!link) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <h3 style={{ marginBottom: '1rem' }}>Payment Link Not Found</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>This link does not exist or you do not have permission to access it.</p>
        <button onClick={() => navigate('/links')} className="btn btn-secondary">
          <ArrowLeft size={16} /> Back to Links
        </button>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back button & Action Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={() => navigate('/links')} className="btn btn-ghost" style={{ padding: '0.4rem' }}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800, wordBreak: 'break-word' }}>{link.title}</h2>
              <StatusBadge status={link.status} />
              <GatewayBadge gateway={link.gateway} isDemo={link.isDemo} />
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)', marginTop: '0.2rem', wordBreak: 'break-all' }}>
              Gateway Link ID: {link.gatewayLinkId}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={handleSync} className="btn btn-secondary" disabled={syncing} title="Fetch latest status directly from gateway">
            <RefreshCw size={14} className={syncing ? 'spin' : ''} />
            {syncing ? 'Syncing...' : 'Sync Status'}
          </button>

          {link.status === 'pending' && (
            <button onClick={() => setCancelModalOpen(true)} className="btn btn-danger" title="Cancel this link on the gateway">
              <XCircle size={14} />
              Cancel Link
            </button>
          )}
        </div>
      </div>

      {/* Shareable Link Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(139, 92, 246, 0.15))',
          border: '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-lg)',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          flexWrap: 'wrap',
          marginBottom: '2rem'
        }}
      >
        <div style={{ flex: 1, minWidth: '240px' }}>
          <div style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#A5B4FC', fontWeight: 700, marginBottom: '0.25rem' }}>
            Shareable Checkout URL
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.88rem', color: 'white', wordBreak: 'break-all' }}>
            {link.gatewayPaymentUrl}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.65rem' }}>
          <button onClick={handleCopy} className="btn btn-primary" style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}>
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Link'}
          </button>

          <a
            href={link.gatewayPaymentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ padding: '0.55rem 1rem', fontSize: '0.85rem' }}
          >
            <ExternalLink size={14} />
            Open Link
          </a>
        </div>
      </div>

      <div className="link-detail-grid">
        {/* Left Column: Link Metadata & Payment Details */}
        <div>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem' }}>Payment Link Summary</h3>

            <div className="form-row-2col" style={{ gap: '1.25rem' }}>
              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Amount</span>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'white', marginTop: '0.2rem' }}>
                  {link.currency} {Number(link.amount).toFixed(2)}
                </div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                  ({link.amountMinor} minor units)
                </span>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Current Status</span>
                <div style={{ marginTop: '0.35rem' }}>
                  <StatusBadge status={link.status} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Gateway</span>
                <div style={{ marginTop: '0.35rem' }}>
                  <GatewayBadge gateway={link.gateway} isDemo={link.isDemo} />
                </div>
              </div>

              <div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Created At</span>
                <div style={{ fontSize: '0.88rem', fontWeight: 600, marginTop: '0.2rem' }}>
                  {new Date(link.createdAt).toLocaleString()}
                </div>
              </div>

              {link.paidAt && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Paid At</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#10B981', marginTop: '0.2rem' }}>
                    {new Date(link.paidAt).toLocaleString()}
                  </div>
                </div>
              )}

              {link.expiresAt && (
                <div>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Expires At</span>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#F59E0B', marginTop: '0.2rem' }}>
                    {new Date(link.expiresAt).toLocaleString()}
                  </div>
                </div>
              )}
            </div>

            {/* Customer Details Box */}
            <div style={{ borderTop: '1px solid var(--border-light)', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                <User size={14} /> Customer Information
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', fontSize: '0.88rem' }}>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Name</span>
                  <div style={{ fontWeight: 600, wordBreak: 'break-word' }}>{link.customer?.name || 'Not provided'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Email</span>
                  <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{link.customer?.email || 'Not provided'}</div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>Phone</span>
                  <div style={{ fontWeight: 600 }}>{link.customer?.phone || 'Not provided'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Captured Payment Transaction Box (if paid) */}
          {transactions.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <CreditCard size={18} color="#10B981" /> Captured Transaction Record
              </h3>
              {transactions.map((tx) => (
                <div key={tx._id} style={{ background: 'var(--bg-subtle)', borderRadius: 'var(--radius-md)', padding: '1rem', border: '1px solid var(--border-light)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Gateway Payment ID</span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 600, color: '#A5B4FC', wordBreak: 'break-all' }}>
                      {tx.gatewayPaymentId}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Payment Method</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, textTransform: 'uppercase' }}>
                      {tx.paymentMethod || 'Card / UPI'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Captured Time</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {new Date(tx.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Event Timeline / Audit Trail */}
        <div>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock size={18} color="var(--primary)" /> Audit Log & Lifecycle Events
            </h3>
            <EventTimeline auditLogs={auditLogs} />
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      <ConfirmDialog
        isOpen={cancelModalOpen}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelConfirm}
        title="Cancel Payment Link"
        message={`Are you sure you want to cancel "${link.title}"? The gateway will reject any future payment attempts for this link.`}
        confirmText="Yes, Cancel Link"
        danger={true}
        loading={cancelLoading}
      />
    </div>
  );
}

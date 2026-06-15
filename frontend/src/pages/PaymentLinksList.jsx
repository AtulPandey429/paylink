import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Copy, Check, RefreshCw, Plus, ExternalLink, XCircle, AlertCircle } from 'lucide-react';
import { fetchPaymentLinks, syncPaymentLink, cancelPaymentLink } from '../api/paymentLinks';
import { getErrorMessage } from '../api/client';
import StatusBadge from '../components/StatusBadge';
import GatewayBadge from '../components/GatewayBadge';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

export default function PaymentLinksList() {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [search, setSearch] = useState('');
  const [gateway, setGateway] = useState('all');
  const [status, setStatus] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');

  // Cancel dialog state
  const [cancelModal, setCancelModal] = useState({ isOpen: false, linkId: null, title: '', loading: false });

  // Syncing state per item
  const [syncingId, setSyncingId] = useState(null);

  // Copy tracking
  const [copiedId, setCopiedId] = useState(null);

  const { showToast } = useToast();

  const fetchLinks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page,
        limit,
        search,
        gateway: gateway !== 'all' ? gateway : undefined,
        status: status !== 'all' ? status : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
        sortBy,
        sortOrder
      };

      const res = await fetchPaymentLinks(params);
      if (res.success) {
        setLinks(res.data.links);
        setTotal(res.data.total);
        setTotalPages(res.data.totalPages);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load payment links');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLinks();
  }, [page, gateway, status, sortBy, sortOrder]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchLinks();
  };

  const handleCopyLink = (id, url) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(id);
      showToast('Payment link copied to clipboard!', 'success');
      setTimeout(() => setCopiedId(null), 2500);
    }).catch(() => {
      showToast('Failed to copy to clipboard', 'error');
    });
  };

  const handleSyncStatus = async (linkId) => {
    if (syncingId) return;
    setSyncingId(linkId);
    try {
      showToast('Syncing status with payment gateway...', 'info');
      const res = await syncPaymentLink(linkId);
      if (res.success) {
        showToast(`Status verified: ${res.data.link.status}`, 'success');
        fetchLinks();
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Sync failed'), 'error');
    } finally {
      setSyncingId(null);
    }
  };

  const openCancelModal = (link) => {
    setCancelModal({
      isOpen: true,
      linkId: link._id,
      title: link.title,
      loading: false
    });
  };

  const handleConfirmCancel = async () => {
    if (!cancelModal.linkId || cancelModal.loading) return;
    setCancelModal((prev) => ({ ...prev, loading: true }));
    try {
      const res = await cancelPaymentLink(cancelModal.linkId);
      if (res.success) {
        showToast('Payment link cancelled successfully', 'success');
        setCancelModal({ isOpen: false, linkId: null, title: '', loading: false });
        fetchLinks();
      }
    } catch (err) {
      showToast(getErrorMessage(err, 'Cancellation failed'), 'error');
      setCancelModal((prev) => ({ ...prev, loading: false }));
    }
  };

  return (
    <div className="page-container">
      {/* Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Payment Links</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Manage, share, sync, and monitor generated payment links</p>
        </div>

        <Link to="/links/create" className="btn btn-primary">
          <Plus size={16} />
          Create Payment Link
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="card" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
        <form onSubmit={handleSearchSubmit} className="filters-form">
          <div className="filter-item-search" style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '36px' }}
              placeholder="Search by title, customer, or gateway ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="filter-item-select">
            <select className="form-select" value={gateway} onChange={(e) => { setGateway(e.target.value); setPage(1); }}>
              <option value="all">All Gateways</option>
              <option value="stripe">Stripe</option>
              <option value="razorpay">Razorpay</option>
              <option value="cashfree">Cashfree</option>
              <option value="demo">Demo</option>
            </select>
          </div>

          <div className="filter-item-select">
            <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <div className="filter-item-select">
            <select className="form-select" value={`${sortBy}_${sortOrder}`} onChange={(e) => {
              const [f, o] = e.target.value.split('_');
              setSortBy(f);
              setSortOrder(o);
            }}>
              <option value="createdAt_desc">Newest First</option>
              <option value="createdAt_asc">Oldest First</option>
              <option value="amount_desc">Amount (High to Low)</option>
              <option value="amount_asc">Amount (Low to High)</option>
            </select>
          </div>

          <button type="submit" className="btn btn-secondary filter-submit-btn">
            <Filter size={14} /> Filter
          </button>
        </form>
      </div>

      {/* Main Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Link Description</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Customer</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.5rem', color: 'var(--primary)' }} />
                    Loading payment links...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--danger)' }}>
                    <AlertCircle size={28} style={{ margin: '0 auto 0.5rem', display: 'block' }} />
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Failed to load payment links</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>{error}</div>
                    <button onClick={fetchLinks} className="btn btn-secondary" style={{ padding: '0.4rem 0.85rem', fontSize: '0.8rem' }}>
                      <RefreshCw size={12} /> Retry
                    </button>
                  </td>
                </tr>
              ) : links.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-dim)' }}>
                    No payment links matched your filter criteria.
                  </td>
                </tr>
              ) : (
                links.map((link) => (
                  <tr key={link._id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        <Link to={`/links/${link._id}`} style={{ color: 'inherit', textDecoration: 'none' }} className="hover-underline">
                          {link.title}
                        </Link>
                      </div>
                      <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
                        ID: {link.gatewayLinkId}
                      </div>
                    </td>

                    <td>
                      <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        {link.currency} {Number(link.amount).toFixed(2)}
                      </span>
                    </td>

                    <td>
                      <GatewayBadge gateway={link.gateway} isDemo={link.isDemo} />
                    </td>

                    <td>
                      <StatusBadge status={link.status} />
                    </td>

                    <td>
                      <div style={{ fontSize: '0.85rem' }}>{link.customer?.name || '—'}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{link.customer?.email || '—'}</div>
                    </td>

                    <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                      {new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleCopyLink(link._id, link.gatewayPaymentUrl)}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Copy Payment URL"
                        >
                          {copiedId === link._id ? <Check size={13} color="#10B981" /> : <Copy size={13} />}
                        </button>

                        <a
                          href={link.gatewayPaymentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Open Checkout Link in New Tab"
                        >
                          <ExternalLink size={13} />
                        </a>

                        <button
                          onClick={() => handleSyncStatus(link._id)}
                          disabled={syncingId === link._id}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                          title="Reconcile with Gateway"
                          aria-label={`Sync status for ${link.title}`}
                        >
                          <RefreshCw size={13} className={syncingId === link._id ? 'spin' : ''} />
                        </button>

                        {link.status === 'pending' && (
                          <button
                            onClick={() => openCancelModal(link)}
                            className="btn btn-danger"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                            title="Cancel Payment Link"
                          >
                            <XCircle size={13} />
                          </button>
                        )}

                        <Link
                          to={`/links/${link._id}`}
                          className="btn btn-secondary"
                          style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="pagination-bar">
          <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>
            Showing {links.length} of {total} payment links
          </span>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0.5rem' }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <ConfirmDialog
        isOpen={cancelModal.isOpen}
        onClose={() => setCancelModal({ isOpen: false, linkId: null, title: '', loading: false })}
        onConfirm={handleConfirmCancel}
        title="Cancel Payment Link"
        message={`Are you sure you want to cancel the link "${cancelModal.title}"? Once cancelled, customers will no longer be able to make payments through this link.`}
        confirmText="Yes, Cancel Link"
        danger={true}
        loading={cancelModal.loading}
      />
    </div>
  );
}

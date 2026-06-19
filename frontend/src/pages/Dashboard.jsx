import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { DollarSign, Link2, CheckCircle2, Clock, ArrowUpRight, TrendingUp, Filter, RefreshCw, AlertCircle } from 'lucide-react';
import { fetchDashboardSummary } from '../api/dashboard';
import { getErrorMessage } from '../api/client';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import GatewayBadge from '../components/GatewayBadge';
import { useToast } from '../context/ToastContext';

const getCurrencySymbol = (curr = 'USD') => {
  switch ((curr || '').toUpperCase()) {
    case 'INR': return '₹';
    case 'EUR': return '€';
    case 'GBP': return '£';
    case 'CAD': return 'CA$';
    case 'AUD': return 'AU$';
    default: return '$';
  }
};

const formatRevenueDisplay = (overview) => {
  if (overview.revenueByCurrency && overview.revenueByCurrency.length > 0) {
    if (overview.revenueByCurrency.length === 1) {
      const item = overview.revenueByCurrency[0];
      return `${getCurrencySymbol(item.currency)}${item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return overview.revenueByCurrency
      .map(item => `${getCurrencySymbol(item.currency)}${item.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`)
      .join(' + ');
  }
  return `$${(overview.totalRevenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

const getGatewayCurrencySymbol = (gateway) => {
  if (gateway === 'razorpay' || gateway === 'cashfree') return '₹';
  return '$';
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gatewayFilter, setGatewayFilter] = useState('all');
  const { showToast } = useToast();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (gatewayFilter !== 'all') params.gateway = gatewayFilter;
      const res = await fetchDashboardSummary(params);
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load dashboard metrics');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [gatewayFilter]);

  if (loading && !data) {
    return (
      <div className="page-container">
        {/* Header Skeleton */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem' }}>
          <div>
            <div className="skeleton" style={{ width: '220px', height: '28px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '320px', height: '16px' }} />
          </div>
          <div className="skeleton" style={{ width: '140px', height: '36px' }} />
        </div>

        {/* Stats Grid Skeleton */}
        <div className="stats-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="stat-card" style={{ gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div className="skeleton" style={{ width: '120px', height: '16px' }} />
                <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '8px' }} />
              </div>
              <div className="skeleton" style={{ width: '160px', height: '32px' }} />
              <div className="skeleton" style={{ width: '180px', height: '14px' }} />
            </div>
          ))}
        </div>

        {/* Cards Skeleton */}
        <div className="card" style={{ height: '220px' }}>
          <div className="skeleton" style={{ width: '100%', height: '100%', borderRadius: '8px' }} />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 1rem' }}>
        <div style={{
          width: '56px',
          height: '56px',
          borderRadius: '16px',
          backgroundColor: 'var(--danger-light)',
          color: 'var(--danger)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 1.25rem'
        }}>
          <AlertCircle size={28} />
        </div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Failed to Load Dashboard Metrics</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '420px', margin: '0 auto 1.75rem', fontSize: '0.9rem' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={15} /> Retry Connection
        </button>
      </div>
    );
  }

  const { overview = {}, gatewayBreakdown = [], recentLinks = [], timeSeries = [] } = data || {};

  return (
    <div className="page-container">
      {/* Top Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
            Financial Overview
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.2rem' }}>
            Multi-gateway link performance, conversion health, and transaction flow
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-card)',
              padding: '0.4rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-light)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <Filter size={14} color="var(--text-dim)" />
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.85rem',
                fontWeight: 600,
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all" style={{ background: '#0E1526' }}>All Gateways</option>
              <option value="stripe" style={{ background: '#0E1526' }}>Stripe</option>
              <option value="razorpay" style={{ background: '#0E1526' }}>Razorpay</option>
              <option value="cashfree" style={{ background: '#0E1526' }}>Cashfree</option>
            </select>
          </div>

          <button
            onClick={fetchDashboardData}
            disabled={loading}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 0.85rem' }}
            title="Refresh metrics"
            aria-label="Refresh metrics"
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="stats-grid">
        <StatCard
          title="Total Captured Revenue"
          value={formatRevenueDisplay(overview)}
          subtext={
            overview.revenueByCurrency && overview.revenueByCurrency.length > 1
              ? `Across ${overview.paidCount || 0} captured payments`
              : `From ${overview.paidCount || 0} successfully captured payments`
          }
          icon={DollarSign}
          color="#10B981"
          trend={`${overview.paidCount || 0} paid`}
        />

        <StatCard
          title="Total Payment Links"
          value={overview.totalLinks || 0}
          subtext="Generated across all active gateways"
          icon={Link2}
          color="#6366F1"
        />

        <StatCard
          title="Conversion Rate"
          value={`${overview.conversionRate || 0}%`}
          subtext={`${overview.paidCount || 0} paid of ${overview.totalLinks || 0} total links`}
          icon={TrendingUp}
          color="#0EA5E9"
          trend={overview.conversionRate > 0 ? 'Optimal' : undefined}
        />

        <StatCard
          title="Pending Settlement"
          value={overview.pendingCount || 0}
          subtext="Awaiting customer completion"
          icon={Clock}
          color="#F59E0B"
        />
      </div>

      {/* Gateway Breakdown Section */}
      <div className="card">
        <div className="card-header">
          <div>
            <h3 className="card-title">Gateway Performance Breakdown</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Real-time aggregated link volume and gateway settlement rate
            </span>
          </div>
        </div>

        <div className="gateway-breakdown-grid">
          {gatewayBreakdown.map((gw) => {
            const gwColor = gw.gateway === 'stripe' ? '#635BFF' : gw.gateway === 'razorpay' ? '#0EA5E9' : gw.gateway === 'cashfree' ? '#10B981' : '#F59E0B';
            return (
              <div
                key={gw.gateway}
                style={{
                  background: 'var(--bg-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.85rem',
                  transition: 'border-color 0.15s ease, transform 0.15s ease',
                  boxShadow: 'var(--shadow-sm)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <GatewayBadge gateway={gw.gateway} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: gw.conversionRate > 0 ? '#10B981' : 'var(--text-dim)',
                      backgroundColor: gw.conversionRate > 0 ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.04)',
                      padding: '2px 8px',
                      borderRadius: 'var(--radius-full)'
                    }}
                  >
                    {gw.conversionRate}% Conversion
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.35rem' }}>
                  <span className="tabular-nums" style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                    {getGatewayCurrencySymbol(gw.gateway)}{gw.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                    {gw.paidCount} / {gw.totalCount} links
                  </span>
                </div>

                {/* Visual Progress Bar */}
                <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${Math.max(gw.conversionRate, 3)}%`,
                      height: '100%',
                      background: `linear-gradient(90deg, ${gwColor}, ${gwColor}CC)`,
                      borderRadius: '3px',
                      boxShadow: `0 0 8px ${gwColor}60`,
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  />
                </div>
              </div>
            );
          })}

          {gatewayBreakdown.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.88rem' }}>
              No payment links generated yet. Create your first link to see gateway breakdown statistics.
            </div>
          )}
        </div>
      </div>

      {/* Recent Links Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-light)' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>Recent Payment Links</h3>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Latest links created and their live gateway settlement</span>
          </div>
          <Link to="/links" className="btn btn-ghost" style={{ fontSize: '0.82rem', gap: '0.35rem', padding: '0.4rem 0.75rem' }}>
            <span>View All</span>
            <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="table-wrapper" style={{ border: 'none', borderRadius: 0 }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Title / Customer</th>
                <th>Amount</th>
                <th>Gateway</th>
                <th>Status</th>
                <th>Created</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentLinks.map((link) => {
                const customerInitials = (link.customer?.name ? link.customer.name.charAt(0) : 'G').toUpperCase();
                return (
                  <tr key={link._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--bg-surface)',
                            border: '1px solid var(--border-light)',
                            color: '#A5B4FC',
                            fontWeight: 700,
                            fontSize: '0.8rem',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          {customerInitials}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                            {link.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '240px' }}>
                            {link.customer?.name || link.customer?.email || 'Guest Payer'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="tabular-nums" style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {link.currency} {Number(link.amount).toFixed(2)}
                      </span>
                    </td>
                    <td>
                      <GatewayBadge gateway={link.gateway} isDemo={link.isDemo} />
                    </td>
                    <td>
                      <StatusBadge status={link.status} />
                    </td>
                    <td style={{ color: 'var(--text-dim)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link to={`/links/${link._id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                        Details
                      </Link>
                    </td>
                  </tr>
                );
              })}

              {recentLinks.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-dim)' }}>
                    <div style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>No payment links found.</div>
                    <Link to="/links/create" className="btn btn-primary" style={{ display: 'inline-flex', fontSize: '0.82rem' }}>
                      Create First Link
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

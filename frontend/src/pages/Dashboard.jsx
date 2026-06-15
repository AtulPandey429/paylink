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
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <RefreshCw size={32} className="spin" style={{ color: 'var(--primary)', marginBottom: '1rem' }} />
        <p style={{ color: 'var(--text-muted)' }}>Loading financial metrics and analytics...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="page-container" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <AlertCircle size={36} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Failed to Load Dashboard Metrics</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>{error}</p>
        <button onClick={fetchDashboardData} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const { overview = {}, gatewayBreakdown = [], recentLinks = [], timeSeries = [] } = data || {};

  return (
    <div className="page-container">
      {/* Top Filter Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Financial Overview</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Multi-gateway link performance and conversion tracking</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'var(--bg-card)', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <Filter size={14} color="var(--text-muted)" />
            <select
              value={gatewayFilter}
              onChange={(e) => setGatewayFilter(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', outline: 'none', cursor: 'pointer' }}
            >
              <option value="all" style={{ background: '#131B2E' }}>All Gateways</option>
              <option value="stripe" style={{ background: '#131B2E' }}>Stripe</option>
              <option value="razorpay" style={{ background: '#131B2E' }}>Razorpay</option>
              <option value="cashfree" style={{ background: '#131B2E' }}>Cashfree</option>
            </select>
          </div>

          <button onClick={fetchDashboardData} className="btn btn-secondary" style={{ padding: '0.5rem 0.85rem' }} title="Refresh metrics">
            <RefreshCw size={14} />
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
              ? `Multi-currency totals across ${overview.paidCount || 0} captured payments`
              : `From ${overview.paidCount || 0} successfully captured payments`
          }
          icon={DollarSign}
          color="#10B981"
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
          <h3 className="card-title">Gateway Performance Breakdown</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Real-time aggregated volume</span>
        </div>

        <div className="gateway-breakdown-grid">
          {gatewayBreakdown.map((gw) => (
            <div
              key={gw.gateway}
              style={{
                background: 'var(--bg-subtle)',
                border: '1px solid var(--border-light)',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <GatewayBadge gateway={gw.gateway} />
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#10B981' }}>
                  {gw.conversionRate}% Conversion
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.35rem', marginTop: '0.25rem' }}>
                <span style={{ fontSize: '1.35rem', fontWeight: 800 }}>
                  {getGatewayCurrencySymbol(gw.gateway)}{gw.paidAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                  {gw.paidCount} / {gw.totalCount} links paid
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div style={{ width: '100%', height: '6px', background: 'rgba(255, 255, 255, 0.08)', borderRadius: '3px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${gw.conversionRate}%`,
                    height: '100%',
                    background: gw.gateway === 'stripe' ? '#635BFF' : gw.gateway === 'razorpay' ? '#0EA5E9' : '#10B981',
                    borderRadius: '3px'
                  }}
                />
              </div>
            </div>
          ))}

          {gatewayBreakdown.length === 0 && (
            <div style={{ gridColumn: '1 / -1', padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
              No payment links generated yet. Create your first link to see gateway breakdown statistics.
            </div>
          )}
        </div>
      </div>

      {/* Recent Links Table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Payment Links</h3>
          <Link to="/links" className="btn btn-ghost" style={{ fontSize: '0.82rem', gap: '0.3rem' }}>
            View All Links <ArrowUpRight size={14} />
          </Link>
        </div>

        <div className="table-wrapper">
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
              {recentLinks.map((link) => (
                <tr key={link._id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{link.title}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                      {link.customer?.name || link.customer?.email || 'Guest Payer'}
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
                  <td style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    {new Date(link.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Link to={`/links/${link._id}`} className="btn btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>
                      Details
                    </Link>
                  </td>
                </tr>
              ))}

              {recentLinks.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-dim)' }}>
                    No payment links found. Get started by creating your first link!
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

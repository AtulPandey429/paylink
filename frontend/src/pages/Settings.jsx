import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  CreditCard, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  RefreshCw, 
  Key, 
  Lock, 
  ExternalLink,
  Info,
  Server,
  Terminal,
  Cpu
} from 'lucide-react';
import { fetchSettings } from '../api/settings';
import { getErrorMessage } from '../api/client';
import GatewayBadge from '../components/GatewayBadge';
import GatewaySettingCard from '../components/GatewaySettingCard';
import { useToast } from '../context/ToastContext';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copiedUrl, setCopiedUrl] = useState(null);
  const { showToast } = useToast();

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchSettings();
      if (res.success) {
        setSettings(res.data);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to load system settings');
      setError(msg);
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(key);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopiedUrl(null), 2500);
  };

  if (loading) {
    return (
      <div className="page-container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <div className="skeleton" style={{ width: '280px', height: '30px', marginBottom: '8px' }} />
            <div className="skeleton" style={{ width: '380px', height: '16px' }} />
          </div>
          <div className="skeleton" style={{ width: '130px', height: '36px' }} />
        </div>
        <div className="skeleton" style={{ width: '100%', height: '90px', borderRadius: '12px', marginBottom: '2rem' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="skeleton" style={{ height: '240px', borderRadius: '16px' }} />
          ))}
        </div>
      </div>
    );
  }

  if (error && !settings) {
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
          <AlertTriangle size={28} />
        </div>
        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem', fontWeight: 700 }}>Failed to Load Gateway Settings</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.75rem', maxWidth: '420px', margin: '0 auto 1.75rem', fontSize: '0.9rem' }}>{error}</p>
        <button onClick={loadSettings} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={15} /> Retry
        </button>
      </div>
    );
  }

  const gateways = settings?.gateways || {};

  return (
    <div className="page-container" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Gateways & System Security
          </h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.25rem', fontSize: '0.88rem' }}>
            Manage active payment integrations, webhook listener endpoints, and security posture.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={loadSettings} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
          >
            <RefreshCw size={14} />
            <span>Refresh Status</span>
          </button>
        </div>
      </div>

      {/* System Status Banner */}
      <div style={{ 
        backgroundColor: 'var(--bg-card)', 
        border: '1px solid var(--border-light)', 
        borderRadius: 'var(--radius-lg)', 
        padding: '1.25rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem',
        boxShadow: 'var(--shadow-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(16, 185, 129, 0.12)', 
            color: '#10B981', 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(16, 185, 129, 0.25)'
          }}>
            <Server size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Server Environment</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)', textTransform: 'capitalize' }}>
              {settings?.environment || 'development'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(99, 102, 241, 0.12)', 
            color: '#818CF8', 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(99, 102, 241, 0.25)'
          }}>
            <Cpu size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Active Mode</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {settings?.demoModeEnabled ? 'Test Sandbox + Fallback' : 'Direct API Sandbox'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ 
            backgroundColor: 'rgba(14, 165, 233, 0.12)', 
            color: '#38BDF8', 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '1px solid rgba(14, 165, 233, 0.25)'
          }}>
            <Lock size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 700 }}>Secret Protection</div>
            <div style={{ fontSize: '0.98rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={15} /> Redacted & Safe
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Cards Grid */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem', letterSpacing: '-0.01em' }}>
          Payment Gateway Providers
        </h3>

        <div className="gateway-settings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 320px), 1fr))', gap: '1.5rem' }}>
          
          {/* STRIPE */}
          <GatewaySettingCard
            name="Stripe"
            apiName="Stripe Checkout API v1"
            icon={CreditCard}
            iconColor="#635BFF"
            gatewayData={gateways.stripe}
            currencies="USD, EUR, GBP, INR, CAD, AUD"
            features="Hosted Checkout, Apple/Google Pay"
            dashboardUrl="https://dashboard.stripe.com/test/apikeys"
            dashboardLabel="Stripe Dashboard"
            onCopy={(url) => handleCopy(url, 'stripe')}
            isCopied={copiedUrl === 'stripe'}
          />

          {/* RAZORPAY */}
          <GatewaySettingCard
            name="Razorpay"
            apiName="Razorpay Payment Links v1"
            icon={Zap}
            iconColor="#0EA5E9"
            gatewayData={gateways.razorpay}
            currencies="INR, USD, EUR, GBP"
            features="UPI, RuPay, Netbanking, Cards"
            dashboardUrl="https://dashboard.razorpay.com/app/keys"
            dashboardLabel="Razorpay Dashboard"
            onCopy={(url) => handleCopy(url, 'razorpay')}
            isCopied={copiedUrl === 'razorpay'}
          />

          {/* CASHFREE */}
          <GatewaySettingCard
            name="Cashfree"
            apiName="PG Orders & Links v2"
            icon={Shield}
            iconColor="#10B981"
            gatewayData={gateways.cashfree}
            currencies="INR only (Native Domestic)"
            features="UPI Intent, Netbanking, Wallets"
            dashboardUrl="https://merchant.cashfree.com/merchants/login"
            dashboardLabel="Cashfree Merchant Portal"
            onCopy={(url) => handleCopy(url, 'cashfree')}
            isCopied={copiedUrl === 'cashfree'}
          />

          {/* DEMO SIMULATOR */}
          <GatewaySettingCard
            name="Demo Simulator"
            apiName="PayLink Test Environment"
            icon={Cpu}
            iconColor="#F59E0B"
            gatewayData={gateways.demo}
            currencies="USD, INR, EUR, GBP"
            features="Instant simulation & signed HMAC webhooks"
            dashboardUrl={null}
            onCopy={(url) => handleCopy(url, 'demo')}
            isCopied={copiedUrl === 'demo'}
          />

        </div>
      </div>

      {/* Security Architecture Section */}
      <div style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-lg)', padding: '1.75rem', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: 'rgba(99, 102, 241, 0.12)', color: '#818CF8', padding: '8px', borderRadius: '8px', display: 'flex', border: '1px solid rgba(99, 102, 241, 0.25)' }}>
            <Lock size={20} />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Built-in Enterprise Security Controls
            </h3>
            <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: '0.82rem', marginTop: '0.15rem' }}>
              OWASP Top 10 defenses, idempotent webhook processing, and cryptographic verification
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem', fontSize: '0.875rem' }}>
          
          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              HMAC Webhook Signatures
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Raw HTTP body stream preservation ensures byte-for-byte HMAC-SHA256 signature verification via <code style={{ color: '#818CF8', background: 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: '3px' }}>crypto.timingSafeEqual</code> preventing timing attacks.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              IDOR & Tenant Isolation
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Every link read, sync, and cancellation query enforces ownership checks (<code style={{ color: '#818CF8', background: 'rgba(255,255,255,0.04)', padding: '1px 4px', borderRadius: '3px' }}>userId: req.user._id</code>). No merchant can inspect another merchant’s data.
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              Integer Minor-Unit Currency
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Zero IEEE 754 floating-point drift. All calculations, limits, and gateway payloads use integer minor units (cents/paise) with explicit zero-decimal currency mapping (JPY).
            </p>
          </div>

          <div style={{ backgroundColor: 'var(--bg-subtle)', padding: '1.15rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)' }}>
            <div style={{ fontWeight: 600, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem', fontSize: '0.9rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              Idempotent Webhook Events
            </div>
            <p style={{ color: 'var(--text-muted)', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Webhook event IDs are indexed and persisted with atomic check-and-insert. Duplicate deliveries from gateway retries are acknowledged safely without double-charging or corrupting status.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

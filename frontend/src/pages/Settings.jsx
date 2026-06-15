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
      <div className="empty-state" style={{ minHeight: '60vh' }}>
        <RefreshCw size={36} className="spinner" style={{ color: '#6366F1' }} />
        <p style={{ marginTop: '1rem', color: '#94A3B8' }}>Loading gateway configurations and security status...</p>
      </div>
    );
  }

  if (error && !settings) {
    return (
      <div className="empty-state" style={{ minHeight: '60vh', textAlign: 'center' }}>
        <AlertTriangle size={36} style={{ color: 'var(--danger)', margin: '0 auto 1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>Failed to Load Gateway Settings</h3>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', maxWidth: '400px', margin: '0 auto 1.5rem' }}>{error}</p>
        <button onClick={loadSettings} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  const gateways = settings?.gateways || {};

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.875rem', fontWeight: 800, color: '#F8FAFC', margin: 0, letterSpacing: '-0.02em' }}>
            Gateways & System Security
          </h1>
          <p style={{ color: '#94A3B8', marginTop: '0.4rem', fontSize: '0.95rem' }}>
            Manage active payment integrations, webhook listener endpoints, and security posture.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button 
            onClick={fetchSettings} 
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.55rem 1rem' }}
          >
            <RefreshCw size={15} />
            Refresh Status
          </button>
        </div>
      </div>

      {/* System Status Banner */}
      <div style={{ 
        backgroundColor: '#1E293B', 
        border: '1px solid #334155', 
        borderRadius: '12px', 
        padding: '1.25rem 1.5rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ 
            backgroundColor: '#10B98120', 
            color: '#10B981', 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Server size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Server Environment</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC', textTransform: 'capitalize' }}>
              {settings?.environment || 'development'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ 
            backgroundColor: '#6366F120', 
            color: '#818CF8', 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Cpu size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Active Mode</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#F8FAFC' }}>
              {settings?.demoModeEnabled ? 'Test Sandbox + Demo Fallback' : 'Direct API Sandbox'}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{ 
            backgroundColor: '#0EA5E920', 
            color: '#38BDF8', 
            width: '42px', 
            height: '42px', 
            borderRadius: '10px', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center' 
          }}>
            <Lock size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Secret Protection</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#10B981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <CheckCircle2 size={15} /> Redacted & Safe
            </div>
          </div>
        </div>
      </div>

      {/* Gateway Cards Grid */}
      <div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC', marginBottom: '1rem' }}>
          Payment Gateway Providers
        </h2>

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
      <div style={{ backgroundColor: '#1E293B', border: '1px solid #334155', borderRadius: '12px', padding: '1.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ backgroundColor: '#818CF820', color: '#818CF8', padding: '8px', borderRadius: '8px', display: 'flex' }}>
            <Lock size={20} />
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#F8FAFC' }}>
              Built-in Enterprise Security Controls
            </h2>
            <p style={{ margin: 0, color: '#94A3B8', fontSize: '0.85rem' }}>
              OWASP Top 10 defenses, idempotent webhook processing, and cryptographic verification
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))', gap: '1.25rem', fontSize: '0.875rem' }}>
          
          <div style={{ backgroundColor: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              HMAC Webhook Signatures
            </div>
            <p style={{ color: '#94A3B8', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Raw HTTP body stream preservation ensures byte-for-byte HMAC-SHA256 signature verification via <code style={{ color: '#818CF8' }}>crypto.timingSafeEqual</code> preventing timing attacks.
            </p>
          </div>

          <div style={{ backgroundColor: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              IDOR & Tenant Isolation
            </div>
            <p style={{ color: '#94A3B8', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Every link read, sync, and cancellation query enforces ownership checks (<code style={{ color: '#818CF8' }}>userId: req.user._id</code>). No merchant can inspect another merchant’s data.
            </p>
          </div>

          <div style={{ backgroundColor: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              Integer Minor-Unit Currency
            </div>
            <p style={{ color: '#94A3B8', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Zero IEEE 754 floating-point drift. All calculations, limits, and gateway payloads use integer minor units (cents/paise) with explicit zero-decimal currency mapping (JPY).
            </p>
          </div>

          <div style={{ backgroundColor: '#0F172A', padding: '1rem', borderRadius: '8px', border: '1px solid #334155' }}>
            <div style={{ fontWeight: 600, color: '#F8FAFC', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '0.4rem' }}>
              <CheckCircle2 size={16} style={{ color: '#10B981' }} />
              Idempotent Webhook Events
            </div>
            <p style={{ color: '#94A3B8', margin: 0, lineHeight: 1.5, fontSize: '0.82rem' }}>
              Webhook event IDs are indexed and persisted with atomic check-and-insert. Duplicate deliveries from gateway retries are acknowledged safely without double-charging or corrupting status.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}

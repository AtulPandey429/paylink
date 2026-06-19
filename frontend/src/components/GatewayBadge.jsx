import React from 'react';
import { CreditCard, Zap, Shield, Sparkles } from 'lucide-react';

export default function GatewayBadge({ gateway, isDemo }) {
  const gw = String(gateway || 'stripe').toLowerCase();

  switch (gw) {
    case 'stripe':
      return (
        <span className="gateway-badge gateway-stripe">
          <CreditCard size={12} strokeWidth={2.2} />
          <span>Stripe</span>
          {isDemo && <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>· DEMO</span>}
        </span>
      );
    case 'razorpay':
      return (
        <span className="gateway-badge gateway-razorpay">
          <Zap size={12} strokeWidth={2.2} />
          <span>Razorpay</span>
          {isDemo && <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>· DEMO</span>}
        </span>
      );
    case 'cashfree':
      return (
        <span className="gateway-badge gateway-cashfree">
          <Shield size={12} strokeWidth={2.2} />
          <span>Cashfree</span>
          {isDemo && <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>· DEMO</span>}
        </span>
      );
    case 'demo':
    default:
      return (
        <span className="gateway-badge gateway-demo">
          <Sparkles size={12} strokeWidth={2.2} />
          <span>Simulator</span>
        </span>
      );
  }
}


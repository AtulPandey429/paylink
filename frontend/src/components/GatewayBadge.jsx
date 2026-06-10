import React from 'react';
import { CreditCard, Zap, Shield, Sparkles } from 'lucide-react';

export default function GatewayBadge({ gateway, isDemo }) {
  const gw = String(gateway || 'stripe').toLowerCase();

  switch (gw) {
    case 'stripe':
      return (
        <span className="gateway-badge gateway-stripe">
          <CreditCard size={12} />
          Stripe {isDemo && '(Demo)'}
        </span>
      );
    case 'razorpay':
      return (
        <span className="gateway-badge gateway-razorpay">
          <Zap size={12} />
          Razorpay {isDemo && '(Demo)'}
        </span>
      );
    case 'cashfree':
      return (
        <span className="gateway-badge gateway-cashfree">
          <Shield size={12} />
          Cashfree {isDemo && '(Demo)'}
        </span>
      );
    case 'demo':
    default:
      return (
        <span className="gateway-badge gateway-demo">
          <Sparkles size={12} />
          Demo Simulator
        </span>
      );
  }
}

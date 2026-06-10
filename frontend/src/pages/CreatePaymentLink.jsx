import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Zap, Shield, Sparkles, Check, ArrowRight, AlertCircle, Info, Calendar } from 'lucide-react';
import api, { getErrorMessage } from '../api/client';
import { createPaymentLink } from '../api/paymentLinks';
import { useToast } from '../context/ToastContext';
import GatewayBadge from '../components/GatewayBadge';
import GatewaySelector from '../components/GatewaySelector';
import LivePreviewCard from '../components/LivePreviewCard';

const GATEWAY_SPECS = [
  {
    id: 'stripe',
    name: 'Stripe',
    currencies: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD'],
    defaultCurrency: 'USD',
    minAmounts: { USD: 0.50, EUR: 0.50, INR: 50.00, GBP: 0.30 },
    icon: CreditCard,
    color: '#635BFF',
    tagline: 'Global Checkout: Cards, Apple Pay, Google Pay, 135+ currencies'
  },
  {
    id: 'razorpay',
    name: 'Razorpay',
    currencies: ['INR', 'USD', 'EUR', 'GBP'],
    defaultCurrency: 'INR',
    minAmounts: { INR: 1.00, USD: 1.00 },
    icon: Zap,
    color: '#0EA5E9',
    tagline: 'India & Global: UPI, RuPay, Netbanking, Cards & Instant Reminders'
  },
  {
    id: 'cashfree',
    name: 'Cashfree',
    currencies: ['INR'],
    defaultCurrency: 'INR',
    minAmounts: { INR: 1.00 },
    icon: Shield,
    color: '#10B981',
    tagline: 'High-Volume India PG: Zero-Drop UPI, Cards, Netbanking, PayLater'
  },
  {
    id: 'demo',
    name: 'Demo Simulator',
    currencies: ['USD', 'INR', 'EUR', 'GBP'],
    defaultCurrency: 'USD',
    minAmounts: { USD: 0.50, INR: 1.00 },
    icon: Sparkles,
    color: '#F59E0B',
    tagline: 'Realistic Sandbox Simulator: Test checkout flow & instant webhooks'
  }
];

export default function CreatePaymentLink() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [selectedGateway, setSelectedGateway] = useState('stripe');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('49.00');
  const [currency, setCurrency] = useState('USD');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const currentGatewaySpec = GATEWAY_SPECS.find((g) => g.id === selectedGateway) || GATEWAY_SPECS[0];

  const handleGatewayChange = (gwId) => {
    setSelectedGateway(gwId);
    const spec = GATEWAY_SPECS.find((g) => g.id === gwId);
    if (spec && !spec.currencies.includes(currency)) {
      setCurrency(spec.defaultCurrency);
    }
  };

  const validateForm = () => {
    const errs = {};
    if (!title.trim() || title.trim().length < 3) {
      errs.title = 'Title must be at least 3 characters long';
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      errs.amount = 'Please enter a valid amount greater than 0';
    } else {
      const minAmount = currentGatewaySpec.minAmounts[currency] || 0.50;
      if (numAmount < minAmount) {
        errs.amount = `Minimum amount for ${currentGatewaySpec.name} in ${currency} is ${minAmount}`;
      }
    }
    if (customerEmail && !/^\S+@\S+\.\S+$/.test(customerEmail.trim())) {
      errs.customerEmail = 'Please provide a valid email format';
    }
    if (customerPhone && !/^\+?[0-9]{7,15}$/.test(customerPhone.trim())) {
      errs.customerPhone = 'Please provide a valid phone number (7-15 digits)';
    }
    if (expiresAt && new Date(expiresAt) <= new Date()) {
      errs.expiresAt = 'Expiry date must be in the future';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading || !validateForm()) return;

    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        amount: parseFloat(amount),
        currency: currency.toUpperCase(),
        gateway: selectedGateway,
        customer: {
          name: customerName.trim() || undefined,
          email: customerEmail.trim() || undefined,
          phone: customerPhone.trim() || undefined
        },
        expiresAt: expiresAt || undefined
      };

      const res = await createPaymentLink(payload);
      if (res.success) {
        showToast('Payment link created successfully!', 'success');
        navigate(`/links/${res.data.link._id}`);
      }
    } catch (err) {
      const msg = getErrorMessage(err, 'Failed to create payment link');
      showToast(msg, 'error');
      if (err.response?.data?.details) {
        setErrors((prev) => ({ ...prev, ...err.response.data.details }));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.75rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Create New Payment Link</h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Select gateway provider, define amount, customer info, and generate an authenticated checkout link
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '2rem', alignItems: 'flex-start' }}>
        {/* Form Container */}
        <form onSubmit={handleSubmit} className="card">
          {/* Gateway Selector Cards */}
          <div className="form-group" style={{ marginBottom: '1.75rem' }}>
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>1. Select Payment Gateway</label>
            <GatewaySelector
              specs={GATEWAY_SPECS}
              selectedGateway={selectedGateway}
              onSelectGateway={handleGatewayChange}
            />
          </div>

          {/* Title / Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="title">2. Link Description / Purpose *</label>
            <input
              id="title"
              type="text"
              className="form-input"
              placeholder="e.g. Annual Cloud Hosting Plan, Consulting Retainer"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            {errors.title && <div className="form-error">{errors.title}</div>}
          </div>

          {/* Amount & Currency */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="amount">3. Amount *</label>
              <input
                id="amount"
                type="number"
                step="0.01"
                min="0.01"
                className="form-input"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              {errors.amount && <div className="form-error">{errors.amount}</div>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="currency">Currency *</label>
              <select
                id="currency"
                className="form-select"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {currentGatewaySpec.currencies.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Customer Details Accordion */}
          <div style={{ borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'block' }}>
              4. Customer Details (Optional)
            </span>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
              <div className="form-group">
                <label className="form-label" htmlFor="customerName">Full Name</label>
                <input
                  id="customerName"
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Miller"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="customerEmail">Email Address</label>
                <input
                  id="customerEmail"
                  type="email"
                  className="form-input"
                  placeholder="john@example.com"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                />
                {errors.customerEmail && <div className="form-error">{errors.customerEmail}</div>}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="customerPhone">Phone Number</label>
                <input
                  id="customerPhone"
                  type="tel"
                  className="form-input"
                  placeholder="+919876543210"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                />
                {errors.customerPhone && <div className="form-error">{errors.customerPhone}</div>}
              </div>
            </div>
          </div>

          {/* Expiry Date */}
          <div className="form-group" style={{ marginTop: '0.5rem' }}>
            <label className="form-label" htmlFor="expiresAt">
              5. Expiry Date & Time (Optional)
            </label>
            <input
              id="expiresAt"
              type="datetime-local"
              className="form-input"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
            {errors.expiresAt && <div className="form-error">{errors.expiresAt}</div>}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1.25rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate('/links')}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ minWidth: '160px' }}
            >
              {loading ? 'Generating Link...' : 'Generate Payment Link'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>

        {/* Live Preview Card */}
        <LivePreviewCard
          selectedGateway={selectedGateway}
          title={title}
          amount={amount}
          currency={currency}
          customerName={customerName}
          customerEmail={customerEmail}
        />
      </div>
    </div>
  );
}

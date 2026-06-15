import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in both email and password.');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      showToast('Welcome back to PayLink!', 'success');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setEmail('merchant@paylink.dev');
    setPassword('Password123!');
    setLoading(true);
    setError('');
    try {
      await login('merchant@paylink.dev', 'Password123!');
      showToast('Logged in as Demo Merchant', 'success');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Demo login failed. Please ensure the database has been seeded.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card">
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            backgroundColor: '#4F46E5',
            color: '#FFFFFF',
            marginBottom: '1rem',
            boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)'
          }}>
            <Link2 size={26} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F9FAFB', margin: 0, letterSpacing: '-0.02em' }}>
            PayLink
          </h1>
          <p style={{ color: '#9CA3AF', fontSize: '0.875rem', marginTop: '0.35rem' }}>
            Secure Multi-Gateway Payment Orchestration
          </p>
        </div>

        {/* Demo Fast-Login Pill */}
        <div style={{
          backgroundColor: '#1E1B4B',
          border: '1px solid #3730A3',
          borderRadius: '10px',
          padding: '0.875rem 1rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#A5B4FC', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> Quick Demo Access
            </div>
            <div style={{ fontSize: '0.75rem', color: '#818CF8' }}>
              Instant login with test credentials
            </div>
          </div>
          <button
            type="button"
            onClick={handleDemoLogin}
            disabled={loading}
            className="btn btn-primary"
            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem' }}
          >
            1-Click Login
          </button>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#7F1D1D30',
            border: '1px solid #DC2626',
            color: '#FCA5A5',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#E5E7EB', marginBottom: '0.35rem' }}>
              Merchant Email
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="merchant@example.com"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#E5E7EB', marginBottom: '0.35rem' }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="input-field"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem' }}
          >
            {loading ? 'Authenticating...' : (
              <>
                Sign In to Dashboard <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#9CA3AF' }}>
          Don't have an account?{' '}
          <Link to="/register" style={{ color: '#818CF8', fontWeight: 600, textDecoration: 'none' }}>
            Create one
          </Link>
        </div>

        {/* Security badge footer */}
        <div style={{
          marginTop: '2rem',
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
          <span>Strict Tenant Isolation • HMAC-SHA256 Webhooks</span>
        </div>
      </div>
    </div>
  );
}

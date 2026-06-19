import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Link2, Lock, Mail, User, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError('');

    if (!name.trim() || !email.trim() || !password) {
      setError('All fields are required.');
      return;
    }

    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please provide a valid email format.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await register(name.trim(), email.trim(), password);
      showToast('Merchant account created successfully!', 'success');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-container">
      <div className="auth-card" style={{ boxShadow: 'var(--shadow-card), 0 25px 60px -15px rgba(0, 0, 0, 0.8)' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
            color: '#FFFFFF',
            marginBottom: '1rem',
            boxShadow: '0 0 25px rgba(99, 102, 241, 0.45)'
          }}>
            <Link2 size={26} strokeWidth={2.5} />
          </div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>
            Create Account
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.35rem' }}>
            Get started with PayLink Multi-Gateway Platform
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: 'var(--danger-light)',
            border: '1px solid rgba(244, 63, 94, 0.4)',
            color: '#FCA5A5',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
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

        {/* Register Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Full Name / Business Name
            </label>
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Payments Inc."
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Email Address
            </label>
            <div style={{ position: 'relative' }}>
              <Mail size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@acme.com"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Password (min. 8 characters)
            </label>
            <div style={{ position: 'relative' }}>
              <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-dim)' }} />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="form-input"
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
            {loading ? 'Creating Account...' : (
              <>
                <span>Register & Start</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
          Already have an account?{' '}
          <Link to="/login" style={{ color: '#818CF8', fontWeight: 600, textDecoration: 'none' }}>
            Sign in
          </Link>
        </div>

        {/* Security badge footer */}
        <div style={{
          marginTop: '2rem',
          paddingTop: '1rem',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          color: 'var(--text-dim)',
          fontSize: '0.75rem'
        }}>
          <ShieldCheck size={14} style={{ color: '#10B981' }} />
          <span>Bcrypt salted passwords • Standard JWT tokens</span>
        </div>
      </div>
    </div>
  );
}


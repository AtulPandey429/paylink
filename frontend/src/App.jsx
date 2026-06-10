import React, { useState } from 'react';
import { Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';

// Pages
import Dashboard from './pages/Dashboard';
import PaymentLinksList from './pages/PaymentLinksList';
import CreatePaymentLink from './pages/CreatePaymentLink';
import PaymentLinkDetail from './pages/PaymentLinkDetail';
import PublicPayPreview from './pages/PublicPayPreview';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancelled from './pages/PaymentCancelled';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Register from './pages/Register';

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0B0F17',
        color: '#94A3B8'
      }}>
        <div className="spinner" style={{ width: '40px', height: '40px', borderColor: '#6366F1', borderTopColor: 'transparent' }} />
        <p style={{ marginTop: '1rem', fontSize: '0.9rem' }}>Initializing PayLink Security Context...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Overview';
    if (pathname === '/links') return 'Payment Links';
    if (pathname === '/links/create') return 'Create Payment Link';
    if (pathname.startsWith('/links/')) return 'Payment Link Details';
    if (pathname === '/settings') return 'Gateways & Settings';
    return 'PayLink';
  };

  return (
    <div className="app-layout">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar 
          title={getPageTitle(location.pathname)} 
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} 
        />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Public Customer-Facing & Auth Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/pay/preview/:id" element={<PublicPayPreview />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-cancelled" element={<PaymentCancelled />} />

      {/* Protected Merchant Operations */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/links" element={<PaymentLinksList />} />
        <Route path="/links/create" element={<CreatePaymentLink />} />
        <Route path="/links/:id" element={<PaymentLinkDetail />} />
        <Route path="/settings" element={<Settings />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

import React from 'react';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Ban } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase();

  switch (normalized) {
    case 'paid':
      return (
        <span className="badge badge-paid" style={{ boxShadow: '0 0 10px rgba(16, 185, 129, 0.2)' }}>
          <CheckCircle2 size={12} strokeWidth={2.5} />
          <span>Paid</span>
        </span>
      );
    case 'cancelled':
      return (
        <span className="badge badge-cancelled">
          <Ban size={12} strokeWidth={2} />
          <span>Cancelled</span>
        </span>
      );
    case 'expired':
      return (
        <span className="badge badge-expired">
          <XCircle size={12} strokeWidth={2} />
          <span>Expired</span>
        </span>
      );
    case 'failed':
      return (
        <span className="badge badge-failed" style={{ boxShadow: '0 0 10px rgba(244, 63, 94, 0.2)' }}>
          <AlertTriangle size={12} strokeWidth={2.5} />
          <span>Failed</span>
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="badge badge-pending" style={{ boxShadow: '0 0 10px rgba(245, 158, 11, 0.15)' }}>
          <span className="status-dot-ping" style={{ backgroundColor: '#F59E0B', width: '6px', height: '6px' }} />
          <span>Pending</span>
        </span>
      );
  }
}


import React from 'react';
import { Clock, CheckCircle, XCircle, AlertTriangle, Ban } from 'lucide-react';

export default function StatusBadge({ status }) {
  const normalized = String(status || 'pending').toLowerCase();

  switch (normalized) {
    case 'paid':
      return (
        <span className="badge badge-paid">
          <CheckCircle size={12} />
          Paid
        </span>
      );
    case 'cancelled':
      return (
        <span className="badge badge-cancelled">
          <Ban size={12} />
          Cancelled
        </span>
      );
    case 'expired':
      return (
        <span className="badge badge-expired">
          <XCircle size={12} />
          Expired
        </span>
      );
    case 'failed':
      return (
        <span className="badge badge-failed">
          <AlertTriangle size={12} />
          Failed
        </span>
      );
    case 'pending':
    default:
      return (
        <span className="badge badge-pending">
          <Clock size={12} />
          Pending
        </span>
      );
  }
}

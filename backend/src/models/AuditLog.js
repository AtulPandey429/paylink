const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true
  },
  paymentLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentLink',
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: [
      'LINK_CREATED',
      'STATUS_SYNCED',
      'LINK_CANCELLED',
      'WEBHOOK_RECEIVED',
      'PAYMENT_CAPTURED',
      'PAYMENT_FAILED',
      'LINK_EXPIRED'
    ],
    required: true
  },
  gateway: {
    type: String
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String
  }
}, {
  timestamps: true
});

auditLogSchema.index({ paymentLinkId: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);
module.exports = AuditLog;

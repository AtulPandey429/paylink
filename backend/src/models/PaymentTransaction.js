const mongoose = require('mongoose');

const paymentTransactionSchema = new mongoose.Schema({
  paymentLinkId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PaymentLink',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  gateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'cashfree', 'demo'],
    required: true
  },
  gatewayPaymentId: {
    type: String,
    required: true
  },
  gatewayOrderId: {
    type: String
  },
  amount: {
    type: Number,
    required: true
  },
  amountMinor: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    required: true,
    uppercase: true
  },
  status: {
    type: String,
    enum: ['captured', 'failed', 'refunded', 'pending'],
    default: 'captured'
  },
  paymentMethod: {
    type: String
  },
  fee: {
    type: Number
  },
  tax: {
    type: Number
  },
  rawGatewayResponse: {
    type: mongoose.Schema.Types.Mixed
  },
  errorMessage: {
    type: String
  }
}, {
  timestamps: true
});

paymentTransactionSchema.index({ userId: 1, createdAt: -1 });
paymentTransactionSchema.index({ gateway: 1, gatewayPaymentId: 1 }, { unique: true, sparse: true });

const PaymentTransaction = mongoose.model('PaymentTransaction', paymentTransactionSchema);
module.exports = PaymentTransaction;

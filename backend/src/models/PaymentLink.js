const mongoose = require('mongoose');

const paymentLinkSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  title: {
    type: String,
    required: [true, 'Title/description is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than zero']
  },
  amountMinor: {
    type: Number,
    required: [true, 'Amount in minor units is required'],
    min: 1
  },
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    uppercase: true,
    trim: true,
    minlength: 3,
    maxlength: 3
  },
  gateway: {
    type: String,
    required: [true, 'Payment gateway is required'],
    enum: ['stripe', 'razorpay', 'cashfree', 'demo']
  },
  gatewayLinkId: {
    type: String,
    required: true,
    trim: true
  },
  gatewayPaymentUrl: {
    type: String,
    required: true,
    trim: true
  },
  shortUrl: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'expired', 'cancelled'],
    default: 'pending',
    index: true
  },
  gatewayRawStatus: {
    type: String,
    default: 'created'
  },
  customer: {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    phone: { type: String, trim: true }
  },
  expiresAt: {
    type: Date
  },
  paidAt: {
    type: Date
  },
  paymentDetails: {
    paymentId: { type: String },
    method: { type: String },
    gatewayFee: { type: Number },
    bankReference: { type: String },
    receiptUrl: { type: String }
  },
  isDemo: {
    type: Boolean,
    default: false
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

// Compound indexes for performant querying and isolation
paymentLinkSchema.index({ userId: 1, createdAt: -1 });
paymentLinkSchema.index({ gateway: 1, gatewayLinkId: 1 }, { unique: true, sparse: true });
paymentLinkSchema.index({ userId: 1, status: 1 });
paymentLinkSchema.index({ userId: 1, gateway: 1 });

const PaymentLink = mongoose.model('PaymentLink', paymentLinkSchema);
module.exports = PaymentLink;

const mongoose = require('mongoose');

const webhookEventSchema = new mongoose.Schema({
  gateway: {
    type: String,
    enum: ['stripe', 'razorpay', 'cashfree', 'demo'],
    required: true
  },
  eventId: {
    type: String,
    required: true
  },
  idempotencyKey: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  eventType: {
    type: String,
    required: true
  },
  payload: {
    type: mongoose.Schema.Types.Mixed
  },
  processed: {
    type: Boolean,
    default: false
  },
  processedAt: {
    type: Date
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

webhookEventSchema.index({ gateway: 1, createdAt: -1 });

const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema);
module.exports = WebhookEvent;

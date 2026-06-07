const Razorpay = require('razorpay');
const BaseProvider = require('./base.provider');
const config = require('../config/env');
const logger = require('../utils/logger');
const { computeHmacSha256Hex, safeCompare } = require('../utils/signature');
const { fromMinorUnits } = require('../utils/currency');
const crypto = require('crypto');

class RazorpayProvider extends BaseProvider {
  constructor(customConfig = null) {
    super('razorpay');
    this.config = customConfig || config.razorpay;
    this.client = (this.config.keyId && this.config.keySecret) ? new Razorpay({
      key_id: this.config.keyId,
      key_secret: this.config.keySecret
    }) : null;
  }

  isConfigured() {
    return Boolean(this.client && this.config.isConfigured);
  }

  async createPaymentLink({ linkId, title, amountMinor, currency, customer, returnUrl, expiresAt }) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured with valid Key ID and Key Secret.');
    }

    try {
      const payload = {
        amount: amountMinor, // in paise
        currency: currency.toUpperCase(),
        accept_partial: false,
        description: title.slice(0, 255),
        customer: {
          name: customer?.name || 'Valued Customer',
          email: customer?.email || undefined,
          contact: customer?.phone || undefined
        },
        notify: {
          sms: false,
          email: false
        },
        reminder_enable: false,
        notes: {
          internalLinkId: String(linkId)
        },
        callback_url: returnUrl || `${config.clientUrl}${config.routes?.paymentSuccessPath || '/payment-success'}?linkId=${linkId}`,
        callback_method: 'get'
      };

      if (expiresAt) {
        const expireEpoch = Math.floor(new Date(expiresAt).getTime() / 1000);
        const minExpiry = Math.floor(Date.now() / 1000) + 900; // at least 15 min
        if (expireEpoch > minExpiry) {
          payload.expire_by = expireEpoch;
        }
      }

      const response = await this.client.paymentLink.create(payload);

      return {
        gatewayLinkId: response.id,
        gatewayPaymentUrl: response.short_url,
        shortUrl: response.short_url,
        rawStatus: response.status,
        rawResponse: {
          id: response.id,
          short_url: response.short_url,
          status: response.status
        }
      };
    } catch (error) {
      logger.error('Razorpay createPaymentLink error', error);
      throw new Error(`Razorpay link creation failed: ${error.error?.description || error.message}`);
    }
  }

  async getPaymentStatus(gatewayLinkId) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured with valid Key ID and Key Secret.');
    }

    try {
      const response = await this.client.paymentLink.fetch(gatewayLinkId);

      let normalizedStatus = 'pending';
      let paidAt = null;
      let paymentId = null;
      let method = 'upi';
      let gatewayFee = 0;

      if (response.status === 'paid') {
        normalizedStatus = 'paid';
        paidAt = response.updated_at ? new Date(response.updated_at * 1000) : new Date();
        if (response.payments && response.payments.length > 0) {
          const lastPayment = response.payments[response.payments.length - 1];
          paymentId = lastPayment.payment_id || lastPayment.id;
          method = lastPayment.method || 'upi';
        }
      } else if (response.status === 'cancelled') {
        normalizedStatus = 'cancelled';
      } else if (response.status === 'expired') {
        normalizedStatus = 'expired';
      }

      return {
        status: normalizedStatus,
        paidAt,
        paymentId: paymentId || response.id,
        method,
        gatewayFee,
        rawStatus: response.status,
        rawResponse: {
          id: response.id,
          status: response.status,
          amount_paid: response.amount_paid
        }
      };
    } catch (error) {
      logger.error('Razorpay getPaymentStatus error', error);
      throw new Error(`Razorpay status fetch failed: ${error.error?.description || error.message}`);
    }
  }

  async cancelPaymentLink(gatewayLinkId) {
    if (!this.isConfigured()) {
      throw new Error('Razorpay is not configured with valid Key ID and Key Secret.');
    }

    try {
      const response = await this.client.paymentLink.cancel(gatewayLinkId);
      return {
        success: true,
        rawStatus: response.status,
        rawResponse: response
      };
    } catch (error) {
      logger.error('Razorpay cancelPaymentLink error', error);
      throw new Error(`Razorpay link cancellation failed: ${error.error?.description || error.message}`);
    }
  }

  async verifyWebhook(headers, rawBody) {
    const signature = headers['x-razorpay-signature'];
    const webhookSecret = this.config.webhookSecret;

    if (!signature || !webhookSecret) {
      return {
        isValid: false,
        error: 'Missing x-razorpay-signature header or webhook secret'
      };
    }

    try {
      const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
      const expectedSignature = computeHmacSha256Hex(webhookSecret, bodyStr);

      const isValid = safeCompare(signature, expectedSignature);
      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid Razorpay webhook signature'
        };
      }

      const event = JSON.parse(bodyStr);
      const eventType = event.event;
      const entity = event.payload?.payment_link?.entity || event.payload?.payment?.entity || {};

      let paymentLinkId = entity.notes?.internalLinkId;
      let status = 'pending';
      let amount = 0;
      let currency = entity.currency ? entity.currency.toUpperCase() : 'INR';
      let paymentId = entity.id;

      if (eventType === 'payment_link.paid') {
        status = 'paid';
        amount = fromMinorUnits(entity.amount_paid || entity.amount || 0, currency);
        paymentId = event.payload?.payment?.entity?.id || entity.id;
      } else if (eventType === 'payment_link.cancelled') {
        status = 'cancelled';
      } else if (eventType === 'payment_link.expired') {
        status = 'expired';
      } else if (eventType === 'payment.captured') {
        status = 'paid';
        amount = fromMinorUnits(entity.amount || 0, currency);
      } else if (eventType === 'payment.failed') {
        status = 'failed';
      }

      const payloadHash = crypto.createHash('sha256').update(bodyStr).digest('hex').slice(0, 16);
      const eventId = event.id || (entity.id ? `${eventType}_${entity.id}` : `rzp_${payloadHash}`);

      return {
        isValid: true,
        eventId,
        eventType,
        paymentLinkId,
        gatewayLinkId: entity.id,
        status,
        amount,
        currency,
        paymentId,
        rawPayload: event
      };
    } catch (error) {
      logger.warn('Razorpay webhook processing error', { error: error.message });
      return {
        isValid: false,
        error: error.message
      };
    }
  }
}

module.exports = RazorpayProvider;

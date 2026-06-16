const axios = require('axios');
const BaseProvider = require('./base.provider');
const config = require('../config/env');
const logger = require('../utils/logger');
const { computeHmacSha256Base64, safeCompare } = require('../utils/signature');
const crypto = require('crypto');

class CashfreeProvider extends BaseProvider {
  constructor(customConfig = null) {
    super('cashfree');
    this.config = customConfig || config.cashfree;
  }

  isConfigured() {
    return Boolean(this.config.appId && this.config.secretKey && this.config.isConfigured);
  }

  getHeaders() {
    return {
      'x-client-id': this.config.appId,
      'x-client-secret': this.config.secretKey,
      'x-api-version': this.config.apiVersion,
      'Content-Type': 'application/json'
    };
  }

  async createPaymentLink({ linkId, title, amount, currency, customer, returnUrl, expiresAt }) {
    if (!this.isConfigured()) {
      throw new Error('Cashfree is not configured with valid App ID and Secret Key.');
    }

    try {
      const payload = {
        link_id: `plink_${linkId}_${Date.now().toString(36)}`,
        link_amount: Number(amount.toFixed(2)),
        link_currency: currency.toUpperCase(),
        link_purpose: title.slice(0, 100),
        customer_details: {
          customer_phone: customer?.phone || this.config.defaultCustomerPhone || '9999999999',
          customer_email: customer?.email || 'customer@example.com',
          customer_name: customer?.name || 'Customer'
        },
        link_notify: {
          send_sms: false,
          send_email: false
        },
        link_meta: {
          return_url: returnUrl || `${config.clientUrl}${config.routes?.paymentSuccessPath || '/payment-success'}?linkId=${linkId}&cf_link_id={link_id}`
        }
      };

      if (expiresAt) {
        payload.link_expiry_time = new Date(expiresAt).toISOString();
      }

      const response = await axios.post(`${this.config.baseUrl}/links`, payload, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      const data = response.data;

      return {
        gatewayLinkId: data.link_id,
        gatewayPaymentUrl: data.link_url,
        shortUrl: data.link_url,
        rawStatus: data.link_status,
        rawResponse: {
          link_id: data.link_id,
          link_url: data.link_url,
          link_status: data.link_status
        }
      };
    } catch (error) {
      logger.error('Cashfree createPaymentLink error', error.response?.data || error);
      const msg = error.response?.data?.message || error.message;
      throw new Error(`Cashfree link creation failed: ${msg}`);
    }
  }

  async getPaymentStatus(gatewayLinkId) {
    if (!this.isConfigured()) {
      throw new Error('Cashfree is not configured with valid App ID and Secret Key.');
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/links/${gatewayLinkId}`, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      const data = response.data;
      let normalizedStatus = 'pending';
      let paidAt = null;
      let paymentId = null;

      if (data.link_status === 'PAID') {
        normalizedStatus = 'paid';
        paidAt = new Date();
      } else if (data.link_status === 'CANCELLED') {
        normalizedStatus = 'cancelled';
      } else if (data.link_status === 'EXPIRED') {
        normalizedStatus = 'expired';
      }

      return {
        status: normalizedStatus,
        paidAt,
        paymentId: paymentId || data.link_id,
        method: 'upi',
        gatewayFee: 0,
        rawStatus: data.link_status,
        rawResponse: data
      };
    } catch (error) {
      logger.error('Cashfree getPaymentStatus error', error.response?.data || error);
      const msg = error.response?.data?.message || error.message;
      throw new Error(`Cashfree status fetch failed: ${msg}`);
    }
  }

  async cancelPaymentLink(gatewayLinkId) {
    if (!this.isConfigured()) {
      throw new Error('Cashfree is not configured with valid App ID and Secret Key.');
    }

    try {
      const response = await axios.post(`${this.config.baseUrl}/links/${gatewayLinkId}/cancel`, {}, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      return {
        success: true,
        rawStatus: response.data.link_status,
        rawResponse: response.data
      };
    } catch (error) {
      logger.error('Cashfree cancelPaymentLink error', error.response?.data || error);
      const msg = error.response?.data?.message || error.message;
      throw new Error(`Cashfree link cancellation failed: ${msg}`);
    }
  }

  async verifyWebhook(headers, rawBody) {
    const signature = headers['x-webhook-signature'];
    const timestamp = headers['x-webhook-timestamp'];
    const secretKey = this.config.secretKey;

    if (!signature || !timestamp || !secretKey) {
      return {
        isValid: false,
        error: 'Missing Cashfree webhook signature, timestamp, or secret key'
      };
    }

    try {
      const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);
      // Signature algorithm for Cashfree PG v2023-08-01
      const signString = `${timestamp}${bodyStr}`;
      const expectedSignature = computeHmacSha256Base64(secretKey, signString);

      const isValid = safeCompare(signature, expectedSignature);
      if (!isValid) {
        return {
          isValid: false,
          error: 'Invalid Cashfree webhook signature'
        };
      }

      const event = JSON.parse(bodyStr);
      const eventType = event.type || event.event || 'PAYMENT_LINK_EVENT';
      const data = event.data || event;
      const linkDetails = data.link_details || data.order || {};

      let gatewayLinkId = linkDetails.link_id || data.link_id || data.order?.order_id;
      let paymentLinkId = gatewayLinkId;
      let status = 'pending';
      let amount = Number(data.payment?.payment_amount || linkDetails.link_amount || data.order?.order_amount || 0);
      let currency = linkDetails.link_currency || data.order?.order_currency || 'INR';
      let paymentId = data.payment?.cf_payment_id || data.payment?.payment_id || gatewayLinkId;

      if (eventType.includes('PAID') || eventType.includes('SUCCESS') || linkDetails.link_status === 'PAID') {
        status = 'paid';
      } else if (eventType.includes('FAILED') || linkDetails.link_status === 'FAILED') {
        status = 'failed';
      } else if (eventType.includes('CANCELLED') || eventType.includes('DROPPED')) {
        status = 'cancelled';
      }

      const payloadHash = crypto.createHash('sha256').update(signString).digest('hex').slice(0, 16);
      const eventId = event.event_id || (paymentId ? `${eventType}_${paymentId}` : `cf_${payloadHash}`);

      return {
        isValid: true,
        eventId,
        eventType,
        paymentLinkId,
        gatewayLinkId,
        status,
        amount,
        currency,
        paymentId,
        rawPayload: event
      };
    } catch (error) {
      logger.warn('Cashfree webhook processing error', { error: error.message });
      return {
        isValid: false,
        error: error.message
      };
    }
  }
}

module.exports = CashfreeProvider;

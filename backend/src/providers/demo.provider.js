const BaseProvider = require('./base.provider');
const config = require('../config/env');
const { computeHmacSha256Hex, safeCompare } = require('../utils/signature');
const crypto = require('crypto');

class DemoProvider extends BaseProvider {
  constructor() {
    super('demo');
    this.secret = config.demoMode.webhookSecret;
  }

  isConfigured() {
    return true;
  }

  async createPaymentLink({ linkId, title, amount, amountMinor, currency, customer, returnUrl, expiresAt }) {
    // Artificial latency for realism from configuration
    await new Promise(r => setTimeout(r, config.demoMode.simulatedLatencyMs));

    const demoLinkId = `demo_pl_${linkId.toString().slice(-8)}_${Math.random().toString(36).substring(2, 6)}`;
    // The demo payment link takes the payer to the simulated payment preview page on the frontend
    const previewUrl = `${config.clientUrl}/pay/preview/${linkId}`;

    return {
      gatewayLinkId: demoLinkId,
      gatewayPaymentUrl: previewUrl,
      shortUrl: previewUrl,
      rawStatus: 'active',
      rawResponse: {
        id: demoLinkId,
        url: previewUrl,
        mode: 'demo_simulated',
        simulatedAt: new Date().toISOString()
      }
    };
  }

  async getPaymentStatus(gatewayLinkId) {
    await new Promise(r => setTimeout(r, Math.round(config.demoMode.simulatedLatencyMs / 2)));
    return {
      status: 'pending',
      paidAt: null,
      paymentId: `demo_pay_${Math.random().toString(36).substring(2, 10)}`,
      method: 'simulated_card',
      gatewayFee: 0,
      rawStatus: 'active',
      rawResponse: {
        gatewayLinkId,
        status: 'active'
      }
    };
  }

  async cancelPaymentLink(gatewayLinkId) {
    await new Promise(r => setTimeout(r, Math.round(config.demoMode.simulatedLatencyMs / 2)));
    return {
      success: true,
      rawStatus: 'cancelled',
      rawResponse: {
        id: gatewayLinkId,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      }
    };
  }

  async verifyWebhook(headers, rawBody) {
    const signature = headers['x-demo-signature'];
    const bodyStr = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : String(rawBody);

    if (!signature) {
      return {
        isValid: false,
        error: 'Missing x-demo-signature header'
      };
    }

    const expectedSignature = computeHmacSha256Hex(this.secret, bodyStr);
    const isValid = safeCompare(signature, expectedSignature);

    if (!isValid) {
      return {
        isValid: false,
        error: 'Invalid Demo webhook signature'
      };
    }

    try {
      const event = JSON.parse(bodyStr);
      const payloadHash = crypto.createHash('sha256').update(bodyStr).digest('hex').slice(0, 16);
      const eventId = event.eventId || `demo_evt_${payloadHash}`;
      const paymentId = event.paymentId || (event.paymentLinkId ? `demo_pay_${event.paymentLinkId}` : `demo_pay_${payloadHash}`);

      return {
        isValid: true,
        eventId,
        eventType: event.eventType || 'payment.simulated',
        paymentLinkId: event.paymentLinkId,
        gatewayLinkId: event.gatewayLinkId,
        status: event.status || 'paid',
        amount: event.amount,
        currency: event.currency,
        paymentId,
        rawPayload: event
      };
    } catch (err) {
      return {
        isValid: false,
        error: 'Malformed Demo webhook JSON'
      };
    }
  }

  /**
   * Helper to sign simulated events for demo preview tests.
   */
  signPayload(payload) {
    const bodyStr = JSON.stringify(payload);
    return computeHmacSha256Hex(this.secret, bodyStr);
  }
}

module.exports = DemoProvider;

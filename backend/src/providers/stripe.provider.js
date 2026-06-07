const Stripe = require('stripe');
const BaseProvider = require('./base.provider');
const config = require('../config/env');
const logger = require('../utils/logger');
const { fromMinorUnits } = require('../utils/currency');

class StripeProvider extends BaseProvider {
  constructor(customConfig = null) {
    super('stripe');
    this.config = customConfig || config.stripe;
    this.client = this.config.secretKey ? new Stripe(this.config.secretKey, {
      apiVersion: '2023-10-16',
      appInfo: {
        name: 'PayLink Multi-Gateway Platform',
        version: '1.0.0'
      }
    }) : null;
  }

  isConfigured() {
    return Boolean(this.client && this.config.isConfigured);
  }

  async createPaymentLink({ linkId, title, amountMinor, currency, customer, returnUrl, expiresAt }) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured with a valid secret key.');
    }

    try {
      const successPath = config.routes?.paymentSuccessPath || '/payment-success';
      const cancelPath = config.routes?.paymentCancelledPath || '/payment-cancelled';
      const successUrl = `${returnUrl || config.clientUrl}${successPath}?linkId=${linkId}&session_id={CHECKOUT_SESSION_ID}`;
      const cancelUrl = `${returnUrl || config.clientUrl}${cancelPath}?linkId=${linkId}`;

      const sessionParams = {
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              unit_amount: amountMinor,
              product_data: {
                name: title,
                description: `Invoice for PayLink #${linkId}`
              }
            },
            quantity: 1
          }
        ],
        client_reference_id: String(linkId),
        metadata: {
          internalLinkId: String(linkId),
          customerName: customer?.name || '',
          customerEmail: customer?.email || ''
        },
        success_url: successUrl,
        cancel_url: cancelUrl
      };

      if (customer?.email) {
        sessionParams.customer_email = customer.email;
      }

      if (expiresAt) {
        const expiresEpochSeconds = Math.floor(new Date(expiresAt).getTime() / 1000);
        // Stripe requires expires_at to be at least 30 minutes in the future and max 24h
        const minStripeExpiry = Math.floor(Date.now() / 1000) + 1800;
        if (expiresEpochSeconds > minStripeExpiry) {
          sessionParams.expires_at = expiresEpochSeconds;
        }
      }

      const session = await this.client.checkout.sessions.create(sessionParams);

      return {
        gatewayLinkId: session.id,
        gatewayPaymentUrl: session.url,
        shortUrl: session.url,
        rawStatus: session.status || 'open',
        rawResponse: {
          id: session.id,
          url: session.url,
          payment_status: session.payment_status,
          expires_at: session.expires_at
        }
      };
    } catch (error) {
      logger.error('Stripe createPaymentLink error', error);
      throw new Error(`Stripe link creation failed: ${error.message}`);
    }
  }

  async getPaymentStatus(gatewayLinkId) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured with a valid secret key.');
    }

    try {
      const session = await this.client.checkout.sessions.retrieve(gatewayLinkId, {
        expand: ['payment_intent']
      });

      let normalizedStatus = 'pending';
      let paidAt = null;
      let paymentId = null;
      let method = 'card';
      let gatewayFee = 0;

      if (session.payment_status === 'paid' || session.status === 'complete') {
        normalizedStatus = 'paid';
        paidAt = new Date();
      } else if (session.status === 'expired') {
        normalizedStatus = 'expired';
      }

      if (session.payment_intent && typeof session.payment_intent === 'object') {
        paymentId = session.payment_intent.id;
        if (session.payment_intent.payment_method_types?.[0]) {
          method = session.payment_intent.payment_method_types[0];
        }
      } else if (typeof session.payment_intent === 'string') {
        paymentId = session.payment_intent;
      }

      return {
        status: normalizedStatus,
        paidAt,
        paymentId,
        method,
        gatewayFee,
        rawStatus: session.status,
        rawResponse: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status
        }
      };
    } catch (error) {
      logger.error('Stripe getPaymentStatus error', error);
      throw new Error(`Stripe status fetch failed: ${error.message}`);
    }
  }

  async cancelPaymentLink(gatewayLinkId) {
    if (!this.isConfigured()) {
      throw new Error('Stripe is not configured with a valid secret key.');
    }

    try {
      const session = await this.client.checkout.sessions.expire(gatewayLinkId);
      return {
        success: true,
        rawStatus: session.status,
        rawResponse: { id: session.id, status: session.status }
      };
    } catch (error) {
      logger.error('Stripe cancelPaymentLink error', error);
      throw new Error(`Stripe link cancellation failed: ${error.message}`);
    }
  }

  async verifyWebhook(headers, rawBody) {
    const signature = headers['stripe-signature'];
    const webhookSecret = this.config.webhookSecret;

    if (!signature || !webhookSecret) {
      return {
        isValid: false,
        error: 'Missing stripe-signature header or webhook secret'
      };
    }

    try {
      const event = this.client.webhooks.constructEvent(rawBody, signature, webhookSecret);
      const dataObj = event.data.object;

      let paymentLinkId = dataObj.client_reference_id || dataObj.metadata?.internalLinkId;
      let status = 'pending';
      let paymentId = dataObj.id;
      let amount = 0;
      let currency = dataObj.currency ? dataObj.currency.toUpperCase() : 'USD';

      if (event.type === 'checkout.session.completed') {
        status = 'paid';
        paymentId = dataObj.payment_intent || dataObj.id;
        amount = fromMinorUnits(dataObj.amount_total || 0, currency);
      } else if (event.type === 'checkout.session.expired') {
        status = 'expired';
      } else if (event.type === 'payment_intent.succeeded') {
        status = 'paid';
        amount = fromMinorUnits(dataObj.amount || 0, currency);
      } else if (event.type === 'payment_intent.payment_failed') {
        status = 'failed';
      }

      return {
        isValid: true,
        eventId: event.id,
        eventType: event.type,
        paymentLinkId,
        gatewayLinkId: dataObj.id,
        status,
        amount,
        currency,
        paymentId,
        rawPayload: event
      };
    } catch (error) {
      logger.warn('Stripe webhook signature verification failed', { error: error.message });
      return {
        isValid: false,
        error: error.message
      };
    }
  }
}

module.exports = StripeProvider;

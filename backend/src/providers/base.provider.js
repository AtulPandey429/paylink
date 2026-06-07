/**
 * Abstract Base Provider defining the common contract for all payment gateway adapters.
 */
class BaseProvider {
  constructor(name) {
    this.name = name;
  }

  /**
   * Creates a payment link on the gateway.
   * @param {Object} params - { linkId, title, amount, amountMinor, currency, customer, returnUrl, expiresAt }
   * @returns {Promise<{ gatewayLinkId, gatewayPaymentUrl, shortUrl, rawStatus, rawResponse }>}
   */
  async createPaymentLink(params) {
    throw new Error(`createPaymentLink() must be implemented by ${this.name}`);
  }

  /**
   * Fetches latest status of a payment link from the gateway.
   * @param {string} gatewayLinkId
   * @returns {Promise<{ status, paidAt, paymentId, method, gatewayFee, rawStatus, rawResponse }>}
   */
  async getPaymentStatus(gatewayLinkId) {
    throw new Error(`getPaymentStatus() must be implemented by ${this.name}`);
  }

  /**
   * Cancels a payment link on the gateway.
   * @param {string} gatewayLinkId
   * @returns {Promise<{ success, rawStatus, rawResponse }>}
   */
  async cancelPaymentLink(gatewayLinkId) {
    throw new Error(`cancelPaymentLink() must be implemented by ${this.name}`);
  }

  /**
   * Verifies an incoming webhook signature and extracts event payload.
   * @param {Object} headers
   * @param {Buffer|string} rawBody
   * @returns {Promise<{ isValid, eventId, eventType, paymentLinkId, status, amount, currency, paymentId, rawPayload }>}
   */
  async verifyWebhook(headers, rawBody) {
    throw new Error(`verifyWebhook() must be implemented by ${this.name}`);
  }
}

module.exports = BaseProvider;

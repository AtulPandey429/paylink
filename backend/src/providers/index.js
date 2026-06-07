const BaseProvider = require('./base.provider');
const StripeProvider = require('./stripe.provider');
const RazorpayProvider = require('./razorpay.provider');
const CashfreeProvider = require('./cashfree.provider');
const DemoProvider = require('./demo.provider');
const logger = require('../utils/logger');

class ProviderFactory {
  constructor() {
    this.providers = {
      stripe: new StripeProvider(),
      razorpay: new RazorpayProvider(),
      cashfree: new CashfreeProvider(),
      demo: new DemoProvider()
    };
  }

  /**
   * Retrieves provider adapter by name.
   * If real gateway is unconfigured and demo mode is allowed, falls back to DemoProvider with isDemo = true.
   */
  getProvider(gatewayName, allowDemoFallback = true) {
    const key = String(gatewayName || '').toLowerCase().trim();
    const provider = this.providers[key];

    if (!provider) {
      throw new Error(`Unsupported payment gateway: '${gatewayName}'`);
    }

    if (key === 'demo') {
      return { provider, isDemo: true };
    }

    if (provider.isConfigured()) {
      return { provider, isDemo: false };
    }

    if (allowDemoFallback) {
      logger.info(`Gateway '${gatewayName}' is not configured with active credentials. Utilizing DemoProvider fallback.`);
      return { provider: this.providers.demo, isDemo: true, fallbackFrom: gatewayName };
    }

    throw new Error(`Payment gateway '${gatewayName}' is not configured. Please supply API keys in environment variables.`);
  }

  /**
   * Returns safe status of all gateways for settings view.
   */
  getGatewaysStatus() {
    return {
      stripe: {
        id: 'stripe',
        name: 'Stripe',
        configured: this.providers.stripe.isConfigured(),
        environment: 'sandbox',
        supportedCurrencies: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'SGD'],
        capabilities: ['Credit/Debit Cards', 'Apple Pay', 'Google Pay', 'Checkout Sessions']
      },
      razorpay: {
        id: 'razorpay',
        name: 'Razorpay',
        configured: this.providers.razorpay.isConfigured(),
        environment: 'sandbox',
        supportedCurrencies: ['INR', 'USD', 'EUR', 'GBP'],
        capabilities: ['UPI', 'Cards', 'Netbanking', 'Wallets', 'Payment Links']
      },
      cashfree: {
        id: 'cashfree',
        name: 'Cashfree',
        configured: this.providers.cashfree.isConfigured(),
        environment: 'sandbox',
        supportedCurrencies: ['INR'],
        capabilities: ['UPI', 'Cards', 'Netbanking', 'PayLater', 'PG Links v2023-08-01']
      },
      demo: {
        id: 'demo',
        name: 'Demo Simulator',
        configured: true,
        environment: 'simulation',
        supportedCurrencies: ['USD', 'INR', 'EUR', 'GBP'],
        capabilities: ['Realistic Link Generation', 'Simulated Checkout', 'Instant Webhook Triggers']
      }
    };
  }
}

const factoryInstance = new ProviderFactory();

// Support both `const providerFactory = require('./providers')`
// and `const { getProvider, StripeProvider, ... } = require('./providers')`
factoryInstance.BaseProvider = BaseProvider;
factoryInstance.StripeProvider = StripeProvider;
factoryInstance.RazorpayProvider = RazorpayProvider;
factoryInstance.CashfreeProvider = CashfreeProvider;
factoryInstance.DemoProvider = DemoProvider;
factoryInstance.ProviderFactory = ProviderFactory;

module.exports = factoryInstance;

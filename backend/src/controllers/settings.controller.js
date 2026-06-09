const config = require('../config/env');
const providerFactory = require('../providers');
const asyncHandler = require('../utils/asyncHandler');

function maskKey(key) {
  if (!key || typeof key !== 'string') return null;
  if (key.length <= 8) return '••••••••';
  const prefix = key.slice(0, 7);
  const suffix = key.slice(-4);
  return `${prefix}...${suffix}`;
}

const getSettings = asyncHandler(async (req, res) => {
  const gateways = providerFactory.getGatewaysStatus();
  const baseUrl = config.publicBaseUrl;

  const enrichedGateways = {
    stripe: {
      ...gateways.stripe,
      maskedKey: maskKey(config.stripe.secretKey),
      webhookUrl: `${baseUrl}/api/webhooks/stripe`,
      hasWebhookSecret: Boolean(config.stripe.webhookSecret)
    },
    razorpay: {
      ...gateways.razorpay,
      maskedKey: maskKey(config.razorpay.keyId),
      webhookUrl: `${baseUrl}/api/webhooks/razorpay`,
      hasWebhookSecret: Boolean(config.razorpay.webhookSecret)
    },
    cashfree: {
      ...gateways.cashfree,
      maskedKey: maskKey(config.cashfree.appId),
      webhookUrl: `${baseUrl}/api/webhooks/cashfree`,
      hasWebhookSecret: Boolean(config.cashfree.secretKey)
    },
    demo: {
      ...gateways.demo,
      maskedKey: 'SIMULATOR-ACTIVE',
      webhookUrl: `${baseUrl}/api/webhooks/demo`,
      hasWebhookSecret: true
    }
  };

  res.json({
    success: true,
    data: {
      environment: config.env,
      publicBaseUrl: config.publicBaseUrl,
      demoModeEnabled: config.demoMode.enabled,
      gateways: enrichedGateways,
      systemStatus: 'healthy',
      timestamp: new Date().toISOString()
    }
  });
});

module.exports = {
  getSettings
};

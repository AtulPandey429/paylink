const config = require('../../src/config/env');

describe('Configuration & Environment Management Tests', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('config object exposes normalized URLs and defaults', () => {
    expect(config.port).toBeDefined();
    expect(typeof config.port).toBe('number');
    expect(config.clientUrl).toBeDefined();
    expect(config.clientUrl).not.toMatch(/\/$/); // Must not have trailing slash
    expect(config.publicBaseUrl).toBeDefined();
    expect(config.publicBaseUrl).not.toMatch(/\/$/);
    expect(Array.isArray(config.cors.allowedOrigins)).toBe(true);
    expect(config.cors.allowedOrigins).toContain(config.clientUrl);
  });

  test('validateConfig() succeeds on valid development configuration', () => {
    expect(() => config.validateConfig(config)).not.toThrow();
  });

  test('validateConfig() rejects invalid port numbers', () => {
    const invalidConfig = {
      ...config,
      port: 99999
    };
    expect(() => config.validateConfig(invalidConfig)).toThrow(/Invalid PORT/i);
  });

  test('validateConfig() rejects missing MONGODB_URI', () => {
    const invalidConfig = {
      ...config,
      mongoUri: ''
    };
    expect(() => config.validateConfig(invalidConfig)).toThrow(/Missing MONGODB_URI/i);
  });

  test('validateConfig() rejects fallback JWT_SECRET in production mode', () => {
    const prodConfig = {
      ...config,
      isProduction: true,
      jwtSecret: 'paylink_super_secure_jwt_secret_dev_key_2026_xyz' // fallback
    };
    expect(() => config.validateConfig(prodConfig)).toThrow(/requires a secure JWT_SECRET/i);
  });

  test('validateConfig() rejects production Stripe configuration missing webhook secret', () => {
    const prodConfig = {
      ...config,
      isProduction: true,
      jwtSecret: 'a_very_secure_and_long_jwt_secret_for_production_testing_123',
      stripe: {
        ...config.stripe,
        isConfigured: true,
        webhookSecret: ''
      }
    };
    expect(() => config.validateConfig(prodConfig)).toThrow(/STRIPE_WEBHOOK_SECRET is required/i);
  });

  test('demoMode configuration exposes configurable webhook secret and latency', () => {
    expect(config.demoMode.enabled).toBe(true);
    expect(config.demoMode.webhookSecret).toBeDefined();
    expect(typeof config.demoMode.webhookSecret).toBe('string');
    expect(config.demoMode.simulatedLatencyMs).toBeGreaterThanOrEqual(50);
  });
});

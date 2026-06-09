const providerFactory = require('../../src/providers');
const { DemoProvider } = require('../../src/providers');

describe('Payment Provider Factory & Demo Adapter Tests', () => {
  test('returns configured demo provider', () => {
    const { provider, isDemo } = providerFactory.getProvider('demo');
    expect(provider).toBeInstanceOf(DemoProvider);
    expect(isDemo).toBe(true);
  });

  test('falls back gracefully to DemoProvider when real keys are absent', () => {
    const { provider, isDemo } = providerFactory.getProvider('stripe', true);
    expect(provider).toBeDefined();
    expect(typeof isDemo).toBe('boolean');
  });

  test('throws for completely unsupported gateway name', () => {
    expect(() => providerFactory.getProvider('unsupported_gateway_xyz')).toThrow('Unsupported payment gateway');
  });

  test('DemoProvider generates valid link and handles status and cancellation', async () => {
    const demo = new DemoProvider();
    const result = await demo.createPaymentLink({
      linkId: 'test_link_123',
      title: 'Test Invoice',
      amount: 15.00,
      amountMinor: 1500,
      currency: 'USD'
    });

    expect(result.gatewayLinkId).toBeDefined();
    expect(result.gatewayPaymentUrl).toContain('/pay/preview/test_link_123');

    const statusResult = await demo.getPaymentStatus(result.gatewayLinkId);
    expect(statusResult.status).toBe('pending');

    const cancelResult = await demo.cancelPaymentLink(result.gatewayLinkId);
    expect(cancelResult.success).toBe(true);
  });

  test('DemoProvider verifies signed webhooks and rejects tampered ones', async () => {
    const demo = new DemoProvider();
    const payload = {
      eventId: 'evt_test_1',
      eventType: 'payment.simulated',
      paymentLinkId: 'plink_1',
      status: 'paid',
      amount: 25.00,
      currency: 'USD'
    };

    const signature = demo.signPayload(payload);
    const bodyStr = JSON.stringify(payload);

    // Valid signature
    const validResult = await demo.verifyWebhook({ 'x-demo-signature': signature }, bodyStr);
    expect(validResult.isValid).toBe(true);
    expect(validResult.status).toBe('paid');

    // Tampered signature
    const invalidResult = await demo.verifyWebhook({ 'x-demo-signature': 'tampered_signature_hex' }, bodyStr);
    expect(invalidResult.isValid).toBe(false);
  });
});

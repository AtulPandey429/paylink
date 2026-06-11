const request = require('supertest');
const app = require('../../src/app');
const { clearCollections } = require('../setup');
const { DemoProvider } = require('../../src/providers');
const PaymentLink = require('../../src/models/PaymentLink');
const PaymentTransaction = require('../../src/models/PaymentTransaction');

describe('Webhook Processing & Idempotency Tests', () => {
  let token;
  let linkId;
  const demoProvider = new DemoProvider();

  beforeEach(async () => {
    await clearCollections();

    // Register merchant & create payment link
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Webhook Merchant',
      email: 'wh@merchant.io',
      password: 'Password123!'
    });
    token = userRes.body.data.token;

    const linkRes = await request(app)
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Subscription Invoice #99',
        amount: 80.00,
        currency: 'USD',
        gateway: 'demo'
      });

    linkId = linkRes.body.data.link._id;
  });

  test('POST /api/webhooks/demo rejects unsigned webhook request with 400', async () => {
    const payload = {
      eventId: 'evt_unsigned_1',
      paymentLinkId: linkId,
      status: 'paid'
    };

    const res = await request(app)
      .post('/api/webhooks/demo')
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/webhooks/demo processes signed webhook and marks link paid', async () => {
    const payload = {
      eventId: 'evt_valid_101',
      eventType: 'payment.captured',
      paymentLinkId: linkId,
      status: 'paid',
      amount: 80.00,
      currency: 'USD',
      paymentId: 'pay_101_xyz'
    };

    const signature = demoProvider.signPayload(payload);

    const res = await request(app)
      .post('/api/webhooks/demo')
      .set('x-demo-signature', signature)
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('paid');

    // Verify DB update
    const updatedLink = await PaymentLink.findById(linkId);
    expect(updatedLink.status).toBe('paid');

    // Verify transaction record created
    const tx = await PaymentTransaction.findOne({ paymentLinkId: linkId });
    expect(tx).toBeDefined();
    expect(tx.status).toBe('captured');
  });

  test('Webhook idempotency: duplicate event delivery is handled without re-capturing', async () => {
    const payload = {
      eventId: 'evt_duplicate_test',
      eventType: 'payment.captured',
      paymentLinkId: linkId,
      status: 'paid',
      amount: 80.00,
      currency: 'USD',
      paymentId: 'pay_dup_xyz'
    };

    const signature = demoProvider.signPayload(payload);

    // 1st delivery
    const res1 = await request(app)
      .post('/api/webhooks/demo')
      .set('x-demo-signature', signature)
      .send(payload);
    expect(res1.statusCode).toBe(200);

    // 2nd delivery (replayed webhook)
    const res2 = await request(app)
      .post('/api/webhooks/demo')
      .set('x-demo-signature', signature)
      .send(payload);

    expect(res2.statusCode).toBe(200);
    expect(res2.body.alreadyProcessed).toBe(true);

    // Ensure transaction was only recorded once
    const txCount = await PaymentTransaction.countDocuments({ paymentLinkId: linkId });
    expect(txCount).toBe(1);
  });

  test('Webhook idempotency under concurrency: simultaneous duplicate deliveries are locked out safely', async () => {
    const payload = {
      eventId: 'evt_concurrent_test',
      eventType: 'payment.captured',
      paymentLinkId: linkId,
      status: 'paid',
      amount: 80.00,
      currency: 'USD',
      paymentId: 'pay_concurrent_xyz'
    };

    const signature = demoProvider.signPayload(payload);

    // Fire 2 concurrent requests simultaneously
    const [res1, res2] = await Promise.all([
      request(app).post('/api/webhooks/demo').set('x-demo-signature', signature).send(payload),
      request(app).post('/api/webhooks/demo').set('x-demo-signature', signature).send(payload)
    ]);

    expect(res1.statusCode).toBe(200);
    expect(res2.statusCode).toBe(200);

    // Exactly one should process, and the other should return alreadyProcessed: true
    const results = [res1.body, res2.body];
    const alreadyProcessedCount = results.filter(r => r.alreadyProcessed === true).length;
    expect(alreadyProcessedCount).toBe(1);

    // Ensure only 1 transaction was recorded
    const txCount = await PaymentTransaction.countDocuments({ paymentLinkId: linkId });
    expect(txCount).toBe(1);
  });

  test('POST /api/webhooks auto-detects demo provider via header and processes payment', async () => {
    const payload = {
      eventId: 'evt_unified_101',
      eventType: 'payment.captured',
      paymentLinkId: linkId,
      status: 'paid',
      amount: 80.00,
      currency: 'USD',
      paymentId: 'pay_unified_101'
    };

    const signature = demoProvider.signPayload(payload);

    const res = await request(app)
      .post('/api/webhooks')
      .set('x-demo-signature', signature)
      .send(payload);

    expect(res.statusCode).toBe(200);
    expect(res.body.gateway).toBe('demo');
    expect(res.body.status).toBe('paid');

    const updatedLink = await PaymentLink.findById(linkId);
    expect(updatedLink.status).toBe('paid');
  });

  test('POST /api/webhooks rejects request when gateway cannot be detected', async () => {
    const payload = {
      unrecognized: 'data'
    };

    const res = await request(app)
      .post('/api/webhooks')
      .send(payload);

    expect(res.statusCode).toBe(400);
    expect(res.body.success).toBe(false);
  });
});


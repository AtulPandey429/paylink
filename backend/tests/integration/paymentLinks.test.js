const request = require('supertest');
const app = require('../../src/app');
const { clearCollections } = require('../setup');

describe('Payment Links API Integration Tests', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await clearCollections();

    // Create test user
    const userRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Merchant Test',
        email: 'merchant@test.io',
        password: 'Password123!'
      });

    token = userRes.body.data.token;
    userId = userRes.body.data.user._id;
  });

  test('POST /api/payment-links creates a payment link with minor units', async () => {
    const res = await request(app)
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Enterprise Software License',
        amount: 250.00,
        currency: 'USD',
        gateway: 'stripe',
        customer: {
          name: 'Jane Doe',
          email: 'jane@enterprise.com'
        }
      });

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.link.title).toBe('Enterprise Software License');
    expect(res.body.data.link.amount).toBe(250.00);
    expect(res.body.data.link.amountMinor).toBe(25000);
    expect(res.body.data.link.status).toBe('pending');
    expect(res.body.data.link.gatewayPaymentUrl).toBeDefined();
  });

  test('GET /api/payment-links lists links with pagination and filtering', async () => {
    // Create 3 links
    for (let i = 1; i <= 3; i++) {
      await request(app)
        .post('/api/payment-links')
        .set('Authorization', `Bearer ${token}`)
        .send({
          title: `Invoice #${i}`,
          amount: 50.00 * i,
          currency: 'USD',
          gateway: 'stripe'
        });
    }

    const listRes = await request(app)
      .get('/api/payment-links?page=1&limit=2')
      .set('Authorization', `Bearer ${token}`);

    expect(listRes.statusCode).toBe(200);
    expect(listRes.body.data.links.length).toBe(2);
    expect(listRes.body.data.total).toBe(3);
    expect(listRes.body.data.totalPages).toBe(2);
  });

  test('POST /api/payment-links/:id/cancel cancels an active link', async () => {
    const createRes = await request(app)
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Consulting Session',
        amount: 100.00,
        currency: 'USD',
        gateway: 'stripe'
      });

    const linkId = createRes.body.data.link._id;

    const cancelRes = await request(app)
      .post(`/api/payment-links/${linkId}/cancel`)
      .set('Authorization', `Bearer ${token}`);

    expect(cancelRes.statusCode).toBe(200);
    expect(cancelRes.body.data.link.status).toBe('cancelled');
  });

  test('GET /api/payment-links/:id/events retrieves audit trail for link', async () => {
    const createRes = await request(app)
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Design Sprint',
        amount: 500.00,
        currency: 'USD',
        gateway: 'stripe'
      });

    const linkId = createRes.body.data.link._id;

    const eventsRes = await request(app)
      .get(`/api/payment-links/${linkId}/events`)
      .set('Authorization', `Bearer ${token}`);

    expect(eventsRes.statusCode).toBe(200);
    expect(eventsRes.body.data.auditLogs.length).toBeGreaterThanOrEqual(1);
    expect(eventsRes.body.data.auditLogs[0].action).toBe('LINK_CREATED');
  });

  test('GET /api/payment-links/public/:id returns safe public checkout info without auth', async () => {
    const createRes = await request(app)
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Public Workshop Ticket',
        amount: 29.00,
        currency: 'USD',
        gateway: 'stripe'
      });

    const linkId = createRes.body.data.link._id;

    // Public call - no Authorization header
    const publicRes = await request(app)
      .get(`/api/payment-links/public/${linkId}`);

    expect(publicRes.statusCode).toBe(200);
    expect(publicRes.body.data.link.title).toBe('Public Workshop Ticket');
    expect(publicRes.body.data.link.amount).toBe(29.00);
    // Ensure sensitive internal fields are omitted
    expect(publicRes.body.data.link.userId).toBeUndefined();
  });
});

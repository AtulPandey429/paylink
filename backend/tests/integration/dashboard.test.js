const request = require('supertest');
const app = require('../../src/app');
const { clearCollections } = require('../setup');
const PaymentLink = require('../../src/models/PaymentLink');

describe('Dashboard Summary Integration Tests', () => {
  let token;
  let userId;

  beforeEach(async () => {
    await clearCollections();

    // Register user
    const userRes = await request(app).post('/api/auth/register').send({
      name: 'Analytics Merchant',
      email: 'analytics@merchant.io',
      password: 'Password123!'
    });
    token = userRes.body.data.token;
    userId = userRes.body.data.user._id;

    // Seed 2 paid links and 2 pending links
    await PaymentLink.create([
      {
        userId,
        title: 'Paid Item 1',
        amount: 100.00,
        amountMinor: 10000,
        currency: 'USD',
        gateway: 'stripe',
        gatewayLinkId: 'pl_1',
        gatewayPaymentUrl: 'https://...',
        status: 'paid'
      },
      {
        userId,
        title: 'Paid Item 2',
        amount: 250.00,
        amountMinor: 25000,
        currency: 'USD',
        gateway: 'razorpay',
        gatewayLinkId: 'pl_2',
        gatewayPaymentUrl: 'https://...',
        status: 'paid'
      },
      {
        userId,
        title: 'Pending Item 3',
        amount: 50.00,
        amountMinor: 5000,
        currency: 'USD',
        gateway: 'stripe',
        gatewayLinkId: 'pl_3',
        gatewayPaymentUrl: 'https://...',
        status: 'pending'
      },
      {
        userId,
        title: 'Pending Item 4',
        amount: 75.00,
        amountMinor: 7500,
        currency: 'USD',
        gateway: 'cashfree',
        gatewayLinkId: 'pl_4',
        gatewayPaymentUrl: 'https://...',
        status: 'pending'
      }
    ]);
  });

  test('GET /api/dashboard/summary calculates correct totals, revenues, and conversion rate', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const { overview, gatewayBreakdown } = res.body.data;

    expect(overview.totalLinks).toBe(4);
    expect(overview.paidCount).toBe(2);
    expect(overview.pendingCount).toBe(2);
    expect(overview.totalRevenue).toBe(350.00); // 100 + 250
    expect(overview.conversionRate).toBe(50.0); // 2 of 4 = 50%

    expect(gatewayBreakdown.length).toBeGreaterThanOrEqual(2);
  });

  test('GET /api/dashboard/summary filters by gateway', async () => {
    const res = await request(app)
      .get('/api/dashboard/summary?gateway=stripe')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    const { overview } = res.body.data;

    // 2 links for stripe: 1 paid ($100), 1 pending ($50)
    expect(overview.totalLinks).toBe(2);
    expect(overview.paidCount).toBe(1);
    expect(overview.totalRevenue).toBe(100.00);
  });
});

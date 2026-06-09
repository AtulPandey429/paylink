const request = require('supertest');
const app = require('../../src/app');
const { clearCollections } = require('../setup');

describe('Security: IDOR & Tenant Isolation Tests', () => {
  let userAToken;
  let userBToken;
  let userALinkId;

  beforeEach(async () => {
    await clearCollections();

    // Register User A
    const userARes = await request(app).post('/api/auth/register').send({
      name: 'User A',
      email: 'userA@test.com',
      password: 'Password123!'
    });
    userAToken = userARes.body.data.token;

    // Register User B
    const userBRes = await request(app).post('/api/auth/register').send({
      name: 'User B',
      email: 'userB@test.com',
      password: 'Password123!'
    });
    userBToken = userBRes.body.data.token;

    // User A creates a payment link
    const linkRes = await request(app)
      .post('/api/payment-links')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({
        title: "User A Confidential Invoice",
        amount: 1000.00,
        currency: 'USD',
        gateway: 'stripe'
      });
    userALinkId = linkRes.body.data.link._id;
  });

  test('User B cannot retrieve User A payment link by ID (returns 404)', async () => {
    const res = await request(app)
      .get(`/api/payment-links/${userALinkId}`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('User B cannot cancel User A payment link (returns 404)', async () => {
    const res = await request(app)
      .post(`/api/payment-links/${userALinkId}/cancel`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('User B cannot sync User A payment link (returns 404)', async () => {
    const res = await request(app)
      .post(`/api/payment-links/${userALinkId}/sync`)
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(404);
    expect(res.body.success).toBe(false);
  });

  test('User B link listing does not contain User A links', async () => {
    const res = await request(app)
      .get('/api/payment-links')
      .set('Authorization', `Bearer ${userBToken}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.links.length).toBe(0);
  });
});

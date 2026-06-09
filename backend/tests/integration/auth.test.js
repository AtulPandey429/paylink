const request = require('supertest');
const app = require('../../src/app');
const { clearCollections } = require('../setup');

describe('Auth Integration Tests', () => {
  beforeEach(async () => {
    await clearCollections();
  });

  const validUser = {
    name: 'Elena Rostova',
    email: 'elena@merchant.io',
    password: 'SecurePassword123!'
  };

  test('POST /api/auth/register registers a new merchant and returns JWT', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(validUser.email);
    expect(res.body.data.user.passwordHash).toBeUndefined(); // never expose passwordHash
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/register rejects duplicate email with 409', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.statusCode).toBe(409);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login authenticates valid user', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: validUser.password
      });

    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  test('POST /api/auth/login rejects incorrect password with 401', async () => {
    await request(app).post('/api/auth/register').send(validUser);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: validUser.email,
        password: 'wrong_password_xyz'
      });

    expect(res.statusCode).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('GET /api/auth/me returns current user profile when token is valid', async () => {
    const regRes = await request(app).post('/api/auth/register').send(validUser);
    const token = regRes.body.data.token;

    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.data.user.email).toBe(validUser.email);
  });

  test('GET /api/auth/me rejects missing or invalid token with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.statusCode).toBe(401);

    const resBadToken = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalid_token_string');
    expect(resBadToken.statusCode).toBe(401);
  });
});

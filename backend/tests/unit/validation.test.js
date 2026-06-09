const { validateCreatePaymentLink, validateRegister, validateLogin } = require('../../src/validators');

function createMockReqRes(body = {}) {
  const req = { body };
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(obj) {
      this.data = obj;
      return this;
    }
  };
  const next = jest.fn();
  return { req, res, next };
}

describe('Middleware Validation Tests', () => {
  describe('validateCreatePaymentLink', () => {
    test('passes valid payload', () => {
      const { req, res, next } = createMockReqRes({
        title: 'Hosting Retainer',
        amount: 50.00,
        currency: 'USD',
        gateway: 'stripe'
      });

      validateCreatePaymentLink(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.statusCode).toBe(200);
    });

    test('rejects negative or zero amount', () => {
      const { req, res, next } = createMockReqRes({
        title: 'Hosting Retainer',
        amount: 0,
        currency: 'USD',
        gateway: 'stripe'
      });

      validateCreatePaymentLink(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.data.errors).toContain('Amount must be a positive number greater than 0');
    });

    test('rejects unsupported currency for gateway', () => {
      const { req, res, next } = createMockReqRes({
        title: 'Hosting Retainer',
        amount: 100,
        currency: 'USD',
        gateway: 'cashfree' // Cashfree only supports INR
      });

      validateCreatePaymentLink(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.data.errors[0]).toContain('Currency USD is not supported by cashfree');
    });

    test('rejects short title', () => {
      const { req, res, next } = createMockReqRes({
        title: 'Hi',
        amount: 100,
        currency: 'INR',
        gateway: 'razorpay'
      });

      validateCreatePaymentLink(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.data.errors).toContain('Title/description must be at least 3 characters long');
    });
  });

  describe('validateRegister', () => {
    test('validates registration inputs', () => {
      const { req, res, next } = createMockReqRes({
        name: 'A',
        email: 'invalid-email',
        password: 'short'
      });

      validateRegister(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
      expect(res.data.errors.length).toBe(3);
    });
  });

  describe('validateLogin', () => {
    test('validates login inputs', () => {
      const { req, res, next } = createMockReqRes({
        email: 'invalid',
        password: ''
      });

      validateLogin(req, res, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.statusCode).toBe(400);
    });
  });
});

const { toMinorUnits, fromMinorUnits, formatCurrency } = require('../../src/utils/currency');

describe('Currency Utility Tests', () => {
  describe('toMinorUnits', () => {
    test('converts standard 2-decimal currencies (USD, INR, EUR) accurately', () => {
      expect(toMinorUnits(10.50, 'USD')).toBe(1050);
      expect(toMinorUnits(100.00, 'INR')).toBe(10000);
      expect(toMinorUnits(0.99, 'EUR')).toBe(99);
      expect(toMinorUnits('49.95', 'USD')).toBe(4995);
    });

    test('prevents floating point arithmetic drift', () => {
      // In raw JS: 19.99 * 100 = 1998.9999999999998
      expect(toMinorUnits(19.99, 'USD')).toBe(1999);
      expect(toMinorUnits(29.10, 'USD')).toBe(2910);
    });

    test('handles zero-decimal currencies (JPY, KRW)', () => {
      expect(toMinorUnits(500, 'JPY')).toBe(500);
      expect(toMinorUnits(1200.4, 'JPY')).toBe(1200);
    });

    test('throws on negative or invalid numbers', () => {
      expect(() => toMinorUnits(-5, 'USD')).toThrow();
      expect(() => toMinorUnits('not-a-number', 'USD')).toThrow();
    });
  });

  describe('fromMinorUnits', () => {
    test('converts minor units back to standard decimal float', () => {
      expect(fromMinorUnits(1050, 'USD')).toBe(10.50);
      expect(fromMinorUnits(10000, 'INR')).toBe(100.00);
      expect(fromMinorUnits(99, 'EUR')).toBe(0.99);
    });

    test('handles zero-decimal currencies properly', () => {
      expect(fromMinorUnits(500, 'JPY')).toBe(500);
    });
  });

  describe('formatCurrency', () => {
    test('formats currency with symbols', () => {
      const formattedUSD = formatCurrency(19.99, 'USD');
      expect(formattedUSD).toContain('19.99');
      const formattedINR = formatCurrency(4500, 'INR');
      expect(formattedINR).toContain('4,500');
    });
  });
});

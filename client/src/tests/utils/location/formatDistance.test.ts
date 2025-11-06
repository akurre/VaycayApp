import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { formatDistance } from '@/utils/location/formatDistance';

describe('formatDistance', () => {
  const originalNavigator = global.navigator;

  beforeEach(() => {
    // mock navigator.language
    Object.defineProperty(global.navigator, 'language', {
      writable: true,
      configurable: true,
      value: 'en-US',
    });
  });

  afterEach(() => {
    // restore original navigator
    Object.defineProperty(global.navigator, 'language', {
      writable: true,
      configurable: true,
      value: originalNavigator.language,
    });
  });

  describe('kilometer formatting (non-US/UK locales)', () => {
    beforeEach(() => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'de-DE',
      });
    });

    it('formats short distances with 1 decimal place', () => {
      expect(formatDistance(5.3)).toBe('5.3 km');
      expect(formatDistance(9.9)).toBe('9.9 km');
      expect(formatDistance(0.5)).toBe('0.5 km');
    });

    it('formats medium distances without decimals', () => {
      expect(formatDistance(10)).toBe('10 km');
      expect(formatDistance(50)).toBe('50 km');
      expect(formatDistance(999)).toBe('999 km');
    });

    it('formats long distances with thousand separators', () => {
      expect(formatDistance(1234)).toBe('1,234 km');
      expect(formatDistance(10000)).toBe('10,000 km');
      expect(formatDistance(123456)).toBe('123,456 km');
    });

    it('handles zero distance', () => {
      expect(formatDistance(0)).toBe('0.0 km');
    });

    it('handles very large distances', () => {
      expect(formatDistance(20000)).toBe('20,000 km');
      expect(formatDistance(40075)).toBe('40,075 km'); // earth's circumference
    });
  });

  describe('mile formatting (US/UK locales)', () => {
    beforeEach(() => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'en-US',
      });
    });

    it('converts and formats short distances with 1 decimal place', () => {
      // 5 km ≈ 3.1 miles
      expect(formatDistance(5)).toBe('3.1 mi');
      // 9 km ≈ 5.6 miles
      expect(formatDistance(9)).toBe('5.6 mi');
    });

    it('converts and formats medium distances without decimals', () => {
      // 16 km ≈ 9.9 miles (still shows decimal since < 10)
      expect(formatDistance(16)).toBe('9.9 mi');
      // 100 km ≈ 62 miles
      expect(formatDistance(100)).toBe('62 mi');
    });

    it('converts and formats long distances with thousand separators', () => {
      // 2000 km ≈ 1,243 miles
      expect(formatDistance(2000)).toBe('1,243 mi');
      // 10000 km ≈ 6,214 miles
      expect(formatDistance(10000)).toBe('6,214 mi');
    });

    it('handles zero distance', () => {
      expect(formatDistance(0)).toBe('0.0 mi');
    });
  });

  describe('locale detection', () => {
    it('uses miles for en-US locale', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'en-US',
      });
      const result = formatDistance(100);
      expect(result).toContain('mi');
    });

    it('uses miles for en-GB locale', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'en-GB',
      });
      const result = formatDistance(100);
      expect(result).toContain('mi');
    });

    it('uses kilometers for de-DE locale', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'de-DE',
      });
      const result = formatDistance(100);
      expect(result).toContain('km');
    });

    it('uses kilometers for fr-FR locale', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'fr-FR',
      });
      const result = formatDistance(100);
      expect(result).toContain('km');
    });

    it('uses kilometers for es-ES locale', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'es-ES',
      });
      const result = formatDistance(100);
      expect(result).toContain('km');
    });

    it('uses kilometers for ja-JP locale', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'ja-JP',
      });
      const result = formatDistance(100);
      expect(result).toContain('km');
    });
  });

  describe('edge cases', () => {
    it('handles very small distances', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'de-DE',
      });
      expect(formatDistance(0.1)).toBe('0.1 km');
      expect(formatDistance(0.01)).toBe('0.0 km');
    });

    it('handles decimal values correctly', () => {
      Object.defineProperty(global.navigator, 'language', {
        writable: true,
        configurable: true,
        value: 'de-DE',
      });
      expect(formatDistance(5.567)).toBe('5.6 km');
      expect(formatDistance(10.567)).toBe('11 km');
    });
  });
});

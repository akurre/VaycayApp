import { describe, it, expect } from 'vitest';
import formatSliderValueForLabel from '@/utils/dateFormatting/formatSliderValueForLabel';

describe('formatSliderValueForLabel', () => {
  describe('daily mode (isMonthly=false)', () => {
    it('formats day-of-year values with month abbreviation and day', () => {
      expect(formatSliderValueForLabel(1, false)).toBe('Jan. 1');
      expect(formatSliderValueForLabel(100, false)).toBe('Apr. 10');
      expect(formatSliderValueForLabel(365, false)).toBe('Dec. 31');
    });
  });

  describe('monthly mode (isMonthly=true)', () => {
    it('returns the three-letter month label for valid month numbers', () => {
      expect(formatSliderValueForLabel(1, true)).toBe('Jan');
      expect(formatSliderValueForLabel(6, true)).toBe('Jun');
      expect(formatSliderValueForLabel(12, true)).toBe('Dec');
    });

    it('returns empty string for out-of-range month numbers', () => {
      expect(formatSliderValueForLabel(0, true)).toBe('');
      expect(formatSliderValueForLabel(13, true)).toBe('');
    });
  });
});

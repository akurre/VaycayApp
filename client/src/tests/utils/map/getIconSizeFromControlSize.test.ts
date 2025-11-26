import { describe, it, expect } from 'vitest';
import getIconSizeFromControlSize from '@/utils/map/getIconSizeFromControlSize';

describe('getIconSizeFromControlSize', () => {
  it('returns 12 for xs size', () => {
    expect(getIconSizeFromControlSize('xs')).toBe(12);
  });

  it('returns 14 for sm size', () => {
    expect(getIconSizeFromControlSize('sm')).toBe(14);
  });

  it('returns 16 for md size', () => {
    expect(getIconSizeFromControlSize('md')).toBe(16);
  });

  it('returns 20 for lg size', () => {
    expect(getIconSizeFromControlSize('lg')).toBe(20);
  });

  it('returns 24 for xl size', () => {
    expect(getIconSizeFromControlSize('xl')).toBe(24);
  });

  it('returns 16 for undefined size (default)', () => {
    expect(getIconSizeFromControlSize(undefined)).toBe(16);
  });

  it('returns 16 for unknown size (default)', () => {
    expect(getIconSizeFromControlSize('unknown')).toBe(16);
  });
});

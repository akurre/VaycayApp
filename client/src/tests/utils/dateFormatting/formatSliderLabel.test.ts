import { describe, it, expect } from 'vitest';
import formatSliderLabel from '@/utils/dateFormatting/formatSliderLabel';

describe('formatSliderLabel', () => {
  it('formats January dates correctly', () => {
    expect(formatSliderLabel(1)).toBe('Jan. 1');
    expect(formatSliderLabel(15)).toBe('Jan. 15');
    expect(formatSliderLabel(31)).toBe('Jan. 31');
  });

  it('formats February dates correctly', () => {
    expect(formatSliderLabel(32)).toBe('Feb. 1');
    expect(formatSliderLabel(45)).toBe('Feb. 14');
  });

  it('formats March dates correctly', () => {
    expect(formatSliderLabel(60)).toBe('Mar. 1');
    expect(formatSliderLabel(79)).toBe('Mar. 20');
  });

  it('formats April dates correctly', () => {
    expect(formatSliderLabel(91)).toBe('Apr. 1');
    expect(formatSliderLabel(100)).toBe('Apr. 10');
  });

  it('formats May dates correctly without period', () => {
    expect(formatSliderLabel(121)).toBe('May 1');
    expect(formatSliderLabel(135)).toBe('May 15');
  });

  it('formats June dates correctly', () => {
    expect(formatSliderLabel(152)).toBe('Jun. 1');
    expect(formatSliderLabel(165)).toBe('Jun. 14');
  });

  it('formats July dates correctly', () => {
    expect(formatSliderLabel(182)).toBe('Jul. 1');
    expect(formatSliderLabel(195)).toBe('Jul. 14');
  });

  it('formats August dates correctly', () => {
    expect(formatSliderLabel(213)).toBe('Aug. 1');
    expect(formatSliderLabel(230)).toBe('Aug. 18');
  });

  it('formats September dates correctly', () => {
    expect(formatSliderLabel(244)).toBe('Sep. 1');
    expect(formatSliderLabel(250)).toBe('Sep. 7');
  });

  it('formats October dates correctly', () => {
    expect(formatSliderLabel(274)).toBe('Oct. 1');
    expect(formatSliderLabel(290)).toBe('Oct. 17');
  });

  it('formats November dates correctly', () => {
    expect(formatSliderLabel(305)).toBe('Nov. 1');
    expect(formatSliderLabel(307)).toBe('Nov. 3');
  });

  it('formats December dates correctly', () => {
    expect(formatSliderLabel(335)).toBe('Dec. 1');
    expect(formatSliderLabel(365)).toBe('Dec. 31');
  });

  it('removes leading zeros from single-digit days', () => {
    expect(formatSliderLabel(1)).toBe('Jan. 1');
    expect(formatSliderLabel(2)).toBe('Jan. 2');
    expect(formatSliderLabel(9)).toBe('Jan. 9');
  });

  it('handles double-digit days correctly', () => {
    expect(formatSliderLabel(10)).toBe('Jan. 10');
    expect(formatSliderLabel(20)).toBe('Jan. 20');
    expect(formatSliderLabel(31)).toBe('Jan. 31');
  });
});

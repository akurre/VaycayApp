import { describe, it, expect } from 'vitest';
import formatCityFullName from '@/utils/dataFormatting/formatCityFullName';

describe('formatCityFullName', () => {
  it('joins name, state, and country when all present', () => {
    expect(
      formatCityFullName({
        name: 'Austin',
        state: 'Texas',
        country: 'United States',
      })
    ).toBe('Austin, Texas, United States');
  });

  it('omits state when null', () => {
    expect(
      formatCityFullName({ name: 'Tokyo', state: null, country: 'Japan' })
    ).toBe('Tokyo, Japan');
  });

  it('omits country when empty string', () => {
    expect(
      formatCityFullName({ name: 'Austin', state: 'Texas', country: '' })
    ).toBe('Austin, Texas');
  });

  it('returns just the name when state is null and country is empty', () => {
    expect(
      formatCityFullName({ name: 'Unknown', state: null, country: '' })
    ).toBe('Unknown');
  });
});

import { describe, it, expect } from 'vitest';
import { getSeverityColor } from '@/utils/errors/getSeverityColor';
import { ErrorSeverity } from '@/types/errorTypes';

describe('getSeverityColor', () => {
  it('should return red for Error severity', () => {
    expect(getSeverityColor(ErrorSeverity.Error)).toBe('red');
  });

  it('should return yellow for Warning severity', () => {
    expect(getSeverityColor(ErrorSeverity.Warning)).toBe('yellow');
  });

  it('should return blue for Info severity', () => {
    expect(getSeverityColor(ErrorSeverity.Info)).toBe('blue');
  });

  it('should return red for unknown severity (default case)', () => {
    expect(getSeverityColor('unknown' as ErrorSeverity)).toBe('red');
  });
});

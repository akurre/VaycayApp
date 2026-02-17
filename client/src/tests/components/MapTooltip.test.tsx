import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import MapTooltip from '@/components/Map/MapTooltip';

// Mock Mantine/Theme to satisfy component imports
vi.mock('@mantine/core', () => ({
  useComputedColorScheme: () => 'dark',
}));

vi.mock('@/theme', () => ({
  appColors: {
    light: { background: '#fff', text: '#000' },
    dark: { surface: '#1a1b1e', text: '#c1c2c5' },
  },
}));

describe('MapTooltip', () => {
  beforeEach(() => {
    // Mock viewport size
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1024, writable: true });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 768, writable: true });
  });

  it('normal positioning: x+10, y+10', () => {
    const { container } = render(<MapTooltip x={300} y={200} content="Test" />);
    const tooltip = container.firstChild as HTMLElement;
    expect(tooltip.style.left).toBe('310px');
    expect(tooltip.style.top).toBe('210px');
  });

  it('flips to left when near right viewport edge', () => {
    const mockRect = {
      width: 200,
      height: 100,
      top: 0,
      left: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as any;
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => mockRect);

    const { container } = render(<MapTooltip x={900} y={200} content="Test" />);
    const tooltip = container.firstChild as HTMLElement;

    // 900 + 10 + 200 > 1024 => flip to left: 900 - 200 - 10 = 690
    expect(tooltip.style.left).toBe('690px');
    expect(tooltip.style.top).toBe('210px');

    spy.mockRestore();
  });

  it('flips above when near bottom edge', () => {
    const mockRect = {
      width: 200,
      height: 100,
      top: 0,
      left: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as any;
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => mockRect);

    // y near bottom, with tooltip height 100 -> overflow if at 760
    const { container } = render(<MapTooltip x={300} y={760} content="Test" />);
    const tooltip = container.firstChild as HTMLElement;
    // 760 + 100 + 10 > 768 -> top becomes 760 - 100 - 10 = 650
    expect(tooltip.style.left).toBe('310px');
    expect(tooltip.style.top).toBe('650px');

    spy.mockRestore();
  });

  it('corner case: flips to top-left when near right and bottom edges', () => {
    const mockRect = {
      width: 200,
      height: 100,
      top: 0,
      left: 0,
      right: 200,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => {},
    } as any;
    const spy = vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(() => mockRect);

    const { container } = render(<MapTooltip x={900} y={760} content="Test" />);
    const tooltip = container.firstChild as HTMLElement;
    // right edge flip: 900 - 200 - 10 = 690; bottom edge flip: 760 - 100 - 10 = 650
    expect(tooltip.style.left).toBe('690px');
    expect(tooltip.style.top).toBe('650px');

    spy.mockRestore();
  });
});

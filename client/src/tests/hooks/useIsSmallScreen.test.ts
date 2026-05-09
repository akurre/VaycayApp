import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useIsSmallScreen from '@/hooks/useIsSmallScreen';
import { MOBILE_BREAKPOINT_PX } from '@/const';

const mockMatchMedia = (matches: boolean): void => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('useIsSmallScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    // restore matchMedia between tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  it('queries the configured mobile breakpoint', () => {
    const matchMediaMock = vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: matchMediaMock,
    });
    renderHook(() => useIsSmallScreen());
    expect(matchMediaMock).toHaveBeenCalledWith(
      `(max-width: ${MOBILE_BREAKPOINT_PX}px)`
    );
  });

  it('returns true once the effect runs and viewport matches', async () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsSmallScreen());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false when the viewport does not match', async () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsSmallScreen());
    await waitFor(() => expect(result.current).toBe(false));
  });
});

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useIsMobileOrSmall from '@/hooks/useIsMobileOrSmall';

const DESKTOP_UA =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

const setUserAgent = (ua: string): void => {
  Object.defineProperty(window.navigator, 'userAgent', {
    value: ua,
    configurable: true,
    writable: true,
  });
};

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

describe('useIsMobileOrSmall', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setUserAgent(DESKTOP_UA);
    mockMatchMedia(false);
  });

  afterEach(() => {
    setUserAgent(DESKTOP_UA);
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: undefined,
    });
  });

  it('returns true on a mobile UA regardless of viewport size', () => {
    setUserAgent(IPHONE_UA);
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobileOrSmall());
    // UA path returns true synchronously on first render — no waitFor needed
    expect(result.current).toBe(true);
  });

  it('returns true on a desktop UA when viewport is below the breakpoint', async () => {
    setUserAgent(DESKTOP_UA);
    mockMatchMedia(true);
    const { result } = renderHook(() => useIsMobileOrSmall());
    await waitFor(() => expect(result.current).toBe(true));
  });

  it('returns false on a desktop UA at a large viewport', async () => {
    setUserAgent(DESKTOP_UA);
    mockMatchMedia(false);
    const { result } = renderHook(() => useIsMobileOrSmall());
    await waitFor(() => expect(result.current).toBe(false));
  });
});

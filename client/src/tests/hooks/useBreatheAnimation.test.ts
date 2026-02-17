import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBreatheAnimation } from '@/hooks/useBreatheAnimation';

describe('useBreatheAnimation', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns maxOpacity (0.8) when isActive is false', () => {
    const { result } = renderHook(() =>
      useBreatheAnimation({ isActive: false })
    );

    expect(result.current.opacity).toBe(0.8);
  });

  it('returns minOpacity as initial value when isActive is true', () => {
    const { result } = renderHook(() =>
      useBreatheAnimation({ isActive: true })
    );

    expect(result.current.opacity).toBe(0.5);
  });

  it('toggles opacity between min and max when active', () => {
    const { result } = renderHook(() =>
      useBreatheAnimation({ isActive: true })
    );

    expect(result.current.opacity).toBe(0.5);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.opacity).toBe(0.8);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.opacity).toBe(0.5);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.opacity).toBe(0.8);
  });

  it('returns maxOpacity when isActive transitions from true to false', () => {
    const { result, rerender } = renderHook(
      (props: { isActive: boolean }) => useBreatheAnimation(props),
      { initialProps: { isActive: true } }
    );

    expect(result.current.opacity).toBe(0.5);

    act(() => {
      vi.advanceTimersByTime(600);
    });
    expect(result.current.opacity).toBe(0.8);

    rerender({ isActive: false });
    expect(result.current.opacity).toBe(0.8);
  });

  it('cleans up interval on unmount with no dangling timers', () => {
    const { unmount } = renderHook(() =>
      useBreatheAnimation({ isActive: true })
    );

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });

  it('respects custom min/max opacity and cycle duration', () => {
    const { result } = renderHook(() =>
      useBreatheAnimation({
        isActive: true,
        minOpacity: 0.2,
        maxOpacity: 1.0,
        cycleDurationMs: 2000,
      })
    );

    expect(result.current.opacity).toBe(0.2);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.opacity).toBe(1.0);

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.opacity).toBe(0.2);
  });
});

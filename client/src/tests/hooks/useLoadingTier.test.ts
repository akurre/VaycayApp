import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLoadingTier } from '@/hooks/useLoadingTier';
import type { UseLoadingTierProps } from '@/hooks/useLoadingTier';
import { DataType } from '@/types/mapTypes';

const defaultProps: UseLoadingTierProps = {
  isLoading: false,
  debouncedDate: '0315',
  selectedMonth: 3,
  dataType: DataType.Temperature,
  isBasemapLoaded: true,
};

describe('useLoadingTier', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 1. Returns 'none' when isLoading is false
  it("returns 'none' when isLoading is false", () => {
    const { result } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    expect(result.current.tier).toBe('none');
    expect(result.current.isDataChange).toBe(false);
    expect(result.current.isPanLoad).toBe(false);
  });

  // 2. Returns 'tier1' when loading AND debouncedDate changed
  it("returns 'tier1' when loading AND debouncedDate changed", () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // Start loading with a different debouncedDate
    rerender({
      ...defaultProps,
      isLoading: true,
      debouncedDate: '0420',
    });

    expect(result.current.tier).toBe('tier1');
  });

  // 3. Returns 'tier1' when loading AND selectedMonth changed
  it("returns 'tier1' when loading AND selectedMonth changed", () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    rerender({
      ...defaultProps,
      isLoading: true,
      selectedMonth: 7,
    });

    expect(result.current.tier).toBe('tier1');
  });

  // 4. Returns 'tier1' when loading AND dataType changed
  it("returns 'tier1' when loading AND dataType changed", () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    rerender({
      ...defaultProps,
      isLoading: true,
      dataType: DataType.Sunshine,
    });

    expect(result.current.tier).toBe('tier1');
  });

  // 5. Returns 'tier1' when isBasemapLoaded is false (initial load)
  it("returns 'tier1' when isBasemapLoaded is false (initial load)", () => {
    const { result } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      {
        initialProps: {
          ...defaultProps,
          isLoading: true,
          isBasemapLoaded: false,
        },
      }
    );

    expect(result.current.tier).toBe('tier1');
  });

  // 6. Returns 'tier2' when loading AND no data params changed (pan/zoom)
  it("returns 'tier2' when loading AND no data params changed (pan/zoom)", () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // Start loading with same data params — simulates pan/zoom
    rerender({ ...defaultProps, isLoading: true });

    expect(result.current.tier).toBe('tier2');
  });

  // 7. Escalates from 'tier2' to 'tier1' after 3000ms
  it("escalates from 'tier2' to 'tier1' after 3000ms", () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // Start loading (pan/zoom) → tier2
    rerender({ ...defaultProps, isLoading: true });
    expect(result.current.tier).toBe('tier2');

    // Advance past escalation threshold
    act(() => {
      vi.advanceTimersByTime(3001);
    });

    expect(result.current.tier).toBe('tier1');
  });

  // 8. Tier 1 takes precedence: if date changes, tier is 'tier1' regardless
  it("tier1 takes precedence when data param changes regardless of escalation state", () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // Change date and start loading — should be tier1 immediately, not tier2
    rerender({
      ...defaultProps,
      isLoading: true,
      debouncedDate: '0820',
    });

    expect(result.current.tier).toBe('tier1');

    // Even after time passes, still tier1 (no escalation needed)
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.tier).toBe('tier1');
  });

  // 9. Returns 'none' when loading stops
  it("returns 'none' when loading stops", () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // Start loading
    rerender({ ...defaultProps, isLoading: true });
    expect(result.current.tier).toBe('tier2');

    // Stop loading
    rerender({ ...defaultProps, isLoading: false });
    expect(result.current.tier).toBe('none');
  });

  // 10. Previous refs update correctly on load completion — tier stays correct across re-renders
  it('refs update on load completion so next load with same params is tier2', () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // First load: change date → tier1
    rerender({
      ...defaultProps,
      isLoading: true,
      debouncedDate: '0520',
    });
    expect(result.current.tier).toBe('tier1');

    // Loading completes — refs should update to current values
    rerender({
      ...defaultProps,
      isLoading: false,
      debouncedDate: '0520',
    });
    expect(result.current.tier).toBe('none');

    // Second load with SAME date '0520' — no data change, so tier2
    rerender({
      ...defaultProps,
      isLoading: true,
      debouncedDate: '0520',
    });
    expect(result.current.tier).toBe('tier2');
  });

  // 11. isDataChange is true only for tier1 caused by data param changes
  it('isDataChange is true only for tier1 caused by data param changes', () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // tier1 from date change → isDataChange true
    rerender({
      ...defaultProps,
      isLoading: true,
      debouncedDate: '0620',
    });
    expect(result.current.tier).toBe('tier1');
    expect(result.current.isDataChange).toBe(true);

    // Stop loading, then test tier1 from !isBasemapLoaded → isDataChange false
    rerender({
      ...defaultProps,
      isLoading: false,
      debouncedDate: '0620',
    });

    rerender({
      ...defaultProps,
      isLoading: true,
      debouncedDate: '0620',
      isBasemapLoaded: false,
    });
    expect(result.current.tier).toBe('tier1');
    // No data param changed (date is same as ref), so isDataChange is false
    expect(result.current.isDataChange).toBe(false);
  });

  // 12. isPanLoad is true only for tier2
  it('isPanLoad is true only for tier2', () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // Pan/zoom load → tier2 → isPanLoad true
    rerender({ ...defaultProps, isLoading: true });
    expect(result.current.tier).toBe('tier2');
    expect(result.current.isPanLoad).toBe(true);

    // Stop loading
    rerender({ ...defaultProps, isLoading: false });
    expect(result.current.isPanLoad).toBe(false);

    // Data change load → tier1 → isPanLoad false
    rerender({
      ...defaultProps,
      isLoading: true,
      debouncedDate: '0901',
    });
    expect(result.current.tier).toBe('tier1');
    expect(result.current.isPanLoad).toBe(false);
  });

  // 13. Escalation timer resets when loading stops before escalation
  it('escalation timer resets when loading stops before 3000ms', () => {
    const { result, rerender } = renderHook(
      (props: UseLoadingTierProps) => useLoadingTier(props),
      { initialProps: { ...defaultProps, isLoading: false } }
    );

    // Start tier2 load
    rerender({ ...defaultProps, isLoading: true });
    expect(result.current.tier).toBe('tier2');

    // Advance partway (not past escalation)
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.tier).toBe('tier2');

    // Stop loading
    rerender({ ...defaultProps, isLoading: false });
    expect(result.current.tier).toBe('none');

    // Start another tier2 load
    rerender({ ...defaultProps, isLoading: true });
    expect(result.current.tier).toBe('tier2');

    // Advance past what would have been the original escalation time
    // but since timer reset, it should NOT escalate yet (only 1500ms into new load)
    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(result.current.tier).toBe('tier2');

    // Now advance the remaining time to trigger escalation
    act(() => {
      vi.advanceTimersByTime(1501);
    });
    expect(result.current.tier).toBe('tier1');
  });
});

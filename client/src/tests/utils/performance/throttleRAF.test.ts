import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { throttleRAF } from '@/utils/performance/throttleRAF';

describe('throttleRAF', () => {
  let rafCallbacks: FrameRequestCallback[] = [];

  beforeEach(() => {
    rafCallbacks = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const flushFrame = () => {
    const cbs = rafCallbacks;
    rafCallbacks = [];
    cbs.forEach((cb) => cb(0));
  };

  it('invokes the wrapped function once per frame regardless of call count', () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled(1);
    throttled(2);
    throttled(3);

    expect(fn).not.toHaveBeenCalled();
    flushFrame();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('passes the latest arguments to the wrapped function', () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled('a');
    throttled('b');
    throttled('c');
    flushFrame();

    expect(fn).toHaveBeenCalledWith('c');
  });

  it('schedules a fresh frame after the previous one fires', () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled(1);
    flushFrame();
    expect(fn).toHaveBeenCalledTimes(1);

    throttled(2);
    flushFrame();
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith(2);
  });

  it('forwards multiple arguments unchanged', () => {
    const fn = vi.fn();
    const throttled = throttleRAF(fn);

    throttled('label', 1, 2);
    flushFrame();

    expect(fn).toHaveBeenCalledWith('label', 1, 2);
  });
});

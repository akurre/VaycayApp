export const throttleRAF = <Args extends unknown[]>(
  fn: (...args: Args) => void
): ((...args: Args) => void) => {
  let pending: Args | null = null;
  let frameId: number | null = null;

  return (...args: Args) => {
    pending = args;
    if (frameId !== null) return;
    frameId = requestAnimationFrame(() => {
      frameId = null;
      if (pending) {
        const latest = pending;
        pending = null;
        fn(...latest);
      }
    });
  };
};

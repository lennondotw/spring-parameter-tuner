import { useCallback, useEffect, useRef } from 'react';

/** Keep only the latest work per frame; flush commits pointer-release immediately. */
export function useFrameQueue() {
  const frameRef = useRef<number | null>(null);
  const pendingRef = useRef<(() => void) | null>(null);

  const cancel = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
    pendingRef.current = null;
  }, []);
  const flush = useCallback(() => {
    const work = pendingRef.current;
    cancel();
    work?.();
  }, [cancel]);
  const schedule = useCallback(
    (work: () => void) => {
      pendingRef.current = work;
      frameRef.current ??= requestAnimationFrame(flush);
    },
    [flush]
  );
  useEffect(() => cancel, [cancel]);
  return { schedule, flush, cancel };
}

import { useEffect, useRef, useState } from 'react';

/** Publish the latest value at most once per interval, including the trailing update. */
export function useThrottledValue<T>(value: T, interval: number): T {
  const [published, setPublished] = useState(value);
  const lastPublishedAtRef = useRef<number | null>(null);

  useEffect(() => {
    const now = performance.now();
    lastPublishedAtRef.current ??= now;
    const remaining = Math.max(0, interval - (now - lastPublishedAtRef.current));
    const timer = setTimeout(() => {
      lastPublishedAtRef.current = performance.now();
      setPublished(() => value);
    }, remaining);
    // A new value replaces the pending value without pushing back its deadline.
    return () => clearTimeout(timer);
  }, [value, interval]);

  return published;
}

import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useThrottledValue } from './use-throttled-value.js';

afterEach(() => vi.useRealTimers());

it('coalesces updates within 100 ms and publishes the final value without further input', () => {
  vi.useFakeTimers();
  const { result, rerender, unmount } = renderHook(({ value }) => useThrottledValue(value, 100), {
    initialProps: { value: 1 },
  });
  expect(result.current).toBe(1);
  rerender({ value: 2 });
  act(() => {
    vi.advanceTimersByTime(50);
  });
  rerender({ value: 3 });
  act(() => {
    vi.advanceTimersByTime(49);
  });
  expect(result.current).toBe(1);
  act(() => {
    vi.advanceTimersByTime(1);
  });
  expect(result.current).toBe(3);
  rerender({ value: 4 });
  rerender({ value: 5 });
  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(result.current).toBe(5);
  rerender({ value: 6 });
  unmount();
  expect(vi.getTimerCount()).toBe(0);
});

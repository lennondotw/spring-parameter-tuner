import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useFrameQueue } from './use-frame-queue.js';

afterEach(() => vi.restoreAllMocks());

it('coalesces work, flushes on commit, and cancels on unmount', () => {
  let callback: FrameRequestCallback | undefined;
  const request = vi.spyOn(window, 'requestAnimationFrame').mockImplementation((next) => {
    callback = next;
    return 1;
  });
  const cancel = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => undefined);
  const { result, unmount } = renderHook(useFrameQueue);
  const first = vi.fn();
  const latest = vi.fn();
  result.current.schedule(first);
  result.current.schedule(latest);
  expect(request).toHaveBeenCalledTimes(1);
  act(() => callback?.(0));
  expect(first).not.toHaveBeenCalled();
  expect(latest).toHaveBeenCalledTimes(1);
  result.current.schedule(latest);
  result.current.flush();
  expect(latest).toHaveBeenCalledTimes(2);
  result.current.schedule(first);
  unmount();
  act(() => callback?.(0));
  expect(first).not.toHaveBeenCalled();
  expect(cancel).toHaveBeenCalled();
});

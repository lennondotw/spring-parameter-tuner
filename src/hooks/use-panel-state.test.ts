import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { PANEL_STATE_KEY, usePanelState } from './use-panel-state.js';

afterEach(() => {
  vi.restoreAllMocks();
  localStorage.removeItem(PANEL_STATE_KEY);
});

it('restores each panel and merges changes into a single JSON key', () => {
  localStorage.setItem(PANEL_STATE_KEY, '{"parameters":false,"advanced":true}');
  const first = renderHook(() => usePanelState('parameters', true));
  const second = renderHook(() => usePanelState('advanced', false));
  expect(first.result.current[0]).toBe(false);
  expect(second.result.current[0]).toBe(true);
  act(() => first.result.current[1](true));
  act(() => second.result.current[1](false));
  expect(JSON.parse(localStorage.getItem(PANEL_STATE_KEY) ?? '{}')).toEqual({ parameters: true, advanced: false });
  first.unmount();
  second.unmount();
  const restored = renderHook(() => usePanelState('advanced', true));
  expect(restored.result.current[0]).toBe(false);
});

it.each(['invalid', 'null', '[]', '{"advanced":"false"}'])('uses defaults for malformed state: %s', (raw) => {
  localStorage.setItem(PANEL_STATE_KEY, raw);
  const { result } = renderHook(() => usePanelState('advanced', false));
  expect(result.current[0]).toBe(false);
  act(() => result.current[1](true));
  expect(result.current[0]).toBe(true);
});

it('remains usable when storage is unavailable', () => {
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
    throw new Error('blocked');
  });
  const { result } = renderHook(() => usePanelState('parameters', true));
  act(() => result.current[1](false));
  expect(result.current[0]).toBe(false);
});

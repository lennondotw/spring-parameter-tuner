import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from './use-media-query.js';

type ChangeListener = () => void;

function createMockMediaQueryList(matches: boolean, listeners: ChangeListener[]): MediaQueryList {
  return {
    matches,
    media: '',
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn((_type: string, cb: ChangeListener) => {
      listeners.push(cb);
    }),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
  };
}

describe('useMediaQuery', () => {
  let listeners: ChangeListener[] = [];

  beforeEach(() => {
    listeners = [];
    vi.spyOn(window, 'matchMedia').mockImplementation((query) =>
      createMockMediaQueryList(query.includes('48rem'), listeners)
    );
  });

  it('returns initial match state', () => {
    const { result } = renderHook(() => useMediaQuery('(width >= 48rem)'));
    expect(result.current).toBe(true);
  });

  it('returns false for non-matching query', () => {
    const { result } = renderHook(() => useMediaQuery('(width >= 100rem)'));
    expect(result.current).toBe(false);
  });

  it('updates when media query changes', () => {
    let currentMatches = false;
    vi.spyOn(window, 'matchMedia').mockImplementation(() => ({
      get matches() {
        return currentMatches;
      },
      media: '',
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((_type: string, cb: ChangeListener) => {
        listeners.push(cb);
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => true),
    }));

    const { result } = renderHook(() => useMediaQuery('(width >= 48rem)'));
    expect(result.current).toBe(false);

    currentMatches = true;
    act(() => {
      listeners.forEach((cb) => cb());
    });

    expect(result.current).toBe(true);
  });
});

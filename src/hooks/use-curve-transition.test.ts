import { createCurvePath } from '#src/utils/curve-path.js';
import { CurveTransition, type CurveDisplayState } from '#src/utils/curve-transition.js';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCurveTransition } from './use-curve-transition.js';

const preference = vi.hoisted(() => ({ reduced: false }));
vi.mock('framer-motion', () => ({ useReducedMotion: () => preference.reduced }));
const initial: CurveDisplayState = { logOmega: 2, logZeta: 0.4, logEnd: 7, logCeiling: 5 };
let now = 0;
let nextId = 0;
let frames = new Map<number, FrameRequestCallback>();

function paint(time: number) {
  now = time;
  const callbacks = [...frames.values()];
  frames.clear();
  act(() => {
    for (const callback of callbacks) callback(time);
  });
}

beforeEach(() => {
  preference.reduced = false;
  now = 0;
  nextId = 0;
  frames = new Map();
  vi.spyOn(performance, 'now').mockImplementation(() => now);
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.set(++nextId, callback);
    return nextId;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    frames.delete(id);
  });
});
afterEach(() => vi.restoreAllMocks());

describe('useCurveTransition handoff', () => {
  it('starts from the committed frame across multiple interruptions and ignores obsolete callbacks', () => {
    const { result, rerender, unmount } = renderHook(({ target }) => useCurveTransition(target), {
      initialProps: { target: initial },
    });
    paint(0);
    const first = { ...initial, logOmega: 4, logEnd: 9 };
    rerender({ target: first });
    paint(40);
    const footprint = result.current;
    const path = createCurvePath(footprint).path;
    const oldCallback = [...frames.values()][0];
    now = 55;
    rerender({ target: { ...initial, logOmega: 1, logEnd: 6 } });
    now = 58;
    const finalTarget = { ...initial, logOmega: 3, logEnd: 10 };
    rerender({ target: finalTarget });
    expect(result.current).toEqual(footprint);
    expect(frames.size).toBe(1);
    act(() => oldCallback?.(58));
    expect(result.current).toEqual(footprint);
    paint(58);
    expect(createCurvePath(result.current).path).toBe(path);

    // Compare the next frame with the exact velocity handoff from the first leg.
    const expected = new CurveTransition(initial);
    expected.retarget(first, 0);
    expected.retarget(finalTarget, 58, expected.sample(40));
    paint(70);
    expect(result.current).toEqual(expected.sample(70).position);
    const pending = [...frames.values()][0];
    unmount();
    expect(frames.size).toBe(0);
    act(() => pending?.(90));
    expect(frames.size).toBe(0);
  });

  it('does not restart for an identical target and snaps cleanly through reduced motion', () => {
    const { result, rerender } = renderHook(({ target }) => useCurveTransition(target), {
      initialProps: { target: initial },
    });
    paint(0);
    expect(frames.size).toBe(0);
    rerender({ target: initial });
    expect(frames.size).toBe(0);
    const target = { ...initial, logOmega: 3, logEnd: 8 };
    rerender({ target });
    paint(40);
    preference.reduced = true;
    rerender({ target });
    expect(result.current).toEqual(target);
    expect(frames.size).toBe(0);
    preference.reduced = false;
    rerender({ target });
    expect(result.current).toEqual(target);
    paint(50);
    expect(result.current).toEqual(target);
    expect(frames.size).toBe(0);
  });
});

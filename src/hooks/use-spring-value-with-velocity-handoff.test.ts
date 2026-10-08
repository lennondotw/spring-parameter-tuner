import { act, renderHook } from '@testing-library/react';
import { frame, frameData, JSAnimation } from 'framer-motion';
import { afterEach, expect, it, vi } from 'vitest';
import { useSpringValueWithVelocityHandoff } from './use-spring-value-with-velocity-handoff.js';

const preference = vi.hoisted(() => ({ reducedMotion: false }));
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return { ...actual, useReducedMotion: () => preference.reducedMotion };
});

afterEach(() => {
  preference.reducedMotion = false;
  vi.restoreAllMocks();
});

it('snaps targets when reduced motion is enabled', () => {
  preference.reducedMotion = true;
  const { result } = renderHook(() => useSpringValueWithVelocityHandoff(-25));
  act(() => result.current.setTarget(175, { omega: 80, zeta: 1 }));
  expect(result.current.value.get()).toBe(175);
  expect(result.current.value.getVelocity()).toBe(0);
  expect(result.current.value.isAnimating()).toBe(false);
});

it('settles an active animation when reduced motion becomes enabled', () => {
  let pending: Parameters<typeof frame.preRender>[0] | undefined;
  vi.spyOn(frame, 'preRender').mockImplementation((work) => {
    pending = work;
    return work;
  });
  const { result, rerender } = renderHook(() => useSpringValueWithVelocityHandoff(0));
  act(() => {
    result.current.setTarget(100, { omega: 30, zeta: 1 });
    pending?.(frameData);
    const animation = result.current.value.animation;
    if (!(animation instanceof JSAnimation)) throw new Error('Expected a spring animation');
    animation.pause();
    animation.sample(30);
  });
  expect(result.current.value.get()).toBeGreaterThan(0);
  expect(result.current.value.get()).toBeLessThan(100);
  preference.reducedMotion = true;
  rerender();
  expect(result.current.value.get()).toBe(100);
  expect(result.current.value.isAnimating()).toBe(false);
});

it('cancels a pending animation when unmounted', () => {
  let pending: Parameters<typeof frame.preRender>[0] | undefined;
  vi.spyOn(frame, 'preRender').mockImplementation((work) => {
    pending = work;
    return work;
  });
  const { result, unmount } = renderHook(() => useSpringValueWithVelocityHandoff(0));
  const value = result.current.value;
  act(() => result.current.setTarget(100, { omega: 30, zeta: 1 }));
  unmount();
  pending?.(frameData);
  expect(value.get()).toBe(0);
  expect(value.isAnimating()).toBe(false);
});

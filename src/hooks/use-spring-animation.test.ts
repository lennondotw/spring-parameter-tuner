import { act, cleanup, renderHook } from '@testing-library/react';
import { frameData, JSAnimation } from 'framer-motion';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { useSpringAnimation, type UseSpringAnimationOptions } from './use-spring-animation.js';

const queued = vi.hoisted(() => new Set<(data: typeof frameData) => void>());
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return {
    ...actual,
    frame: {
      ...actual.frame,
      preRender: (work: (data: typeof frameData) => void) => {
        queued.add(work);
        return work;
      },
    },
    cancelFrame: (work: (data: typeof frameData) => void) => {
      queued.delete(work);
      actual.cancelFrame(work);
    },
  };
});

const options: UseSpringAnimationOptions = {
  targetValue: 100,
  initialValue: 0,
  stiffness: 400,
  damping: 40,
  mass: 1,
  preserveVelocity: true,
};
let animations: JSAnimation<number>[];
const originalTimestamp = frameData.timestamp;
const flush = (time: number) => {
  frameData.timestamp = time;
  const work = [...queued];
  queued.clear();
  work.forEach((callback) => callback(frameData));
};
const latest = () => {
  const animation = animations[animations.length - 1];
  if (!animation) throw new Error('Expected a live preview spring');
  return animation;
};

beforeEach(() => {
  queued.clear();
  animations = [];
  // Keep the real spring generator; control only its driver for deterministic frames.
  vi.spyOn(JSAnimation.prototype, 'play').mockImplementation(function (this: JSAnimation<number>) {
    animations.push(this);
  });
});
afterEach(() => {
  cleanup();
  queued.clear();
  frameData.timestamp = originalTimestamp;
  vi.restoreAllMocks();
});

it('inherits analytical velocity even when update callbacks arrive only 0.4ms apart', () => {
  let arrival = 0;
  vi.spyOn(performance, 'now').mockImplementation(() => arrival);
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: options });
  act(() => {
    flush(0);
    latest().sample(16);
    arrival = 0.4;
    latest().sample(32);
  });
  const position = result.current.value;
  const velocity = latest().getGeneratorVelocity();
  expect(velocity).toBeCloseTo(100 * 20 ** 2 * 0.032 * Math.exp(-20 * 0.032), 10);
  rerender({ ...options, targetValue: 0 });
  act(() => {
    flush(32);
    latest().sample(0);
  });
  expect(result.current.value).toBeCloseTo(position, 12);
  expect(latest().getGeneratorVelocity()).toBeCloseTo(velocity, 12);
});

it('coalesces pending drag targets and starts with zero velocity when handoff is disabled', () => {
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: options });
  act(() => {
    flush(0);
    latest().sample(30);
  });
  const position = result.current.value;
  rerender({ ...options, targetValue: 20 });
  rerender({ ...options, targetValue: 80, preserveVelocity: false });
  act(() => {
    flush(30);
    latest().sample(0);
  });
  expect(animations).toHaveLength(2);
  expect(result.current.value).toBeCloseTo(position, 12);
  expect(latest().getGeneratorVelocity()).toBe(0);
});

it('keeps a target crossing with nonzero velocity moving through the handoff', () => {
  const props = { ...options, damping: 0 };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => {
    flush(0);
    latest().sample(78);
  });
  const position = result.current.value;
  const velocity = latest().getGeneratorVelocity();
  rerender({ ...props, targetValue: position });
  act(() => {
    flush(78);
    latest().sample(0);
  });
  expect(latest().getGeneratorVelocity()).toBe(velocity);
  expect(velocity).not.toBe(0);
});

it('cancels pending starts and stops the active spring on unmount', () => {
  const { rerender, unmount } = renderHook(useSpringAnimation, { initialProps: options });
  act(() => flush(0));
  const animation = latest();
  const stop = vi.spyOn(animation, 'stop');
  rerender({ ...options, targetValue: 0 });
  unmount();
  expect(queued.size).toBe(0);
  expect(stop).toHaveBeenCalled();
});

it('keeps idle requests uncounted, then records a run and each actual generation', () => {
  const props = { ...options, targetValue: 0 };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => flush(0));
  expect(result.current).toMatchObject({ status: 'idle', run: 0, generation: 0, initialVelocity: null });
  expect(animations).toHaveLength(0);
  rerender({ ...props, targetValue: 100 });
  act(() => {
    flush(10);
    latest().sample(30);
  });
  expect(result.current).toMatchObject({
    status: 'running',
    run: 1,
    generation: 1,
    startValue: 0,
    targetValue: 100,
    initialVelocity: 0,
    velocitySource: 'from-rest',
    elapsed: 30,
    restartReasons: ['new-run'],
  });
  const position = result.current.value;
  const velocity = result.current.velocity;
  rerender({ ...props, targetValue: 20 });
  rerender({ ...props, targetValue: 80 });
  act(() => flush(40));
  expect(result.current).toMatchObject({
    run: 1,
    generation: 2,
    startValue: position,
    targetValue: 80,
    initialVelocity: velocity,
    velocitySource: 'inherited',
    elapsed: 0,
    restartReasons: ['target'],
  });
  expect(animations).toHaveLength(2);
  act(() => {
    latest().sample(20);
  });
  expect(result.current.initialVelocity).toBe(velocity);
  expect(result.current.elapsed).toBe(20);
  expect(result.current.velocity).not.toBe(velocity);

  act(() => latest().finish());
  expect(result.current).toMatchObject({
    status: 'settled',
    run: 1,
    generation: 2,
    value: 80,
    velocity: 0,
    initialVelocity: velocity,
    elapsed: 20,
  });
  rerender({ ...props, targetValue: 0 });
  act(() => flush(70));
  expect(result.current).toMatchObject({
    status: 'running',
    run: 2,
    generation: 1,
    startValue: 80,
    initialVelocity: 0,
    velocitySource: 'from-rest',
  });
});

it('records a default zero start and the reasons for parameter and threshold changes', () => {
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: options });
  act(() => {
    flush(0);
    latest().sample(30);
  });
  rerender({ ...options, damping: 20, restSpeed: 0.1, preserveVelocity: false });
  act(() => flush(30));
  expect(result.current).toMatchObject({
    run: 1,
    generation: 2,
    initialVelocity: 0,
    velocitySource: 'from-rest',
    restartReasons: ['parameters', 'thresholds', 'handoff'],
  });
});

it('does not let an old completion overwrite the replacement status or metadata', () => {
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: options });
  act(() => {
    flush(0);
    latest().sample(30);
  });
  const previous = latest();
  rerender({ ...options, targetValue: 0 });
  act(() => flush(30));
  const state = result.current;
  act(() => previous.finish());
  expect(result.current).toBe(state);
  expect(result.current.status).toBe('running');
  expect(result.current.generation).toBe(2);
});

it.each([true, false])('launches each new run with configured velocity when handoff is %s', (preserveVelocity) => {
  const props: UseSpringAnimationOptions = {
    ...options,
    preserveVelocity,
    initialVelocity: 200,
  };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => {
    flush(0);
    latest().sample(0);
  });
  expect(latest().getGeneratorVelocity()).toBe(200);
  expect(result.current).toMatchObject({ run: 1, generation: 1, initialVelocity: 200, velocitySource: 'configured' });
  act(() => latest().finish());
  rerender({ ...props, targetValue: 0 });
  act(() => {
    flush(40);
    latest().sample(0);
  });
  expect(result.current).toMatchObject({ run: 2, generation: 1, initialVelocity: -200, velocitySource: 'configured' });
  expect(latest().getGeneratorVelocity()).toBe(-200);
});

it.each([true, false])('uses inherited or configured velocity on interruption with handoff %s', (preserveVelocity) => {
  const props = { ...options, preserveVelocity, initialVelocity: 200 };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => {
    flush(0);
    latest().sample(30);
  });
  const velocity = result.current.velocity;
  const configuredVelocity = -2 * result.current.value;
  rerender({ ...props, targetValue: 0 });
  act(() => {
    flush(30);
    latest().sample(0);
  });
  expect(result.current).toMatchObject({
    run: 1,
    generation: 2,
    initialVelocity: preserveVelocity ? velocity : configuredVelocity,
    velocitySource: preserveVelocity ? 'inherited' : 'configured',
  });
  expect(latest().getGeneratorVelocity()).toBe(preserveVelocity ? velocity : configuredVelocity);
});

it.each([true, false])('retargets continuously with normalized speed and handoff %s', (preserveVelocity) => {
  const props = { ...options, preserveVelocity, initialVelocity: 2000 };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => {
    flush(0);
    latest().sample(30);
  });
  expect(result.current.initialVelocity).toBe(2000);
  let time = 30;
  for (const targetValue of [20, 80, 10]) {
    const from = result.current.value;
    const previousVelocity = result.current.velocity;
    const configuredVelocity = 20 * (targetValue - from);
    rerender({ ...props, targetValue });
    act(() => flush(time));
    expect(result.current).toMatchObject({
      startValue: from,
      targetValue,
      initialVelocity: preserveVelocity ? previousVelocity : configuredVelocity,
      velocitySource: preserveVelocity ? 'inherited' : 'configured',
    });
    if (targetValue === 20) {
      expect(previousVelocity).toBeGreaterThan(0);
      expect(configuredVelocity).toBeLessThan(0);
    }
    act(() => {
      latest().sample(16);
    });
    time += 16;
  }
  const count = animations.length;
  rerender({ ...props, targetValue: 10 });
  act(() => flush(time));
  expect(animations).toHaveLength(count);
  expect(result.current.generation).toBe(4);
  act(() => latest().finish());
  rerender({ ...props, targetValue: 50 });
  act(() => flush(time + 16));
  expect(result.current).toMatchObject({
    run: 2,
    generation: 1,
    initialVelocity: 800,
    velocitySource: 'configured',
  });
});

it('changes launch velocity without injecting motion, then uses the latest setting for the next run', () => {
  const props: UseSpringAnimationOptions = {
    ...options,
    targetValue: 0,
    initialVelocity: 200,
  };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => flush(0));
  expect(result.current.status).toBe('idle');
  expect(animations).toHaveLength(0);
  rerender({ ...props, initialVelocity: 300 });
  act(() => flush(10));
  expect(animations).toHaveLength(0);
  rerender({ ...props, targetValue: 100, initialVelocity: 300 });
  act(() => {
    flush(20);
    latest().sample(30);
  });
  const state = result.current;
  rerender({ ...props, targetValue: 100, initialVelocity: 500 });
  act(() => flush(50));
  expect(animations).toHaveLength(1);
  expect(result.current).toBe(state);
  expect(result.current.initialVelocity).toBe(300);
  act(() => latest().finish());
  rerender({ ...props, targetValue: 0, initialVelocity: 500 });
  act(() => flush(60));
  expect(result.current).toMatchObject({ run: 2, generation: 1, initialVelocity: -500 });
});

it('resolves toward-target velocity from the current position even after overshooting the old target', () => {
  const props = { ...options, damping: 0, preserveVelocity: false, initialVelocity: 400 };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => {
    flush(0);
    latest().sample(200);
  });
  const position = result.current.value;
  expect(position).toBeGreaterThan(120);
  rerender({ ...props, targetValue: 120 });
  act(() => flush(200));
  expect(result.current).toMatchObject({
    startValue: position,
    targetValue: 120,
    initialVelocity: 4 * (120 - position),
  });
});

it('applies mode changes to the next replacement without restarting the active spring', () => {
  const props = { ...options, preserveVelocity: false, initialVelocity: 200 };
  const { result, rerender } = renderHook(useSpringAnimation, { initialProps: props });
  act(() => {
    flush(0);
    latest().sample(30);
  });
  const state = result.current;
  rerender({ ...props, initialVelocityMode: 'zero' });
  act(() => flush(30));
  expect(animations).toHaveLength(1);
  expect(result.current).toBe(state);
  rerender({ ...props, initialVelocityMode: 'zero', targetValue: 0 });
  act(() => flush(40));
  expect(result.current).toMatchObject({ generation: 2, initialVelocity: 0, velocitySource: 'from-rest' });
});

it.each([1, 10, 100])(
  'keeps the same normalized response for a %s-unit critical spring without overshoot',
  (distance) => {
    const props = {
      ...options,
      targetValue: distance,
      stiffness: 900,
      damping: 60,
      initialVelocity: 2000,
      preserveVelocity: false,
    };
    const { result } = renderHook(useSpringAnimation, { initialProps: props });
    act(() => flush(0));
    expect(result.current.initialVelocity).toBe(20 * distance);
    for (let time = 0; time <= 400; time += 10) {
      act(() => {
        latest().sample(time);
      });
      expect(result.current.value).toBeGreaterThanOrEqual(0);
      expect(result.current.value).toBeLessThanOrEqual(distance);
      if (time === 40) expect(result.current.value / distance).toBeCloseTo(1 - 1.4 * Math.exp(-1.2), 12);
    }
  }
);

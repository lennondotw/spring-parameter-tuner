import { frame, frameData, JSAnimation, motionValue, type MotionValue } from 'framer-motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createSpringAnimationValue } from './spring-animation-value.js';

describe('spring animation value', () => {
  let pending: Parameters<typeof frame.preRender>[0] | undefined;
  let value: MotionValue<number>;
  let hover: ReturnType<typeof createSpringAnimationValue>;
  const originalTimestamp = frameData.timestamp;

  const flush = (timestamp: number) => {
    frameData.timestamp = timestamp;
    const work = pending;
    pending = undefined;
    work?.(frameData);
  };
  const currentAnimation = () => {
    const animation = value.animation;
    if (!(animation instanceof JSAnimation)) throw new Error('Expected a generator-driven animation');
    animation.pause();
    return animation;
  };

  beforeEach(() => {
    pending = undefined;
    value = motionValue(0);
    hover = createSpringAnimationValue(value);
    vi.spyOn(frame, 'preRender').mockImplementation((work) => {
      pending = work;
      return work;
    });
  });

  afterEach(() => {
    hover.stop();
    value.destroy();
    frameData.timestamp = originalTimestamp;
    vi.restoreAllMocks();
  });

  it('enters with a critical 80 rad/s response', () => {
    hover.setTarget(1, { omega: 80, zeta: 1 });
    flush(0);
    const animation = currentAnimation();
    animation.sample(30);
    expect(value.get()).toBeCloseTo(1 - (1 + 80 * 0.03) * Math.exp(-80 * 0.03), 12);
    expect(animation.getGeneratorVelocity()).toBeCloseTo(80 ** 2 * 0.03 * Math.exp(-80 * 0.03), 12);
  });

  it('preserves position and analytical velocity when reversing to the 40 rad/s exit', () => {
    hover.setTarget(1, { omega: 80, zeta: 1 });
    flush(0);
    const entering = currentAnimation();
    entering.sample(30);
    const position = value.get();
    const velocity = entering.getGeneratorVelocity();
    hover.setTarget(0, { omega: 40, zeta: 1 });
    flush(30);
    const leaving = currentAnimation();
    leaving.sample(0);
    expect(value.get()).toBe(position);
    expect(leaving.getGeneratorVelocity()).toBe(velocity);
    leaving.sample(20);
    expect(value.get()).toBeCloseTo((position + (velocity + 40 * position) * 0.02) * Math.exp(-40 * 0.02), 12);

    const exitPosition = value.get();
    const exitVelocity = leaving.getGeneratorVelocity();
    hover.setTarget(1, { omega: 80, zeta: 1 });
    flush(50);
    const reentering = currentAnimation();
    reentering.sample(0);
    expect(value.get()).toBe(exitPosition);
    expect(reentering.getGeneratorVelocity()).toBe(exitVelocity);
  });

  it('keeps the same animation for unchanged hover intent', () => {
    hover.setTarget(1, { omega: 80, zeta: 1 });
    flush(0);
    const animation = currentAnimation();
    hover.setTarget(1, { omega: 80, zeta: 1 });
    flush(20);
    expect(value.animation).toBe(animation);
  });

  it('coalesces enter and exit before a frame without injecting motion', () => {
    hover.setTarget(1, { omega: 80, zeta: 1 });
    hover.setTarget(0, { omega: 40, zeta: 1 });
    flush(20);
    expect(value.get()).toBe(0);
    expect(value.isAnimating()).toBe(false);
  });

  it('cancels pending and active motion when snapping for reduced motion', () => {
    hover.setTarget(1, { omega: 80, zeta: 1 });
    hover.jump(0);
    flush(20);
    expect(value.get()).toBe(0);
    expect(value.isAnimating()).toBe(false);
    hover.setTarget(1, { omega: 80, zeta: 1 });
    flush(30);
    currentAnimation().sample(20);
    hover.jump(1);
    expect(value.get()).toBe(1);
    expect(value.getVelocity()).toBe(0);
    expect(value.isAnimating()).toBe(false);
  });

  it('does not let old completion clear a replacement', async () => {
    hover.setTarget(1, { omega: 80, zeta: 1 });
    flush(0);
    const entering = currentAnimation();
    entering.sample(30);
    entering.finish();
    hover.setTarget(0, { omega: 40, zeta: 1 });
    flush(30);
    const leaving = currentAnimation();
    await Promise.resolve();
    expect(value.animation).toBe(leaving);
  });

  it('hands off arbitrary numeric targets and parameter changes at the same target', () => {
    hover.jump(-25);
    hover.setTarget(175, { omega: 20, zeta: 0.5, mass: 2 });
    flush(0);
    const original = currentAnimation();
    original.sample(40);
    const position = value.get();
    const velocity = original.getGeneratorVelocity();
    hover.setTarget(175, { omega: 40, zeta: 2, mass: 3 });
    flush(40);
    const replacement = currentAnimation();
    expect(replacement).not.toBe(original);
    replacement.sample(0);
    expect(value.get()).toBeCloseTo(position, 12);
    expect(replacement.getGeneratorVelocity()).toBe(velocity);
  });

  it('cancels queued starts on cleanup', () => {
    hover.setTarget(100, { omega: 30, zeta: 1 });
    hover.stop();
    flush(20);
    expect(value.get()).toBe(0);
    expect(value.isAnimating()).toBe(false);
  });
});

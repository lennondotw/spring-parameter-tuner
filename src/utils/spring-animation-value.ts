import { cancelFrame, frame, frameData, JSAnimation, type MotionValue } from 'framer-motion';
import { perceptualToPhysical } from './spring-physics.js';

export interface SpringAnimationConfig {
  omega: number;
  zeta: number;
  mass?: number;
  restDelta?: number;
  restSpeed?: number;
}

const defaults = { mass: 1, restDelta: 0.0001, restSpeed: 0.001 };
const configKeys = ['omega', 'zeta', 'mass', 'restDelta', 'restSpeed'] as const;

/** Retarget a numeric value with the old spring's position and analytical velocity. */
export function createSpringAnimationValue(value: MotionValue<number>) {
  let target = value.get();
  let config: Required<SpringAnimationConfig> | undefined;
  let pending = false;
  let animation: JSAnimation<number> | undefined;

  const start = () => {
    if (!pending) return;
    pending = false;
    if (!config || (!value.isAnimating() && value.get() === target)) return;
    // Existing springs update first, so position and velocity describe the same frame.
    const from = value.get();
    const velocity = value.isAnimating() && animation ? animation.getGeneratorVelocity() : 0;
    const { omega, zeta, mass, restDelta, restSpeed } = config;
    void value.start((complete) => {
      const owned = new JSAnimation<number>({
        type: 'spring',
        ...perceptualToPhysical(omega, zeta, mass),
        mass,
        keyframes: [from, target],
        velocity,
        restDelta,
        restSpeed,
        onUpdate: (latest: number) => value.set(latest),
        onComplete: () => {
          // A finishing spring must not clear a replacement started in preRender.
          queueMicrotask(() => {
            if (value.animation === owned) complete();
          });
        },
      });
      animation = owned;
      owned.startTime = Math.round(frameData.timestamp);
      return owned;
    });
  };

  const jump = (next: number) => {
    pending = false;
    cancelFrame(start);
    target = next;
    value.jump(next);
  };

  return {
    getTarget: () => target,
    jump,
    setTarget(next: number, spring: SpringAnimationConfig, immediate = false) {
      const nextConfig = {
        omega: spring.omega,
        zeta: spring.zeta,
        mass: spring.mass ?? defaults.mass,
        restDelta: spring.restDelta ?? defaults.restDelta,
        restSpeed: spring.restSpeed ?? defaults.restSpeed,
      };
      if (immediate) {
        config = nextConfig;
        jump(next);
        return;
      }
      if (target === next && config && configKeys.every((key) => config?.[key] === nextConfig[key])) return;
      target = next;
      config = nextConfig;
      pending = true;
      frame.preRender(start);
    },
    stop() {
      pending = false;
      cancelFrame(start);
      value.stop();
    },
  };
}

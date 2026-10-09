import { resolveInitialVelocity, type InitialVelocityMode } from '#src/utils/initial-velocity.js';
import { cancelFrame, frame, frameData, JSAnimation } from 'framer-motion';
import { useEffect, useEffectEvent, useLayoutEffect, useRef } from 'react';
import { useStateWithRef } from './use-state-with-ref.js';

export interface UseSpringAnimationOptions {
  targetValue: number;
  stiffness: number;
  damping: number;
  mass: number;
  preserveVelocity: boolean;
  initialValue?: number;
  /** Initial speed as percent of travel distance per second. */
  initialVelocity?: number;
  initialVelocityMode?: InitialVelocityMode;
  restDelta?: number;
  restSpeed?: number;
}

export type SpringStatus = 'idle' | 'running' | 'settled';
export type SpringRestartReason = 'new-run' | 'target' | 'parameters' | 'thresholds' | 'handoff';
export interface SpringAnimationState {
  status: SpringStatus;
  value: number;
  velocity: number;
  run: number;
  generation: number;
  startValue: number | null;
  targetValue: number;
  initialVelocity: number | null;
  velocitySource: 'inherited' | 'from-rest' | 'configured' | null;
  elapsed: number;
  restartReasons: SpringRestartReason[];
}

type StartedOptions = Required<
  Omit<UseSpringAnimationOptions, 'initialValue' | 'initialVelocity' | 'initialVelocityMode'>
>;
function restartReasons(previous: StartedOptions | null, next: StartedOptions): SpringRestartReason[] {
  if (!previous) return ['new-run'];
  const reasons: SpringRestartReason[] = [];
  if (previous.targetValue !== next.targetValue) reasons.push('target');
  if (previous.stiffness !== next.stiffness || previous.damping !== next.damping || previous.mass !== next.mass)
    reasons.push('parameters');
  if (previous.restDelta !== next.restDelta || previous.restSpeed !== next.restSpeed) reasons.push('thresholds');
  if (previous.preserveVelocity !== next.preserveVelocity) reasons.push('handoff');
  return reasons;
}

/** Live physics preview, with optional analytical velocity handoff between targets. */
export function useSpringAnimation({
  targetValue,
  stiffness,
  damping,
  mass,
  preserveVelocity,
  initialValue = targetValue,
  initialVelocity = 0,
  initialVelocityMode = 'toward-target',
  restDelta = 0.001,
  restSpeed = 0.001,
}: UseSpringAnimationOptions): SpringAnimationState {
  const [current, setCurrent, latestRef] = useStateWithRef<SpringAnimationState>({
    status: 'idle',
    value: initialValue,
    velocity: 0,
    run: 0,
    generation: 0,
    startValue: null,
    targetValue: initialValue,
    initialVelocity: null,
    velocitySource: null,
    elapsed: 0,
    restartReasons: [],
  });
  const animationRef = useRef<JSAnimation<number> | null>(null);
  const startedOptionsRef = useRef<StartedOptions | null>(null);
  // Editing velocity or its mode affects the next start without restarting motion.
  const readInitialVelocity = useEffectEvent((from: number, target: number) =>
    resolveInitialVelocity(initialVelocity, initialVelocityMode, from, target)
  );

  useLayoutEffect(() => {
    const start = () => {
      const previous = animationRef.current;
      // Read both after the old spring's update on the shared frame. Callback
      // arrival times are not animation time and cannot be used to infer velocity.
      const from = latestRef.current.value;
      const inherited = preserveVelocity && previous !== null;
      const velocity = inherited ? previous.getGeneratorVelocity() : readInitialVelocity(from, targetValue);
      previous?.stop();
      if (from === targetValue && (!previous || velocity === 0)) {
        animationRef.current = null;
        if (previous) setCurrent({ ...latestRef.current, status: 'settled', velocity: 0 });
        return;
      }
      const nextOptions = { targetValue, stiffness, damping, mass, preserveVelocity, restDelta, restSpeed };
      // Count actual spring starts, after coalescing requests on the shared frame.
      const generation: SpringAnimationState = {
        status: 'running',
        value: from,
        velocity,
        run: latestRef.current.run + (previous ? 0 : 1),
        generation: previous ? latestRef.current.generation + 1 : 1,
        startValue: from,
        targetValue,
        initialVelocity: velocity,
        velocitySource: inherited ? 'inherited' : velocity === 0 ? 'from-rest' : 'configured',
        elapsed: 0,
        restartReasons: restartReasons(previous ? startedOptionsRef.current : null, nextOptions),
      };
      const owned = new JSAnimation<number>({
        type: 'spring',
        keyframes: [from, targetValue],
        stiffness,
        damping,
        mass,
        velocity,
        restDelta,
        restSpeed,
        onUpdate: (value: number) => {
          if (animationRef.current !== owned) return;
          setCurrent({
            ...generation,
            value,
            velocity: owned.getGeneratorVelocity(),
            elapsed: Math.max(0, owned.time * 1000),
          });
        },
        onComplete: () => {
          if (animationRef.current !== owned) return;
          animationRef.current = null;
          setCurrent({
            ...generation,
            status: 'settled',
            value: targetValue,
            velocity: 0,
            elapsed: Math.max(0, owned.time * 1000),
          });
        },
      });
      animationRef.current = owned;
      startedOptionsRef.current = nextOptions;
      owned.startTime = Math.round(frameData.timestamp);
      setCurrent(generation);
    };
    frame.preRender(start);
    return () => cancelFrame(start);
  }, [damping, restDelta, restSpeed, latestRef, mass, preserveVelocity, setCurrent, stiffness, targetValue]);

  useEffect(() => () => animationRef.current?.stop(), []);
  return current;
}

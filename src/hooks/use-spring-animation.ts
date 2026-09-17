import { animate } from 'popmotion';
import { useEffect, useRef } from 'react';
import { useStateWithRef } from './use-state-with-ref.js';
import { useVelocityTracker } from './use-velocity-tracker.js';

interface AnimationControls {
  stop: () => void;
}

export interface UseSpringAnimationOptions {
  targetValue: number;
  stiffness: number;
  damping: number;
  mass: number;
  preserveVelocity: boolean;
  initialValue?: number;
  restDelta?: number;
  restSpeed?: number;
}

/**
 * Hook that manages spring animation with velocity preservation support
 * Returns the current animated value
 */
export function useSpringAnimation({
  targetValue,
  stiffness,
  damping,
  mass,
  preserveVelocity,
  initialValue = targetValue,
  restDelta = 0.001,
  restSpeed = 0.001,
}: UseSpringAnimationOptions): number {
  const [currentValue, setCurrentValue, latestCurrentValueRef] = useStateWithRef(initialValue);
  const velocityTracker = useVelocityTracker();
  const animationRef = useRef<AnimationControls | null>(null);

  useEffect(() => {
    if (animationRef.current) {
      animationRef.current.stop();
    }

    const initialVelocity = preserveVelocity ? velocityTracker.getVelocity() : 0;

    const animation = animate({
      from: latestCurrentValueRef.current,
      to: targetValue,
      type: 'spring',
      stiffness,
      damping,
      mass,
      velocity: initialVelocity,
      restDelta,
      restSpeed,
      onUpdate: (value) => {
        velocityTracker.track(value);
        setCurrentValue(value);
      },
      onComplete: () => {
        velocityTracker.reset();
        setCurrentValue(targetValue);
      },
    });

    animationRef.current = animation;

    return () => {
      animation.stop();
    };
  }, [
    damping,
    restDelta,
    restSpeed,
    latestCurrentValueRef,
    mass,
    preserveVelocity,
    setCurrentValue,
    stiffness,
    targetValue,
    velocityTracker,
  ]);

  return currentValue;
}

import { createSpringAnimationValue, type SpringAnimationConfig } from '#src/utils/spring-animation-value.js';
import { useMotionValue, useReducedMotion } from 'framer-motion';
import { useCallback, useLayoutEffect, useState } from 'react';

/** UI spring value: every retarget inherits the current position and analytical velocity. */
export function useSpringValueWithVelocityHandoff(initialValue: number) {
  const value = useMotionValue(initialValue);
  const [animation] = useState(() => createSpringAnimationValue(value));
  const reducedMotion = Boolean(useReducedMotion());

  useLayoutEffect(() => {
    if (reducedMotion) animation.jump(animation.getTarget());
    return () => animation.stop();
  }, [animation, reducedMotion]);

  const setTarget = useCallback(
    (target: number, config: SpringAnimationConfig) => animation.setTarget(target, config, reducedMotion),
    [animation, reducedMotion]
  );

  return { value, setTarget, jump: animation.jump };
}

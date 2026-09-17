import { CurveTransition, settledCurveFootprint, type CurveDisplayState } from '#src/utils/curve-transition.js';
import { useReducedMotion } from 'framer-motion';
import { useLayoutEffect, useRef, useState } from 'react';

export function useCurveTransition(target: CurveDisplayState) {
  const reducedMotion = Boolean(useReducedMotion());
  const [transition] = useState(() => new CurveTransition(target));
  const [rendered, setRendered] = useState(() => ({ reducedMotion, footprint: settledCurveFootprint(target) }));
  const committedRef = useRef(rendered.footprint);

  // A preference change snaps to an exact target, including when motion is
  // enabled again. Do not resurrect a frame from before reduced motion.
  if (rendered.reducedMotion !== reducedMotion) {
    setRendered({ reducedMotion, footprint: settledCurveFootprint(target) });
  }

  useLayoutEffect(() => {
    committedRef.current = reducedMotion ? settledCurveFootprint(target) : rendered.footprint;
  }, [rendered, reducedMotion, target]);

  useLayoutEffect(() => {
    if (reducedMotion) {
      transition.reset(target, performance.now());
      return;
    }
    transition.retarget(target, performance.now(), committedRef.current);
    let frame: number;
    let active = true;
    const tick = (now: number) => {
      if (!active) return;
      const current = transition.sample(now);
      if (current.settled) {
        transition.reset(target, now);
        setRendered({ reducedMotion, footprint: settledCurveFootprint(target) });
      } else {
        setRendered({ reducedMotion, footprint: current });
        frame = requestAnimationFrame(tick);
      }
    };
    frame = requestAnimationFrame(tick);
    return () => {
      active = false;
      cancelAnimationFrame(frame);
    };
  }, [target, transition, reducedMotion]);

  return reducedMotion ? target : rendered.footprint.position;
}

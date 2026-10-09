import { spring } from 'framer-motion';
import { resolveInitialVelocity, type InitialVelocityMode } from './initial-velocity.js';

export interface SpringResponseOptions {
  stiffness: number;
  damping: number;
  mass: number;
  restDelta: number;
  restSpeed: number;
  initialVelocity?: number;
  initialVelocityMode?: InitialVelocityMode;
}

/** Estimate settling time and plot bounds using the selected launch setting and user rest thresholds. */
export function sampleSpringResponse(options: SpringResponseOptions) {
  const { initialVelocity = 0, initialVelocityMode = 'toward-target', ...physics } = options;
  const velocity = resolveInitialVelocity(initialVelocity, initialVelocityMode, 0, 100);
  const generator = spring({ ...physics, keyframes: [0, 100], velocity });
  const samples: { time: number; value: number }[] = [];
  const interval = 1000 / 240;
  const limit = 30000;
  let duration: number | null = null;
  for (let time = 0; time <= limit; time += interval) {
    const state = generator.next(time);
    samples.push({ time, value: state.value });
    if (state.done) {
      duration = time;
      break;
    }
  }
  // Short, fast springs need more points when stretched across the plot width.
  // Keep settling-time detection at 240 Hz, then refine only the samples used for plot bounds.
  // The SVG path is sampled separately by createCurvePath without settling truncation.
  if (duration !== null && duration > 0 && samples.length < 1025) {
    const plotGenerator = spring({ ...physics, keyframes: [0, 100], velocity });
    const refined = Array.from({ length: 1025 }, (_, index) => {
      const time = (index / 1024) * duration;
      return { time, value: plotGenerator.next(time).value };
    });
    return { samples: refined, duration };
  }
  return { samples, duration };
}

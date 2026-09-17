import { spring } from 'popmotion';

export interface SpringResponseOptions {
  stiffness: number;
  damping: number;
  mass: number;
  restDelta: number;
  restSpeed: number;
}

/** Sample the same generator as the live animation, for a 0 → 100 step at rest. */
export function sampleSpringResponse(options: SpringResponseOptions) {
  const generator = spring({ ...options, from: 0, to: 100, velocity: 0 });
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
  // Keep settling-time detection at 240 Hz, then refine only the visible curve.
  if (duration !== null && duration > 0 && samples.length < 1025) {
    const plotGenerator = spring({ ...options, from: 0, to: 100, velocity: 0 });
    const refined = Array.from({ length: 1025 }, (_, index) => {
      const time = (index / 1024) * duration;
      return { time, value: plotGenerator.next(time).value };
    });
    return { samples: refined, duration };
  }
  return { samples, duration };
}

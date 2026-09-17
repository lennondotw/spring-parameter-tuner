import { CURVE_UPDATE_THROTTLE_MS } from '#src/constants/throttle.js';
import { useCurveTransition } from '#src/hooks/use-curve-transition.js';
import { useThrottledValue } from '#src/hooks/use-throttled-value.js';
import { createCurvePath } from '#src/utils/curve-path.js';
import { createCurveTarget } from '#src/utils/curve-transition.js';
import type { SpringResponseOptions } from '#src/utils/spring-response.js';
import { memo, useDeferredValue, useMemo } from 'react';

export function ResponseCurve({ options }: { options: SpringResponseOptions }) {
  const throttledOptions = useThrottledValue(options, CURVE_UPDATE_THROTTLE_MS);
  const deferredOptions = useDeferredValue(throttledOptions);
  return <ResponseCurvePlot options={deferredOptions} />;
}

// Playback frames do not rebuild the SVG; parameter changes can yield to input.
const ResponseCurvePlot = memo(function ResponseCurvePlot({ options }: { options: SpringResponseOptions }) {
  const target = useMemo(() => createCurveTarget(options), [options]);
  const display = useCurveTransition(target.display);
  const { path, end, ceiling } = useMemo(() => createCurvePath(display), [display]);
  const y = (value: number) => 164 - (value / ceiling) * 144;
  const duration = target.duration;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs text-neutral-500">Estimated settling time</span>
        <span className="font-mono text-sm">{duration === null ? '> 30 s' : `${(duration / 1000).toFixed(3)} s`}</span>
      </div>
      <svg
        viewBox="0 0 400 190"
        role="img"
        aria-label="Spring response curve for a zero to one hundred transition"
        className="w-full overflow-visible"
      >
        {[0, 25, 50, 75, 100].map((value) => (
          <line
            key={value}
            x1="20"
            x2="380"
            y1={y(value)}
            y2={y(value)}
            className="stroke-neutral-100 dark:stroke-neutral-900"
            strokeDasharray="2 5"
          />
        ))}
        <line
          x1="20"
          x2="380"
          y1={y(100)}
          y2={y(100)}
          className="stroke-neutral-300 dark:stroke-neutral-700"
          strokeDasharray="4 4"
        />
        <path
          d={path}
          fill="none"
          className="stroke-neutral-700 dark:stroke-neutral-300"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text x="20" y="186" className="fill-neutral-500" fontSize="10">
          0 s
        </text>
        <text x="380" y="186" textAnchor="end" className="fill-neutral-500" fontSize="10">
          {(end / 1000).toFixed(2)} s
        </text>
      </svg>
      <p className="text-xs text-neutral-500">
        Response to a 0 → 100 target change from rest. The estimate uses the rest thresholds in Advanced, up to 30 s.
        Live playback can settle differently depending on its starting position and velocity.
      </p>
    </div>
  );
});

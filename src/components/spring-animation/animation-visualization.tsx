import { MARKS, MAX_MARK, MIN_MARK } from '#src/constants/marks.js';
import { cn } from '#src/utils/cn.js';
import type { FC } from 'react';

/**
 * Props for AnimationVisualization component
 */
export interface AnimationVisualizationProps {
  value: number;
  className?: string;
}

/**
 * Component for visualizing the spring animation with a ball
 */
export const AnimationVisualization: FC<AnimationVisualizationProps> = ({ value, className }) => {
  const ballPercentage = (value - MIN_MARK) / (MAX_MARK - MIN_MARK);

  return (
    <div className={cn('relative h-10 w-full', className)}>
      {/* Paint opaque geometry together, then fade the entire axis as one layer. */}
      <div className="absolute inset-x-0 top-6 h-px text-black opacity-20 dark:text-white">
        <div className="absolute inset-0 rounded-full bg-current" />
        <div className="absolute inset-x-1 inset-y-0">
          {MARKS.map((mark) => (
            <div
              key={mark}
              className="absolute bottom-1/2 h-1.5 w-0.5 -translate-x-1/2 rounded-t-full bg-current"
              style={{ left: `${((mark - MIN_MARK) / (MAX_MARK - MIN_MARK)) * 100}%` }}
            />
          ))}
        </div>
      </div>
      {/* Keep the axis overhang; ticks, labels, and ball share the inset track. */}
      <div className="absolute inset-x-1 inset-y-0">
        {[MIN_MARK, MAX_MARK].map((mark) => (
          <span
            key={mark}
            className="absolute top-7 -translate-x-1/2 text-[10px]/3 text-neutral-400 tabular-nums dark:text-neutral-600"
            style={{ left: `${((mark - MIN_MARK) / (MAX_MARK - MIN_MARK)) * 100}%` }}
          >
            {mark}
          </span>
        ))}
        <div
          className="pointer-events-none absolute top-0 size-6 -translate-x-1/2 rounded-full bg-neutral-900 transition-none dark:bg-neutral-100"
          style={{ left: `${ballPercentage * 100}%` }}
        />
      </div>
    </div>
  );
};

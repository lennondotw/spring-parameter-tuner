import { MARKS, MAX_MARK, MIN_MARK } from '@/constants/marks.ts';
import { cn } from '@/utils/cn';
import { FC } from 'react';

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
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <div className="relative flex h-10 w-full items-center">
        {/* Axis */}
        <div className="absolute bottom-4 h-1 w-full rounded-full bg-gray-300">
          {/* 0-100 scale markers */}
          <div
            className="
            absolute top-1 -bottom-4 flex w-full items-center justify-between leading-3
          "
          >
            <div className="text-xs">{MIN_MARK}</div>
            <div className="text-xs">{MAX_MARK}</div>
          </div>
          <div className="absolute inset-x-1 inset-y-0">
            {/* Scale lines */}
            {MARKS.map((mark) => (
              <div
                key={mark}
                className="
                  absolute bottom-1 h-1.5 w-0.5 -translate-x-1/2 rounded-t-full bg-gray-400
                "
                style={{ left: `${mark}%` }}
              />
            ))}
          </div>
        </div>

        <div className="absolute inset-x-1 inset-y-0">
          {/* Ball */}
          <div
            className="
              absolute top-0 size-6 -translate-x-1/2 rounded-full bg-blue-500 shadow-lg
              transition-none
            "
            style={{ left: `${ballPercentage * 100}%` }}
          >
            <div className="absolute inset-1.5 rounded-full bg-blue-300 opacity-70 shadow-md/10" />
          </div>
        </div>
      </div>
    </div>
  );
};

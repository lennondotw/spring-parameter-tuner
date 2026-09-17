import { cn } from '#src/utils/cn.js';
import type { FC } from 'react';

export const HelpText: FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('flex w-full flex-col gap-4 text-xs/5 text-neutral-500', className)}>
      <p>
        Explore how stiffness, damping, and mass shape a spring animation, or tune the same response using natural
        frequency and damping ratio. Normalize sets mass to 1 and rescales stiffness and damping without changing the
        motion. Reset restores the default spring parameters.
      </p>
      <p>
        The response curve shows a 0 → 100 transition from rest. Advanced controls how close and how slow the spring
        must be before it stops. In the live preview, use the target buttons or click and drag the ruler to interrupt
        the animation with a new target. The ruler’s edge gutters also accept values below 0 and above 100. Preserve
        velocity carries momentum into each new target; turn it off to restart with zero velocity.
      </p>
      <p>
        Focus a number field and use ↑ / ↓ to adjust it, or hold Shift for larger steps. The global keys Q W E R T Y U I
        O P [ trigger targets from 0 to 100 in steps of 10, even with a field focused or the panel collapsed. Share the
        page URL to share stiffness, damping, and mass; playback targets and rest thresholds stay local.
      </p>
      <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-neutral-400 dark:text-neutral-600">
        <a
          href="https://github.com/lennondotw/spring-parameter-tuner"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-sm no-underline transition-colors hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-neutral-300"
        >
          GitHub
        </a>
        <span aria-hidden="true">·</span>
        <span>
          made with <span className="opacity-40">❤️</span> by{' '}
          <a
            href="https://x.com/lennondotw"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-sm no-underline transition-colors hover:text-neutral-700 focus-visible:outline-2 focus-visible:outline-offset-2 dark:hover:text-neutral-300"
          >
            @lennondotw
          </a>
        </span>
      </div>
    </div>
  );
};

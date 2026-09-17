import { cn } from '#src/utils/cn.js';
import type { FC } from 'react';

export interface DividerProps {
  className?: string;
}

export const Divider: FC<DividerProps> = ({ className }) => {
  return (
    <div aria-hidden="true" className={cn('h-px w-full shrink-0 bg-neutral-100 dark:bg-neutral-900', className)} />
  );
};

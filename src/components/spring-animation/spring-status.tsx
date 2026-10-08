import type { SpringStatus as Status } from '#src/hooks/use-spring-animation.js';
import { cn } from '#src/utils/cn.js';
import type { FC } from 'react';

const labels: Record<Status, string> = { idle: 'Idle', running: 'Running', settled: 'Settled' };

export const SpringStatus: FC<{ status: Status; className?: string }> = ({ status, className }) => (
  <span className={cn('text-xs text-muted-foreground', className)}>{labels[status]}</span>
);

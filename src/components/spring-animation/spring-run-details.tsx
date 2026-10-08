import { Divider } from '#src/components/divider.js';
import type { SpringAnimationState, SpringRestartReason } from '#src/hooks/use-spring-animation.js';
import type { FC, ReactNode } from 'react';
import { SpringStatus } from './spring-status.js';

const sources = { inherited: 'Inherited', zeroed: 'Zeroed', 'from-rest': 'From rest' };
const reasons: Record<SpringRestartReason, string> = {
  'new-run': 'New run',
  target: 'Target changed',
  parameters: 'Parameters changed',
  thresholds: 'Thresholds changed',
  handoff: 'Handoff changed',
};
const number = (value: number | null) => (value === null ? '—' : value.toFixed(2));
const signed = (value: number | null) => (value === null ? '—' : `${value > 0 ? '+' : ''}${value.toFixed(2)}`);

export const SpringRunDetails: FC<{ spring: SpringAnimationState }> = ({ spring }) => (
  <div className="flex flex-col gap-4 text-xs">
    <DetailGroup title="Run">
      <Detail label="Status">
        <SpringStatus status={spring.status} className="text-neutral-800 dark:text-neutral-200" />
      </Detail>
      <Detail label="Run / Generation">{spring.run ? `R${spring.run} · G${spring.generation}` : '—'}</Detail>
      <Detail label="Elapsed">{spring.run ? `${(spring.elapsed / 1000).toFixed(3)} s` : '—'}</Detail>
    </DetailGroup>
    <Divider />
    <DetailGroup title="Motion">
      <Detail label="Current velocity">{signed(spring.velocity)} units/s</Detail>
      <Detail label="Distance to target">{signed(spring.targetValue - spring.value)} units</Detail>
    </DetailGroup>
    <Divider />
    <DetailGroup title="Start & handoff">
      <Detail label="Start value → Target">
        {spring.run ? (
          <>
            {number(spring.startValue)} <span className="font-sans">→</span> {number(spring.targetValue)}
          </>
        ) : (
          '—'
        )}
      </Detail>
      <Detail label="Initial velocity">
        {signed(spring.initialVelocity)}
        {spring.initialVelocity !== null && ' units/s'}
      </Detail>
      <Detail label="Velocity source">{spring.velocitySource ? sources[spring.velocitySource] : '—'}</Detail>
      <Detail label="Restart reason">
        {spring.restartReasons.length ? spring.restartReasons.map((reason) => reasons[reason]).join(', ') : '—'}
      </Detail>
    </DetailGroup>
  </div>
);

const DetailGroup: FC<{ title: string; children: ReactNode }> = ({ title, children }) => (
  <div className="flex flex-col gap-3">
    <h3 className="text-xs font-medium tracking-wide text-muted-foreground">{title}</h3>
    <dl className="flex flex-col gap-3">{children}</dl>
  </div>
);

const Detail: FC<{ label: string; children: ReactNode }> = ({ label, children }) => (
  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className="m-0 font-mono text-neutral-800 tabular-nums dark:text-neutral-200">{children}</dd>
  </div>
);

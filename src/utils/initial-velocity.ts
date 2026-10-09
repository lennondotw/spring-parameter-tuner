export type InitialVelocityMode = 'zero' | 'toward-target';

/** Convert percent of travel distance per second to actual velocity toward the target. */
export function resolveInitialVelocity(value: number, mode: InitialVelocityMode, from: number, target: number) {
  if (mode === 'zero' || value === 0 || target === from) return 0;
  return (Math.abs(value) / 100) * (target - from);
}

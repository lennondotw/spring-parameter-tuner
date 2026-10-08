export type InitialVelocityMode = 'zero' | 'toward-target' | 'fixed';
export type InitialVelocityUnit = 'normalized' | 'absolute';

/** Resolve the configured speed and direction to actual units/s. */
export function resolveInitialVelocity(
  value: number,
  mode: InitialVelocityMode,
  from: number,
  target: number,
  unit: InitialVelocityUnit = 'normalized'
) {
  const distance = Math.abs(target - from);
  if (mode === 'zero' || value === 0 || (distance === 0 && (unit === 'normalized' || mode === 'toward-target')))
    return 0;
  const velocity = unit === 'normalized' ? (value / 100) * distance : value;
  if (mode === 'toward-target') return Math.abs(velocity) * Math.sign(target - from);
  return velocity;
}

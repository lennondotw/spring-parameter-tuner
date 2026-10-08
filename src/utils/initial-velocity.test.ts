import { expect, it } from 'vitest';
import { resolveInitialVelocity } from './initial-velocity.js';

it.each([10, 100])('resolves speed units and direction for distance %s', (distance) => {
  expect(resolveInitialVelocity(2000, 'toward-target', 0, distance, 'normalized')).toBe(20 * distance);
  expect(resolveInitialVelocity(2000, 'toward-target', distance, 0, 'normalized')).toBe(-20 * distance);
  expect(resolveInitialVelocity(2000, 'toward-target', 0, distance, 'absolute')).toBe(2000);
  expect(resolveInitialVelocity(2000, 'toward-target', distance, 0, 'absolute')).toBe(-2000);
  expect(resolveInitialVelocity(-2000, 'fixed', distance, 0, 'normalized')).toBe(-20 * distance);
  expect(resolveInitialVelocity(-2000, 'fixed', 0, distance, 'absolute')).toBe(-2000);
});

it.each(['normalized', 'absolute'] as const)('Zero overrides the stored speed in %s units', (unit) => {
  expect(resolveInitialVelocity(-2000, 'zero', 10, 0, unit)).toBe(0);
  expect(resolveInitialVelocity(0, 'toward-target', 10, 0, unit)).toBe(0);
  expect(resolveInitialVelocity(2000, 'toward-target', 10, 10, unit)).toBe(0);
});

it('allows fixed absolute momentum at the target while normalized speed resolves to zero', () => {
  expect(resolveInitialVelocity(-2000, 'fixed', 10, 10, 'absolute')).toBe(-2000);
  expect(resolveInitialVelocity(-2000, 'fixed', 10, 10, 'normalized')).toBe(0);
});

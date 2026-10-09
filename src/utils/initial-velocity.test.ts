import { expect, it } from 'vitest';
import { resolveInitialVelocity } from './initial-velocity.js';

it.each([1, 10, 100])('scales initial speed with travel distance %s and follows the target', (distance) => {
  expect(resolveInitialVelocity(2000, 'toward-target', 0, distance)).toBe(20 * distance);
  expect(resolveInitialVelocity(2000, 'toward-target', distance, 0)).toBe(-20 * distance);
});

it('Zero overrides the stored speed and zero distance cannot inject motion', () => {
  expect(resolveInitialVelocity(2000, 'zero', 10, 0)).toBe(0);
  expect(resolveInitialVelocity(0, 'toward-target', 10, 0)).toBe(0);
  expect(resolveInitialVelocity(2000, 'toward-target', 10, 10)).toBe(0);
});

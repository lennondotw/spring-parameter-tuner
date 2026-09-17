import { describe, expect, it } from 'vitest';
import { normalizeSpring, physicalToPerceptual } from './spring-physics.js';
import { sampleSpringResponse } from './spring-response.js';

const options = { stiffness: 100, damping: 10, mass: 1, restDelta: 0.001, restSpeed: 0.001 };

describe('spring response', () => {
  it('captures overshoot and settles at the target', () => {
    const result = sampleSpringResponse(options);
    expect(result.samples[0]?.value).toBe(0);
    expect(Math.max(...result.samples.map((sample) => sample.value))).toBeGreaterThan(100);
    expect(result.duration).toBeGreaterThan(0);
    expect(result.samples.at(-1)?.value).toBe(100);
  });
  it('settles sooner with looser thresholds', () => {
    const strict = sampleSpringResponse(options);
    const loose = sampleSpringResponse({ ...options, restDelta: 1, restSpeed: 1 });
    expect(strict.duration).not.toBeNull();
    expect(loose.duration).not.toBeNull();
    expect(loose.duration).toBeLessThan(strict.duration ?? 0);
  });
  it('caps a spring that does not settle', () => {
    const result = sampleSpringResponse({ ...options, damping: 0 });
    expect(result.duration).toBeNull();
    expect(result.samples.length).toBeLessThanOrEqual(7201);
  });
});

it('normalization preserves frequency, damping ratio and sampled response', () => {
  const original = { ...options, stiffness: 400, damping: 40, mass: 4 };
  const normalized = normalizeSpring(original.stiffness, original.damping, original.mass);
  expect(normalized).toEqual({ stiffness: 100, damping: 10, mass: 1 });
  expect(physicalToPerceptual(normalized.stiffness, normalized.damping, normalized.mass)).toEqual(
    physicalToPerceptual(original.stiffness, original.damping, original.mass)
  );
  expect(sampleSpringResponse({ ...original, ...normalized })).toEqual(sampleSpringResponse(original));
});

it('refines short curves without changing the start or settled endpoint', () => {
  const result = sampleSpringResponse({ ...options, stiffness: 5270.76, damping: 85.67 });
  expect(result.samples).toHaveLength(1025);
  expect(result.samples[0]).toEqual({ time: 0, value: 0 });
  expect(result.samples.at(-1)).toEqual({ time: result.duration, value: 100 });
});

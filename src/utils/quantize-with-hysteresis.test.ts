import { describe, expect, it } from 'vitest';
import { quantizeWithHysteresis } from './quantize-with-hysteresis.js';

describe('quantizeWithHysteresis', () => {
  it('holds both sides of a boundary until the directional threshold is crossed', () => {
    const q = (raw: number, previous: number) => quantizeWithHysteresis(raw, previous, 1, 0, 1);
    expect(q(0.25, 0.2)).toBe(0.2);
    expect(q(0.26, 0.2)).toBe(0.2);
    expect(q(0.260001, 0.2)).toBe(0.3);
    expect(q(0.25, 0.3)).toBe(0.3);
    expect(q(0.24, 0.3)).toBe(0.3);
    expect(q(0.239999, 0.3)).toBe(0.2);
  });
  it('handles large jumps and allows exact endpoints', () => {
    expect(quantizeWithHysteresis(0.87, 0.2, 1, 0, 1)).toBe(0.9);
    expect(quantizeWithHysteresis(0.01, 0.03, 1, 0.01, 0.95)).toBe(0.01);
    expect(quantizeWithHysteresis(0.95, 0.9, 1, 0.01, 0.95)).toBe(0.95);
  });
});

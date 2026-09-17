import { describe, expect, it } from 'vitest';
import {
  calculateCriticalDamping,
  getDampingType,
  perceptualToPhysical,
  physicalToPerceptual,
} from './spring-physics.js';

describe('spring-physics', () => {
  it('defaults both conversions to unit mass', () => {
    expect(perceptualToPhysical(35, 1)).toEqual({ stiffness: 1225, damping: 70 });
    expect(physicalToPerceptual(1225, 70)).toEqual({ omega: 35, zeta: 1 });
    expect(perceptualToPhysical(25, 1)).toEqual({ stiffness: 625, damping: 50 });
  });

  describe('perceptualToPhysical', () => {
    it('converts omega and zeta to stiffness and damping', () => {
      const omega = 20;
      const zeta = 1;
      const mass = 1;

      const result = perceptualToPhysical(omega, zeta, mass);

      expect(result.stiffness).toBe(400); // ω² × m = 20² × 1 = 400
      expect(result.damping).toBe(40); // ζ × 2 × ω × m = 1 × 2 × 20 × 1 = 40
    });

    it('handles different mass values', () => {
      const omega = 10;
      const zeta = 0.5;
      const mass = 2;

      const result = perceptualToPhysical(omega, zeta, mass);

      expect(result.stiffness).toBe(200); // 10² × 2 = 200
      expect(result.damping).toBe(20); // 0.5 × 2 × 10 × 2 = 20
    });

    it('handles underdamped case (zeta < 1)', () => {
      const result = perceptualToPhysical(20, 0.3, 1);

      expect(result.stiffness).toBe(400);
      expect(result.damping).toBe(12); // 0.3 × 2 × 20 × 1 = 12
    });

    it('handles overdamped case (zeta > 1)', () => {
      const result = perceptualToPhysical(20, 1.5, 1);

      expect(result.stiffness).toBe(400);
      expect(result.damping).toBe(60); // 1.5 × 2 × 20 × 1 = 60
    });
  });

  describe('physicalToPerceptual', () => {
    it('converts stiffness and damping to omega and zeta', () => {
      const stiffness = 400;
      const damping = 40;
      const mass = 1;

      const result = physicalToPerceptual(stiffness, damping, mass);

      expect(result.omega).toBe(20); // √(400 / 1) = 20
      expect(result.zeta).toBe(1); // 40 / (2 × 20 × 1) = 1
    });

    it('handles different mass values', () => {
      const result = physicalToPerceptual(200, 20, 2);

      expect(result.omega).toBe(10); // √(200 / 2) = 10
      expect(result.zeta).toBe(0.5); // 20 / (2 × 10 × 2) = 0.5
    });

    it('is inverse of perceptualToPhysical', () => {
      const originalOmega = 15;
      const originalZeta = 0.7;
      const mass = 1.5;

      const physical = perceptualToPhysical(originalOmega, originalZeta, mass);
      const perceptual = physicalToPerceptual(physical.stiffness, physical.damping, mass);

      expect(perceptual.omega).toBeCloseTo(originalOmega);
      expect(perceptual.zeta).toBeCloseTo(originalZeta);
    });
  });

  describe('calculateCriticalDamping', () => {
    it('calculates critical damping value', () => {
      const stiffness = 400;
      const mass = 1;

      const result = calculateCriticalDamping(stiffness, mass);

      expect(result).toBe(40); // 2 × √(400 × 1) = 40
    });

    it('equals damping when zeta = 1 (critical damping)', () => {
      const omega = 20;
      const mass = 1;
      const { stiffness, damping } = perceptualToPhysical(omega, 1, mass);

      const criticalDamping = calculateCriticalDamping(stiffness, mass);

      expect(criticalDamping).toBe(damping);
    });
  });

  describe('getDampingType', () => {
    it('returns underdamped for zeta < 1', () => {
      expect(getDampingType(0.5)).toBe('underdamped');
      expect(getDampingType(0.99)).toBe('underdamped');
    });

    it('returns critical for zeta ≈ 1', () => {
      expect(getDampingType(1)).toBe('critical');
      expect(getDampingType(0.9995)).toBe('critical');
      expect(getDampingType(1.0005)).toBe('critical');
    });

    it('returns overdamped for zeta > 1', () => {
      expect(getDampingType(1.5)).toBe('overdamped');
      expect(getDampingType(1.01)).toBe('overdamped');
    });
  });
});

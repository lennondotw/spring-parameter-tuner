/**
 * Spring physics conversion utilities
 * Bidirectional conversion between physical and perceptual parameters
 */

/** Divide the equation of motion by mass without changing its response. */
export function normalizeSpring(stiffness: number, damping: number, mass: number) {
  return { stiffness: stiffness / mass, damping: damping / mass, mass: 1 };
}

/** Convert angular frequency ω (rad/s), damping ratio ζ and mass to stiffness/damping. */
export function perceptualToPhysical(omega: number, zeta: number, mass = 1): { stiffness: number; damping: number } {
  // stiffness = ω² × m
  const stiffness = omega * omega * mass;
  // damping = ζ × 2 × ω × m
  const damping = zeta * 2 * omega * mass;
  return { stiffness, damping };
}

/**
 * Convert physical parameters to perceptual (physical → perceptual)
 * @param stiffness - Spring stiffness (k)
 * @param damping - Damping coefficient (c)
 * @param mass - Object mass (m)
 */
export function physicalToPerceptual(stiffness: number, damping: number, mass = 1): { omega: number; zeta: number } {
  // ω = √(k / m)
  const omega = Math.sqrt(stiffness / mass);
  // ζ = c / (2 × √(k × m)) = c / (2 × ω × m)
  const zeta = damping / (2 * omega * mass);
  return { omega, zeta };
}

/**
 * Calculate critical damping value
 * @param stiffness - Spring stiffness (k)
 * @param mass - Object mass (m)
 */
export function calculateCriticalDamping(stiffness: number, mass: number): number {
  return 2 * Math.sqrt(stiffness * mass);
}

export type DampingType = 'underdamped' | 'critical' | 'overdamped';

/**
 * Determine damping type based on damping ratio (ζ)
 * Uses epsilon for floating point comparison
 */
export function getDampingType(zeta: number, epsilon = 0.001): DampingType {
  if (zeta < 1 - epsilon) return 'underdamped';
  if (zeta > 1 + epsilon) return 'overdamped';
  return 'critical';
}

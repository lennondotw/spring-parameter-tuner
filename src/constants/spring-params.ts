export const SPRING_PARAMS = {
  STIFFNESS: {
    MIN: 1,
    MAX: 10000,
    DEFAULT: 400,
    STEP: 1,
    DESCRIPTION: 'Higher = faster oscillation, stronger restoring force',
  },
  DAMPING: {
    MIN: 2,
    MAX: 400,
    DEFAULT: 40,
    STEP: 1,
    DESCRIPTION: 'Higher = less bounce; too much damping slows the response',
  },
  MASS: {
    MIN: 0.1,
    MAX: 10,
    DEFAULT: 1.0,
    STEP: 0.1,
    DESCRIPTION: 'Higher = more inertia; Normalize sets mass to 1 without changing the response',
  },
};

export const PERCEPTUAL_PARAMS = {
  OMEGA: {
    MIN: 1,
    MAX: 100,
    STEP: 0.1,
    DESCRIPTION: 'ω = √(k/m), controls animation speed',
  },
  ZETA: {
    MIN: 0.01,
    MAX: 2.0,
    STEP: 0.01,
    DESCRIPTION: '<1 underdamped · =1 critical · >1 overdamped',
  },
};

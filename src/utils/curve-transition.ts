import { CURVE_TRANSITION_SPRING, TIME_AXIS_TRANSITION_SPRING } from '#src/constants/interface-springs.js';
import { physicalToPerceptual } from './spring-physics.js';
import { sampleSpringResponse, type SpringResponseOptions } from './spring-response.js';

export interface CurveDisplayState {
  logOmega: number;
  logZeta: number;
  logEnd: number;
  logCeiling: number;
}
export interface CurveFootprint {
  position: CurveDisplayState;
  velocity: CurveDisplayState;
}

export function settledCurveFootprint(position: CurveDisplayState): CurveFootprint {
  return { position: { ...position }, velocity: { ...zeroVelocity } };
}
const keys = ['logOmega', 'logZeta', 'logEnd', 'logCeiling'] as const;
const zeroVelocity: CurveDisplayState = { logOmega: 0, logZeta: 0, logEnd: 0, logCeiling: 0 };

/** Predict only at a new target, never from intermediate display parameters. */
export function createCurveTarget(options: SpringResponseOptions) {
  const { omega, zeta } = physicalToPerceptual(options.stiffness, options.damping, options.mass);
  const { duration } = sampleSpringResponse(options);
  const peak = zeta < 1 ? 100 * (1 + Math.exp((-Math.PI * zeta) / Math.sqrt(1 - zeta * zeta))) : 100;
  return {
    duration,
    display: {
      logOmega: Math.log(omega),
      logZeta: Math.log1p(zeta),
      logEnd: Math.log(Math.max(duration ?? 30000, 1)),
      logCeiling: Math.log(Math.max(110, peak + 5)),
    },
  };
}

/** Exact critically damped solution; position AND velocity survive retargets. */
export class CurveTransition {
  private position: CurveDisplayState;
  private velocity = { ...zeroVelocity };
  private target: CurveDisplayState;
  private startedAt = 0;

  constructor(initial: CurveDisplayState) {
    this.position = { ...initial };
    this.target = { ...initial };
  }

  sample(now: number) {
    const seconds = Math.max(0, now - this.startedAt) / 1000;
    const position = { ...this.position };
    const velocity = { ...this.velocity };
    let settled = true;
    for (const key of keys) {
      // Both configurations are critically damped (ζ = 1); each channel has its own ω.
      const frequency = key === 'logEnd' ? TIME_AXIS_TRANSITION_SPRING.omega : CURVE_TRANSITION_SPRING.omega;
      const decay = Math.exp(-frequency * seconds);
      const offset = this.position[key] - this.target[key];
      const coefficient = this.velocity[key] + frequency * offset;
      position[key] = this.target[key] + (offset + coefficient * seconds) * decay;
      velocity[key] = (this.velocity[key] - frequency * coefficient * seconds) * decay;
      if (Math.abs(position[key] - this.target[key]) > 0.00001 || Math.abs(velocity[key]) > 0.0001) {
        settled = false;
      }
    }
    return { position, velocity, settled };
  }

  retarget(target: CurveDisplayState, now: number, footprint: CurveFootprint = this.sample(now)) {
    // The renderer can hand off its last committed frame instead of extrapolating
    // an unseen position between frames. Copy it so velocity constraints cannot
    // mutate the old frame's state.
    const current = footprint;
    this.position = { ...current.position };
    this.velocity = { ...current.velocity };
    // A monotone critical response requires velocity towards the target, bounded
    // by frequency × distance. Preserve all other channels' velocity unchanged.
    const distance = target.logEnd - current.position.logEnd;
    const direction = Math.sign(distance);
    const towardsTarget = direction * current.velocity.logEnd;
    this.velocity.logEnd =
      direction * Math.min(Math.max(0, towardsTarget), TIME_AXIS_TRANSITION_SPRING.omega * Math.abs(distance));
    this.target = { ...target };
    this.startedAt = now;
  }

  reset(target: CurveDisplayState, now: number) {
    this.position = { ...target };
    this.target = { ...target };
    this.velocity = { ...zeroVelocity };
    this.startedAt = now;
  }
}

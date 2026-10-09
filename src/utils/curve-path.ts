import { spring } from 'framer-motion';
import type { CurveDisplayState } from './curve-transition.js';
import { perceptualToPhysical } from './spring-physics.js';

/**
 * Draw the continuous analytical response across the current display window.
 * User settling thresholds determine the time-axis estimate, not when the plotted
 * response snaps to the target; a loose threshold can leave the endpoint short of it.
 */
export function createCurvePath(display: CurveDisplayState) {
  const omega = Math.exp(display.logOmega);
  const zeta = Math.max(0, Math.expm1(display.logZeta));
  const end = Math.exp(display.logEnd);
  const ceiling = Math.exp(display.logCeiling);
  const floor = -Math.max(0, Math.expm1(display.logFloorDepth));
  const generator = spring({
    keyframes: [0, 100],
    velocity: display.initialVelocity,
    ...perceptualToPhysical(omega, zeta),
    mass: 1,
    // Zero is treated as unset by Motion and falls back to default stop thresholds,
    // which would snap the plotted response to the target prematurely.
    restDelta: Number.MIN_VALUE,
    restSpeed: Number.MIN_VALUE,
  });
  // Enough samples for the plot width, with extra density for oscillatory windows.
  const segments = Math.min(8192, Math.max(1024, Math.ceil((end / 1000) * omega * 8)));
  const commands: string[] = [];
  for (let index = 0; index <= segments; index++) {
    const u = index / segments;
    const value = generator.next(u * end).value;
    commands.push(
      `${index === 0 ? 'M' : 'L'}${(20 + u * 360).toFixed(3)},${(164 - ((value - floor) / (ceiling - floor)) * 144).toFixed(3)}`
    );
  }
  return { path: commands.join(' '), end, ceiling, floor };
}

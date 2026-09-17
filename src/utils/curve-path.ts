import { spring } from 'popmotion';
import type { CurveDisplayState } from './curve-transition.js';
import { perceptualToPhysical } from './spring-physics.js';

/** Sample the untruncated response across the CURRENT window, not the target window. */
export function createCurvePath(display: CurveDisplayState) {
  const omega = Math.exp(display.logOmega);
  const zeta = Math.max(0, Math.expm1(display.logZeta));
  const end = Math.exp(display.logEnd);
  const ceiling = Math.exp(display.logCeiling);
  const generator = spring({
    from: 0,
    to: 100,
    velocity: 0,
    ...perceptualToPhysical(omega, zeta),
    mass: 1,
    restDelta: 0,
    restSpeed: 0,
  });
  // Enough samples for the plot width, with extra density for oscillatory windows.
  const segments = Math.min(8192, Math.max(1024, Math.ceil((end / 1000) * omega * 8)));
  const commands: string[] = [];
  for (let index = 0; index <= segments; index++) {
    const u = index / segments;
    const value = generator.next(u * end).value;
    commands.push(
      `${index === 0 ? 'M' : 'L'}${(20 + u * 360).toFixed(3)},${(164 - (value / ceiling) * 144).toFixed(3)}`
    );
  }
  return { path: commands.join(' '), end, ceiling };
}

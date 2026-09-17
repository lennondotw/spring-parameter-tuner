import { describe, expect, it } from 'vitest';
import { createCurvePath } from './curve-path.js';
import { createCurveTarget, CurveTransition, type CurveDisplayState } from './curve-transition.js';

const initial: CurveDisplayState = {
  logOmega: Math.log(10),
  logZeta: Math.log1p(0.5),
  logEnd: Math.log(1000),
  logCeiling: Math.log(120),
};

function expectMonotone(transition: CurveTransition, start: number, target: number) {
  let previous = transition.sample(start).position.logEnd;
  const direction = Math.sign(target - previous);
  for (let time = start; time <= start + 3000; time += 4) {
    const current = transition.sample(time).position.logEnd;
    expect(direction * (current - previous)).toBeGreaterThanOrEqual(-1e-12);
    expect(direction * (target - current)).toBeGreaterThanOrEqual(-1e-12);
    previous = current;
  }
  expect(previous).toBeCloseTo(target, 8);
}

describe('curve transition', () => {
  it('hands off the rendered footprint without extrapolating or mutating it', () => {
    const transition = new CurveTransition(initial);
    transition.retarget({ ...initial, logOmega: Math.log(40), logEnd: Math.log(3000) }, 0);
    const painted = transition.sample(40);
    const saved = structuredClone(painted);
    const path = createCurvePath(painted.position).path;
    const target = { ...initial, logOmega: Math.log(5), logEnd: Math.log(500) };
    transition.retarget(target, 55, painted);
    const handedOff = transition.sample(55);
    expect(handedOff.position).toEqual(painted.position);
    expect(createCurvePath(handedOff.position).path).toBe(path);
    expect(handedOff.velocity.logOmega).toBe(painted.velocity.logOmega);
    expect(handedOff.velocity.logEnd).toBeCloseTo(0, 12);
    expect(painted).toEqual(saved);
    expectMonotone(transition, 55, target.logEnd);
  });

  it('retains safe axis velocity and bounds a same-direction velocity for a closer target', () => {
    const transition = new CurveTransition(initial);
    transition.retarget({ ...initial, logEnd: initial.logEnd + 2 }, 0);
    const painted = transition.sample(40);
    transition.retarget({ ...initial, logEnd: initial.logEnd + 3 }, 45, painted);
    expect(transition.sample(45).velocity.logEnd).toBe(painted.velocity.logEnd);
    const nearTarget = painted.position.logEnd + 0.001;
    transition.retarget({ ...initial, logEnd: nearTarget }, 46, painted);
    expect(transition.sample(46).velocity.logEnd).toBeCloseTo(30 * 0.001, 12);
    expectMonotone(transition, 46, nearTarget);
  });

  it('uses matching critical frequencies for the curve and time axis', () => {
    const transition = new CurveTransition(initial);
    transition.retarget({ ...initial, logOmega: initial.logOmega + 1, logEnd: initial.logEnd + 1 }, 0);
    const current = transition.sample(100).position;
    const response = (omega: number) => 1 - (1 + omega * 0.1) * Math.exp(-omega * 0.1);
    expect(current.logOmega - initial.logOmega).toBeCloseTo(response(30), 12);
    expect(current.logEnd - initial.logEnd).toBeCloseTo(response(30), 12);
  });

  it('hands off displayed position and parameter velocities on interruption', () => {
    const transition = new CurveTransition(initial);
    transition.retarget({ ...initial, logOmega: Math.log(40), logEnd: Math.log(3000) }, 0);
    const footprint = transition.sample(50);
    transition.retarget({ ...initial, logOmega: Math.log(5), logEnd: Math.log(4000) }, 50);
    const resumed = transition.sample(50);
    expect(resumed.position).toEqual(footprint.position);
    expect(resumed.velocity.logOmega).toBe(footprint.velocity.logOmega);
    expect(resumed.velocity.logZeta).toBe(footprint.velocity.logZeta);
  });

  it('keeps each time-axis transition monotone, including reversed and closer targets', () => {
    const transition = new CurveTransition(initial);
    transition.retarget({ ...initial, logEnd: Math.log(5000) }, 0);
    expectMonotone(transition, 0, Math.log(5000));
    transition.retarget({ ...initial, logEnd: Math.log(500) }, 50);
    expectMonotone(transition, 50, Math.log(500));
    const current = transition.sample(70).position.logEnd;
    transition.retarget({ ...initial, logEnd: current - 0.001 }, 70);
    expectMonotone(transition, 70, current - 0.001);
  });

  it('holds a target exactly at the current time-axis position', () => {
    const transition = new CurveTransition(initial);
    transition.retarget({ ...initial, logEnd: Math.log(5000) }, 0);
    const current = transition.sample(50).position.logEnd;
    transition.retarget({ ...initial, logEnd: current }, 50);
    expect(transition.sample(150).position.logEnd).toBe(current);
  });

  it('samples the current full window without truncating at the stopping threshold', () => {
    const options = { stiffness: 100, damping: 10, mass: 1, restDelta: 1, restSpeed: 1 };
    const target = createCurveTarget(options);
    const extended = { ...target.display, logEnd: Math.log(5000) };
    const plot = createCurvePath(extended);
    expect(plot.end).toBeCloseTo(5000);
    expect(plot.path).toMatch(/^M20\.000,/);
    expect(plot.path).toContain('L380.000,');
    expect(plot.path).not.toMatch(/NaN|Infinity/);
    expect(target.duration).toBeLessThan(plot.end);
  });
});

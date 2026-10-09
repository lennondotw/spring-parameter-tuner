import { PANEL_STATE_KEY } from '#src/hooks/use-panel-state.js';
import { resolveInitialVelocity } from '#src/utils/initial-velocity.js';
import type { SpringResponseOptions } from '#src/utils/spring-response.js';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { SpringAnimationDemo } from './index.js';

const playback = vi.hoisted(() => ({ value: 50, preserveVelocity: true }));
vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  // Decorative ruler markers do not participate in the page's target/handoff contract.
  // Avoid happy-dom's rejected WAAPI cancellation promises during pointer-release cleanup.
  return { ...actual, AnimatePresence: () => null };
});
vi.mock('#src/hooks/use-spring-animation.js', () => ({
  useSpringAnimation: (options: { preserveVelocity: boolean }) => {
    playback.preserveVelocity = options.preserveVelocity;
    return {
      value: playback.value,
      status: 'idle',
      velocity: 0,
      run: 0,
      generation: 0,
      startValue: null,
      targetValue: 50,
      initialVelocity: null,
      velocitySource: null,
      elapsed: 0,
      restartReasons: [],
    };
  },
}));
vi.mock('./response-curve.js', () => ({
  ResponseCurve: ({ options }: { options: SpringResponseOptions }) => (
    <output aria-label="Curve initial velocity">
      {resolveInitialVelocity(options.initialVelocity ?? 0, options.initialVelocityMode ?? 'toward-target', 0, 100)}
    </output>
  ),
}));
// Exercise page-level URL scheduling with deterministic parameter edits.
vi.mock('./spring-parameter-control.js', () => ({
  SpringParameterControl: ({
    onStiffnessChange,
    onNormalize,
    onReset,
  }: {
    onStiffnessChange: (value: number) => void;
    onNormalize: () => void;
    onReset: () => void;
  }) => (
    <>
      <button onClick={() => onStiffnessChange(1000)}>Change stiffness</button>
      <button onClick={() => onStiffnessChange(1200)}>Change again</button>
      <button onClick={onNormalize}>Normalize</button>
      <button onClick={onReset}>Reset</button>
    </>
  ),
}));

const initialUrl = window.location.href;
afterEach(() => {
  cleanup();
  localStorage.removeItem(PANEL_STATE_KEY);
  vi.useRealTimers();
  vi.restoreAllMocks();
  playback.value = 50;
  window.history.replaceState({}, '', initialUrl);
});

it('keeps preset selection independent of playback and clears it for an equal ruler target', () => {
  const { container, rerender } = render(<SpringAnimationDemo />);
  const preset = screen.getByRole('button', { name: '20 e' });
  fireEvent.click(preset);
  for (const value of [0, 10, 19.9, 20, 21, 10]) {
    playback.value = value;
    rerender(<SpringAnimationDemo />);
    expect(preset).toHaveAttribute('aria-pressed', 'true');
    expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(1);
  }
  const track = screen.getByRole('region', { name: 'Live preview' }).querySelector('.touch-none');
  if (!track) throw new Error('Missing ruler');
  Object.assign(track, { setPointerCapture: vi.fn(), hasPointerCapture: () => false });
  vi.spyOn(track, 'clientWidth', 'get').mockReturnValue(416);
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 416 } as DOMRect);
  fireEvent.pointerDown(track, { button: 0, pointerId: 1, clientX: 88 });
  fireEvent.pointerUp(track, { pointerId: 1, clientX: 88 });
  expect(container.querySelectorAll('[aria-pressed="true"]')).toHaveLength(0);
  fireEvent.click(screen.getByRole('button', { name: 'Target & playback' }));
  fireEvent.keyDown(window, { key: 'q' });
  expect(container.querySelector('[aria-keyshortcuts="q"]')).toHaveAttribute('aria-pressed', 'true');
});

it.each(['Normalize', 'Reset'])('%s cancels pending URL writes and omits defaults', (action) => {
  vi.useFakeTimers();
  window.history.replaceState({}, '', '/?stiffness=800&damping=80&mass=2&keep=yes#curve');
  render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Change stiffness' }));
  fireEvent.click(screen.getByRole('button', { name: 'Change again' }));
  fireEvent.click(screen.getByRole('button', { name: action }));
  const expected = action === 'Normalize' ? '?stiffness=600&keep=yes' : '?keep=yes';
  expect(window.location.search).toBe(expected);
  act(() => {
    vi.advanceTimersByTime(1000);
  });
  expect(window.location.search).toBe(expected);
  expect(window.location.hash).toBe('#curve');
});

it('puts status and diagnostics in a separate collapsed panel', () => {
  render(<SpringAnimationDemo />);
  const preview = screen.getByRole('region', { name: 'Live preview' });
  expect(preview).toHaveTextContent('Animated value');
  expect(preview).not.toHaveTextContent('Idle');
  expect(preview).not.toHaveTextContent('Initial velocity');
  const details = screen.getByRole('button', { name: 'Spring details' });
  expect(details).toHaveAttribute('aria-expanded', 'false');
  fireEvent.click(details);
  expect(details).toHaveAttribute('aria-expanded', 'true');
  expect(screen.getByText('Run / Generation')).toBeVisible();
  const detailsContent = document.getElementById(details.getAttribute('aria-controls') ?? '');
  if (!detailsContent) throw new Error('Missing spring details panel');
  expect(within(detailsContent).getByText('Initial velocity')).toBeVisible();
  expect(screen.getByText('Idle')).toBeVisible();
});

it('offers only Zero and normalized Toward target, updates the curve, and resets independently of Normalize', () => {
  render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  const modes = screen.getByRole('radiogroup', { name: 'Initial velocity mode' });
  expect(within(modes).getAllByRole('radio')).toHaveLength(2);
  expect(screen.queryByText('Direction')).not.toBeInTheDocument();
  expect(screen.queryByText('Speed units')).not.toBeInTheDocument();
  expect(screen.queryByRole('radio', { name: 'Fixed direction' })).not.toBeInTheDocument();
  expect(screen.queryByRole('radio', { name: 'Absolute' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Toward target' }));
  const input = screen.getByLabelText('Initial speed value');
  fireEvent.change(input, { target: { value: '2000' } });
  fireEvent.blur(input);
  expect(input).toHaveValue('2000');
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('2000');
  expect(screen.getByText(/Percent of the distance from the current animated value to the target/)).toBeVisible();
  fireEvent.click(screen.getByRole('button', { name: 'Normalize' }));
  expect(input).toHaveValue('2000');
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.queryByLabelText('Initial speed value')).not.toBeInTheDocument();
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('0');
  expect(screen.getByRole('radio', { name: 'Zero' })).toHaveAttribute('aria-checked', 'true');
});

it('uses a nonnegative speed slider, hides it in Zero, and retains its value when switching back', () => {
  render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Toward target' }));
  const slider = screen.getByRole('slider', { name: 'Initial speed' });
  expect(slider).toHaveAttribute('min', '0');
  expect(slider).toHaveAttribute('max', '10000');
  fireEvent.keyDown(slider, { key: 'End' });
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('10000');
  fireEvent.click(screen.getByRole('radio', { name: 'Zero' }));
  expect(screen.queryByRole('slider', { name: 'Initial speed' })).not.toBeInTheDocument();
  expect(screen.getByText('Initial velocity is 0 units/s.')).toBeVisible();
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('0');
  fireEvent.click(screen.getByRole('radio', { name: 'Toward target' }));
  expect(screen.getByLabelText('Initial speed value')).toHaveValue('10000');
});

it.each([true, false])('allows nonzero initial speed and ruler dragging with handoff %s', async (handoffEnabled) => {
  render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  const handoff = screen.getByRole('switch', { name: /Velocity handoff/ });
  if (!handoffEnabled) await userEvent.click(handoff);
  fireEvent.click(screen.getByRole('radio', { name: 'Toward target' }));
  const input = screen.getByLabelText('Initial speed value');
  fireEvent.change(input, { target: { value: '2000' } });
  fireEvent.blur(input);
  expect(handoff).not.toHaveAttribute('aria-disabled', 'true');
  if (handoffEnabled) expect(handoff).toBeChecked();
  else expect(handoff).not.toBeChecked();
  expect(playback.preserveVelocity).toBe(handoffEnabled);
  expect(screen.getByText('Click or drag to set a target')).toBeVisible();
  expect(screen.queryByText('Not supported with a non-zero initial velocity.')).not.toBeInTheDocument();
  const preview = screen.getByRole('region', { name: 'Live preview' });
  const track = preview.querySelector('.touch-none');
  if (!track) throw new Error('Missing ruler');
  Object.assign(track, { setPointerCapture: vi.fn(), hasPointerCapture: () => false });
  vi.spyOn(track, 'clientWidth', 'get').mockReturnValue(416);
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 416 } as DOMRect);
  vi.useFakeTimers();
  const pointer = { pointerId: 1, button: 0, buttons: 1, clientY: 0 };
  fireEvent.pointerDown(track, { ...pointer, clientX: 108 });
  expect(preview).toHaveTextContent('Target value25.00');
  fireEvent.pointerMove(track, { ...pointer, clientX: 308 });
  act(() => {
    vi.advanceTimersToNextFrame();
  });
  expect(preview).toHaveTextContent('Target value75.00');
  fireEvent.pointerUp(track, { ...pointer, buttons: 0, clientX: 308 });
  expect(preview).toHaveTextContent('Target value75.00');
  expect(playback.preserveVelocity).toBe(handoffEnabled);
  vi.useRealTimers();
  await userEvent.click(handoff);
  expect(playback.preserveVelocity).toBe(!handoffEnabled);
  fireEvent.click(screen.getByRole('radio', { name: 'Zero' }));
  expect(playback.preserveVelocity).toBe(!handoffEnabled);
});

it('defaults to Zero and clears initial velocity settings on a fresh mount', () => {
  const { unmount } = render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  expect(screen.getByRole('radio', { name: 'Zero' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.queryByRole('slider', { name: 'Initial speed' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Toward target' }));
  const input = screen.getByLabelText('Initial speed value');
  fireEvent.change(input, { target: { value: '2000' } });
  fireEvent.blur(input);
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('2000');
  unmount();
  render(<SpringAnimationDemo />);
  expect(screen.getByRole('radio', { name: 'Zero' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('0');
  expect(screen.getByRole('switch', { name: /Velocity handoff/ })).not.toHaveAttribute('aria-disabled', 'true');
  fireEvent.click(screen.getByRole('radio', { name: 'Toward target' }));
  expect(screen.getByLabelText('Initial speed value')).toHaveValue('0');
});

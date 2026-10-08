import { PANEL_STATE_KEY } from '#src/hooks/use-panel-state.js';
import { resolveInitialVelocity } from '#src/utils/initial-velocity.js';
import type { SpringResponseOptions } from '#src/utils/spring-response.js';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { afterEach, expect, it, vi } from 'vitest';
import { SpringAnimationDemo } from './index.js';

const playback = vi.hoisted(() => ({ value: 50, preserveVelocity: true }));
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
      {resolveInitialVelocity(
        options.initialVelocity ?? 0,
        options.initialVelocityMode ?? 'toward-target',
        0,
        100,
        options.initialVelocityUnit
      )}
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

it('allows signed initial velocity with handoff disabled, updates the curve, and resets independently of Normalize', () => {
  render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  fireEvent.click(screen.getByRole('switch', { name: /Velocity handoff/ }));
  fireEvent.click(screen.getByRole('radio', { name: 'Fixed direction' }));
  const input = screen.getByLabelText('Initial velocity value');
  expect(input).toBeEnabled();
  fireEvent.change(input, { target: { value: '-200' } });
  fireEvent.blur(input);
  expect(input).toHaveValue('-200');
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('-200');
  fireEvent.click(screen.getByRole('button', { name: 'Normalize' }));
  expect(input).toHaveValue('-200');
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(input).toHaveValue('0');
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('0');
  expect(screen.getByRole('radio', { name: 'Toward target' })).toHaveAttribute('aria-checked', 'true');
});

it('uses the requested slider ranges, hides it in zero mode, and retains the value when switching back', () => {
  render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  expect(screen.getByRole('radio', { name: 'Toward target' })).toHaveAttribute('aria-checked', 'true');
  let slider = screen.getByRole('slider', { name: 'Initial velocity' });
  expect(slider).toHaveAttribute('min', '0');
  expect(slider).toHaveAttribute('max', '10000');
  fireEvent.keyDown(slider, { key: 'End' });
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('10000');
  fireEvent.click(screen.getByRole('radio', { name: 'Fixed direction' }));
  slider = screen.getByRole('slider', { name: 'Initial velocity' });
  expect(slider).toHaveAttribute('min', '-10000');
  expect(slider).toHaveAttribute('max', '10000');
  fireEvent.keyDown(slider, { key: 'Home' });
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('-10000');
  fireEvent.click(screen.getByRole('radio', { name: 'Zero' }));
  expect(screen.queryByRole('slider', { name: 'Initial velocity' })).not.toBeInTheDocument();
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('0');
  fireEvent.click(screen.getByRole('radio', { name: 'Fixed direction' }));
  expect(screen.getByLabelText('Initial velocity value')).toHaveValue('-10000');
  fireEvent.click(screen.getByRole('radio', { name: 'Toward target' }));
  expect(screen.getByLabelText('Initial velocity value')).toHaveValue('10000');
});

it('switches units independently of direction and value, preserves on Normalize, and resets to Normalized', () => {
  render(<SpringAnimationDemo />);
  fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
  expect(screen.getByRole('radio', { name: 'Normalized' })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('radio', { name: 'Fixed direction' }));
  const input = screen.getByLabelText('Initial velocity value');
  fireEvent.change(input, { target: { value: '-2000' } });
  fireEvent.blur(input);
  fireEvent.click(screen.getByRole('radio', { name: 'Absolute' }));
  expect(screen.getByRole('radio', { name: 'Fixed direction' })).toHaveAttribute('aria-checked', 'true');
  expect(input).toHaveValue('-2000');
  expect(
    screen.getByText('Absolute speed in units per second. Positive moves right; negative moves left.')
  ).toBeVisible();
  expect(screen.getByLabelText('Curve initial velocity')).toHaveTextContent('-2000');
  fireEvent.click(screen.getByRole('button', { name: 'Normalize' }));
  expect(screen.getByRole('radio', { name: 'Absolute' })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('radio', { name: 'Zero' }));
  expect(screen.getByText('Initial velocity is 0 units/s.')).toBeVisible();
  expect(screen.queryByRole('slider', { name: 'Initial velocity' })).not.toBeInTheDocument();
  expect(screen.queryByRole('radiogroup', { name: 'Initial velocity units' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Fixed direction' }));
  expect(screen.getByRole('radio', { name: 'Absolute' })).toHaveAttribute('aria-checked', 'true');
  fireEvent.click(screen.getByRole('radio', { name: 'Normalized' }));
  fireEvent.click(screen.getByRole('radio', { name: 'Zero' }));
  expect(screen.getByText('Initial velocity is 0 units/s.')).toBeVisible();
  expect(screen.queryByRole('radiogroup', { name: 'Initial velocity units' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('radio', { name: 'Fixed direction' }));
  expect(screen.getByLabelText('Initial velocity value')).toHaveValue('-2000');
  fireEvent.click(screen.getByRole('radio', { name: 'Absolute' }));
  fireEvent.click(screen.getByRole('button', { name: 'Reset' }));
  expect(screen.getByRole('radio', { name: 'Normalized' })).toHaveAttribute('aria-checked', 'true');
  expect(screen.getByLabelText('Initial velocity value')).toHaveValue('0');
});

it.each(['Toward target', 'Fixed direction'])(
  'disables handoff and drag with nonzero %s speed and restores the previous handoff preference',
  async (direction) => {
    render(<SpringAnimationDemo />);
    fireEvent.click(screen.getByRole('button', { name: 'Advanced' }));
    const handoff = screen.getByRole('switch', { name: /Velocity handoff/ });
    expect(handoff).toBeChecked();
    expect(handoff).not.toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('radio', { name: direction }));
    const input = screen.getByLabelText('Initial velocity value');
    fireEvent.change(input, { target: { value: direction === 'Fixed direction' ? '-2000' : '2000' } });
    fireEvent.blur(input);
    expect(handoff).toHaveAttribute('aria-disabled', 'true');
    await userEvent.click(handoff);
    expect(handoff).not.toBeChecked();
    expect(playback.preserveVelocity).toBe(false);
    expect(screen.getByText('Not supported with a non-zero initial velocity.')).toBeVisible();
    expect(screen.getByText('Click to set a target')).toBeVisible();
    expect(screen.queryByText('Click or drag to set a target')).not.toBeInTheDocument();
    expect(screen.getByText('Turn off initial velocity (select Zero in Advanced) to enable dragging.')).toBeVisible();
    fireEvent.click(screen.getByRole('radio', { name: 'Absolute' }));
    expect(handoff).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(screen.getByRole('radio', { name: 'Zero' }));
    expect(handoff).not.toHaveAttribute('aria-disabled', 'true');
    expect(handoff).toBeChecked();
    expect(playback.preserveVelocity).toBe(true);
    expect(screen.getByText('Click or drag to set a target')).toBeVisible();
    await userEvent.click(handoff);
    fireEvent.click(screen.getByRole('radio', { name: direction }));
    expect(handoff).toHaveAttribute('aria-disabled', 'true');
    fireEvent.change(screen.getByLabelText('Initial velocity value'), { target: { value: '0' } });
    fireEvent.blur(screen.getByLabelText('Initial velocity value'));
    expect(handoff).not.toHaveAttribute('aria-disabled', 'true');
    expect(handoff).not.toBeChecked();
    expect(playback.preserveVelocity).toBe(false);
  }
);

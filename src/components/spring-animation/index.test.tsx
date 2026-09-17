import { PANEL_STATE_KEY } from '#src/hooks/use-panel-state.js';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { SpringAnimationDemo } from './index.js';

const playback = vi.hoisted(() => ({ value: 50 }));
vi.mock('#src/hooks/use-spring-animation.js', () => ({ useSpringAnimation: () => playback.value }));
vi.mock('./response-curve.js', () => ({ ResponseCurve: () => null }));
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
  const track = container.querySelector('.touch-none');
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

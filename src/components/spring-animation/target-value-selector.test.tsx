import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { TargetValueSelector } from './target-value-selector.js';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

it('maps the inset ruler and both gutters using the same scale after resize', () => {
  const onTrackClick = vi.fn();
  const { container, unmount } = render(<TargetValueSelector targetProgress={0.5} onTrackClick={onTrackClick} />);
  const track = container.querySelector('.cursor-pointer');
  if (!track) throw new Error('Missing target track');
  Object.assign(track, { setPointerCapture: vi.fn(), hasPointerCapture: () => false });
  const bounds = vi.spyOn(track, 'getBoundingClientRect');
  const clientWidth = vi.spyOn(track, 'clientWidth', 'get');
  vi.spyOn(track, 'clientLeft', 'get').mockReturnValue(1);
  for (const width of [400, 800]) {
    bounds.mockReturnValue({ left: 50, width: width + 2 } as DOMRect);
    clientWidth.mockReturnValue(width);
    for (const [position, expected] of [
      [0, -8 / (width - 16)],
      [8 / width, 0],
      [0.5, 0.5],
      [1 - 8 / width, 1],
      [1, 1 + 8 / (width - 16)],
    ] as const) {
      fireEvent.pointerDown(track, { pointerId: 1, button: 0, clientX: 51 + position * width });
      fireEvent.pointerUp(track, { pointerId: 1, clientX: 51 + position * width });
      expect(onTrackClick.mock.lastCall?.[0]).toBeCloseTo(expected);
    }
  }
  unmount();
  bounds.mockRestore();
});

it('coalesces targets per animation frame, flushes release and recovers a missing pointerup', () => {
  vi.useFakeTimers();
  const onTrackClick = vi.fn();
  const { container, unmount } = render(<TargetValueSelector targetProgress={0.5} onTrackClick={onTrackClick} />);
  const track = container.querySelector('.cursor-pointer');
  if (!track) throw new Error('Missing track');
  Object.assign(track, { setPointerCapture: vi.fn(), hasPointerCapture: () => false });
  vi.spyOn(track, 'getBoundingClientRect').mockReturnValue({ left: 0, width: 416 } as DOMRect);
  vi.spyOn(track, 'clientWidth', 'get').mockReturnValue(416);
  const pointer = { pointerId: 1, button: 0, buttons: 1, clientY: 0 };
  fireEvent.pointerDown(track, { ...pointer, clientX: 8 });
  fireEvent.pointerMove(track, { ...pointer, clientX: 11 });
  act(() => {
    vi.advanceTimersToNextFrame();
  });
  expect(onTrackClick).toHaveBeenCalledTimes(1);
  fireEvent.pointerMove(track, { ...pointer, clientX: 108 });
  expect(onTrackClick).toHaveBeenCalledTimes(1);
  fireEvent.pointerMove(track, { ...pointer, clientX: 208 });
  fireEvent.pointerMove(track, { ...pointer, clientX: 308 });
  expect(onTrackClick).toHaveBeenCalledTimes(1);
  act(() => {
    vi.advanceTimersToNextFrame();
  });
  expect(onTrackClick).toHaveBeenLastCalledWith(0.75);
  expect(onTrackClick).toHaveBeenCalledTimes(2);
  fireEvent.pointerUp(track, { ...pointer, buttons: 0, clientX: 408 });
  expect(onTrackClick).toHaveBeenLastCalledWith(1);
  fireEvent.pointerDown(track, { ...pointer, clientX: 8 });
  fireEvent.pointerMove(track, { ...pointer, clientX: 208 });
  fireEvent.pointerMove(track, { ...pointer, buttons: 0, clientX: 408 });
  expect(onTrackClick).toHaveBeenLastCalledWith(0.5);
  const count = onTrackClick.mock.calls.length;
  fireEvent.pointerMove(track, { ...pointer, clientX: 308 });
  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(onTrackClick).toHaveBeenCalledTimes(count);
  fireEvent.pointerDown(track, { ...pointer, clientX: 8 });
  fireEvent.pointerMove(track, { ...pointer, clientX: 308 });
  fireEvent.pointerCancel(track, { ...pointer, clientX: 308 });
  expect(onTrackClick).toHaveBeenLastCalledWith(0.5);
  const cancelledCount = onTrackClick.mock.calls.length;
  act(() => {
    vi.advanceTimersByTime(100);
  });
  expect(onTrackClick).toHaveBeenCalledTimes(cancelledCount);
  fireEvent.pointerDown(track, { ...pointer, clientX: 8 });
  fireEvent.pointerMove(track, { ...pointer, clientX: 308 });
  fireEvent.lostPointerCapture(track, { pointerId: 1 });
  expect(onTrackClick).toHaveBeenLastCalledWith(0.75);
  fireEvent.pointerDown(track, { ...pointer, clientX: 8 });
  fireEvent.pointerDown(track, { ...pointer, pointerId: 2, clientX: 408 });
  expect(onTrackClick).toHaveBeenLastCalledWith(0);
  fireEvent.pointerMove(track, { ...pointer, clientX: 308 });
  const unmountCount = onTrackClick.mock.calls.length;
  unmount();
  act(() => {
    vi.advanceTimersToNextFrame();
  });
  expect(onTrackClick).toHaveBeenCalledTimes(unmountCount);
});

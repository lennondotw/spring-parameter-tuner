import { fireEvent, renderHook } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { useTargetShortcuts } from './use-target-shortcuts.js';

it('handles all eleven targets without a panel and while an input consumes keyboard events', () => {
  const change = vi.fn();
  const { unmount } = renderHook(() => useTargetShortcuts(change));
  const input = document.createElement('input');
  document.body.append(input);
  input.focus();
  input.addEventListener('keydown', (event) => event.stopPropagation());
  for (const [index, key] of ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', '['].entries()) {
    expect(fireEvent.keyDown(input, { key })).toBe(false);
    expect(change).toHaveBeenLastCalledWith(index * 10);
  }
  fireEvent.keyDown(input, { key: 'Q', shiftKey: true });
  expect(change).toHaveBeenLastCalledWith(0);
  expect(change).toHaveBeenCalledTimes(12);
  unmount();
  fireEvent.keyDown(input, { key: 'p' });
  expect(change).toHaveBeenCalledTimes(12);
  input.remove();
});

it('preserves system shortcuts, composition, and unrelated keys', () => {
  const change = vi.fn();
  const { unmount } = renderHook(() => useTargetShortcuts(change));
  for (const modifier of ['metaKey', 'ctrlKey', 'altKey', 'isComposing']) {
    expect(fireEvent.keyDown(window, { key: 'r', [modifier]: true })).toBe(true);
  }
  fireEvent.keyDown(window, { key: '1' });
  fireEvent.keyDown(window, { key: 'ArrowUp' });
  expect(change).not.toHaveBeenCalled();
  unmount();
});

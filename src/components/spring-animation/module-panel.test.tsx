import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { ModulePanel } from './module-panel.js';

vi.mock('framer-motion', async (importOriginal) => {
  const actual = await importOriginal<typeof import('framer-motion')>();
  return { ...actual, useReducedMotion: () => true };
});

it('keeps child state mounted while collapsed and restores overflow with reduced motion', () => {
  render(
    <ModulePanel title="Playback" allowOverflow>
      <input aria-label="Retained value" defaultValue="initial" />
    </ModulePanel>
  );
  const toggle = screen.getByRole('button', { name: 'Playback' });
  const input = screen.getByRole('textbox', { name: 'Retained value' });
  const content = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
  expect(content).toHaveClass('overflow-visible');
  fireEvent.change(input, { target: { value: 'edited' } });
  fireEvent.click(toggle);
  expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(content).toHaveAttribute('inert');
  expect(content).toHaveClass('overflow-hidden');
  expect(input).toBeInTheDocument();
  fireEvent.click(toggle);
  expect(content).not.toHaveAttribute('inert');
  expect(content).toHaveClass('overflow-visible');
  expect(input).toHaveValue('edited');
});

it('keeps ordinary panels clipped even when expanded', () => {
  render(<ModulePanel title="Parameters">Content</ModulePanel>);
  const toggle = screen.getByRole('button', { name: 'Parameters' });
  const content = document.getElementById(toggle.getAttribute('aria-controls') ?? '');
  expect(content).toHaveClass('overflow-hidden');
});

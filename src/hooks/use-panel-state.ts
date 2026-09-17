import { useState } from 'react';

export const PANEL_STATE_KEY = 'spring-tuner.panels';

function readPanelState(): Record<string, boolean> {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(PANEL_STATE_KEY) ?? '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return Object.fromEntries(Object.entries(value).filter(([, open]) => typeof open === 'boolean'));
  } catch {
    return {};
  }
}

export function usePanelState(id: string | undefined, defaultOpen: boolean) {
  const [open, setOpen] = useState(() => (id ? (readPanelState()[id] ?? defaultOpen) : defaultOpen));
  const update = (next: boolean) => {
    setOpen(next);
    if (!id) return;
    try {
      localStorage.setItem(PANEL_STATE_KEY, JSON.stringify({ ...readPanelState(), [id]: next }));
    } catch {
      // Storage may be disabled or full; the panel still works for this session.
    }
  };
  return [open, update] as const;
}

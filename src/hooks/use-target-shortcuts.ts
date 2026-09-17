import { PRESET_SHORTCUTS, PRESET_VALUES } from '#src/constants/marks.js';
import { useEffect } from 'react';

export function useTargetShortcuts(onTargetChange: (value: number) => void) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.isComposing) return;
      const index = PRESET_SHORTCUTS.indexOf(event.key.toLowerCase());
      const value = PRESET_VALUES[index];
      if (value === undefined) return;
      event.preventDefault();
      onTargetChange(value);
    };

    // Capture before focused controls can stop propagation. Owned by the page,
    // so panel visibility does not affect the shortcuts.
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onTargetChange]);
}

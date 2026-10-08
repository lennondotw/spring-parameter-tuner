import { SpringHoverButton } from '#src/components/spring-hover-button.js';
import { PRESET_SHORTCUTS, PRESET_VALUES } from '#src/constants/marks.js';
import { cn } from '#src/utils/cn.js';
import type { FC } from 'react';

/**
 * Props for PresetValues component
 */
export interface PresetValuesProps {
  activePreset: number | null;
  className?: string;
  onPresetClick: (value: number) => void;
}

/**
 * Component for displaying preset value buttons
 */
export const PresetValues: FC<PresetValuesProps> = ({ activePreset, onPresetClick, className }) => {
  return (
    <div className={cn('@container/presets flex w-full flex-col gap-2', className)}>
      <div className="text-xs font-medium text-neutral-600 dark:text-neutral-400">Target value triggers</div>
      <div className="grid grid-cols-6 gap-(--preset-gap) [--preset-gap:--spacing(1)] @min-[28rem]/presets:grid-cols-11">
        {PRESET_VALUES.map((value, index) => {
          // Calculate corresponding keyboard key
          const keyText = PRESET_SHORTCUTS[index] ?? '?';

          return (
            <SpringHoverButton
              key={value}
              aria-keyshortcuts={keyText}
              aria-pressed={activePreset === value}
              selected={activePreset === value}
              onClick={() => onPresetClick(value)}
              className={cn(
                `
                  relative min-w-0 cursor-pointer flex-col items-center gap-1 rounded-md border border-neutral-200 py-2 text-xs font-medium
                  text-nowrap outline-none dark:border-neutral-800
                `,
                index % 2 === 0 ? 'flex' : 'hidden @min-[28rem]/presets:flex'
              )}
            >
              {/* Absolute insets start inside the 1px border; compensate to expand only horizontally by gap / 2. */}
              <span aria-hidden="true" className="absolute -inset-x-[calc(var(--preset-gap)/2+1px)] -inset-y-px" />
              <span>{value}</span>
              <KeyboardKey keyText={keyText} className="text-muted-foreground" />
            </SpringHoverButton>
          );
        })}
      </div>
    </div>
  );
};

const KeyboardKey: FC<{ keyText: string; className?: string }> = ({ keyText, className }) => {
  return <kbd className={cn('font-mono text-[9px]', className)}>{keyText}</kbd>;
};

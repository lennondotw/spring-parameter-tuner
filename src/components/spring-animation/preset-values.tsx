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
      <div className="grid grid-cols-6 gap-1 @min-[28rem]/presets:grid-cols-11">
        {PRESET_VALUES.map((value, index) => {
          // Calculate corresponding keyboard key
          const keyText = PRESET_SHORTCUTS[index] ?? '?';

          return (
            <button
              key={value}
              aria-keyshortcuts={keyText}
              aria-pressed={activePreset === value}
              onClick={() => onPresetClick(value)}
              className={`
                relative min-w-0 cursor-pointer flex-col items-center gap-1 rounded-md border border-neutral-200 py-2 text-xs font-medium
                text-nowrap transition-colors outline-none dark:border-neutral-800
                ${index % 2 === 0 ? 'flex' : 'hidden @min-[28rem]/presets:flex'}
                ${
                  activePreset === value
                    ? 'bg-neutral-800 text-white dark:bg-neutral-200 dark:text-black'
                    : `
                      bg-neutral-50 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-950
                      dark:text-neutral-400 dark:hover:bg-neutral-800
                    `
                }
              `}
            >
              <span>{value}</span>
              <KeyboardKey keyText={keyText} className="text-neutral-500" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const KeyboardKey: FC<{ keyText: string; className?: string }> = ({ keyText, className }) => {
  return <kbd className={cn('font-mono text-[9px]', className)}>{keyText}</kbd>;
};

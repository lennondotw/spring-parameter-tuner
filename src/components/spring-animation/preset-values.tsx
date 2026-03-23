import { MAX_MARK, MIN_MARK } from '@/constants/marks.ts';
import { cn } from '@/utils/cn';
import { FC, useEffect } from 'react';

/**
 * Props for PresetValues component
 */
export interface PresetValuesProps {
  presetValues: number[];
  presetShortcuts: string[];
  targetValue: number;
  className?: string;
  onPresetClick: (value: number) => void;
}

const getPercentage = (value: number) => {
  return (value - MIN_MARK) / (MAX_MARK - MIN_MARK);
};

/**
 * Component for displaying preset value buttons
 */
export const PresetValues: FC<PresetValuesProps> = ({
  presetValues,
  presetShortcuts,
  targetValue,
  onPresetClick,
  className,
}) => {
  // Add keyboard event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: globalThis.KeyboardEvent) => {
      const key = e.key;

      if (presetShortcuts.includes(key)) {
        const index = presetShortcuts.indexOf(key);
        if (index === -1) return;
        const value = presetValues[index];
        if (value === undefined) return;
        onPresetClick(value);
      }
    };

    // Add global keyboard event listener
    window.addEventListener('keydown', handleGlobalKeyDown);

    // Clean up when component unmounts
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [presetValues, presetShortcuts, onPresetClick]);

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div className="text-sm font-medium">Preset values (click or use keyboard shortcuts)</div>
      <div className="flex gap-2">
        {presetValues.map((value, index) => {
          // Calculate corresponding keyboard key
          const keyText = presetShortcuts[index] ?? '?';

          return (
            <button
              key={value}
              onClick={() => onPresetClick(value)}
              className={`
                relative min-w-0 shrink grow basis-1 cursor-pointer rounded-sm py-1 text-sm
                font-medium text-nowrap transition-colors outline-none
                ${
                  Math.abs(getPercentage(targetValue) * 100 - getPercentage(value) * 100) < 0.5
                    ? 'bg-blue-500 text-white'
                    : `
                      bg-gray-700 text-gray-300
                      hover:bg-gray-600
                    `
                }
              `}
            >
              <span>{value}</span>
              <KeyboardKey keyText={keyText} className="absolute -top-2 -right-1" />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const KeyboardKey: FC<{ keyText: string; className?: string }> = ({ keyText, className }) => {
  return (
    <div className={cn('relative size-4', className)}>
      {/* Outer rounded rectangle - slightly visible at the bottom */}
      <div className="absolute inset-0 translate-y-[2px] rounded-sm bg-gray-800"></div>
      {/* Inner small rounded rectangle - main body */}
      <div
        className="
          absolute inset-0 flex items-center justify-center rounded-sm bg-gray-700 text-[9px]
          font-medium text-white
        "
      >
        {keyText}
      </div>
    </div>
  );
};

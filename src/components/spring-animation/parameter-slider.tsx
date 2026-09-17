import { cn } from '#src/utils/cn.js';
import { NumberField } from '@base-ui/react/number-field';
import { Slider } from '@base-ui/react/slider';
import type { FC } from 'react';

export interface ParameterSliderProps {
  ariaLabel: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  decimals: number;
  description: string;
  accent: 'blue' | 'purple';
  unit?: string;
  onValueChange: (value: number) => void;
}

const ACCENT_CLASSES = {
  blue: {
    indicator: 'bg-blue-500',
    thumb: 'border-blue-500 has-focus-visible:ring-blue-300',
  },
  purple: {
    indicator: 'bg-purple-500',
    thumb: 'border-purple-500 has-focus-visible:ring-purple-300',
  },
} as const;

export const ParameterSlider: FC<ParameterSliderProps> = ({
  ariaLabel,
  label,
  value,
  min,
  max,
  step,
  decimals,
  description,
  accent,
  unit,
  onValueChange,
}) => {
  const largeStep = step * 10;
  const accentClasses = ACCENT_CLASSES[accent];

  const handleNumberChange = (nextValue: number | null) => {
    if (nextValue !== null) {
      onValueChange(nextValue);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex justify-between text-sm font-medium">
        <div className="flex items-baseline">
          <span>{label}:&nbsp;</span>
          <NumberField.Root
            value={value}
            onValueChange={handleNumberChange}
            min={min}
            max={max}
            step={step}
            largeStep={largeStep}
            format={{
              minimumFractionDigits: decimals,
              maximumFractionDigits: decimals,
              useGrouping: false,
            }}
            className="inline-flex"
          >
            <NumberField.Input
              aria-label={`${ariaLabel} value`}
              inputMode="decimal"
              className="
                w-[8ch] rounded-xs bg-transparent px-0.5 font-mono text-gray-50 outline-none
                hover:bg-gray-700/50
                focus-visible:ring-2 focus-visible:ring-gray-400
              "
            />
          </NumberField.Root>
          {unit && <span>&nbsp;{unit}</span>}
        </div>
        <span className="text-xs text-gray-500">{description}</span>
      </div>

      <Slider.Root value={value} onValueChange={onValueChange} min={min} max={max} step={step} largeStep={largeStep}>
        <Slider.Control className="relative flex h-5 w-full touch-none items-center select-none">
          <Slider.Track className="h-1 w-full rounded-full bg-gray-700">
            <Slider.Indicator className={cn('rounded-full', accentClasses.indicator)} />
            <Slider.Thumb
              className={cn(
                `
                  size-4 rounded-full border bg-gray-800 shadow-sm outline-none
                  has-focus-visible:ring-2
                `,
                accentClasses.thumb
              )}
              aria-label={ariaLabel}
            />
          </Slider.Track>
        </Slider.Control>
      </Slider.Root>
    </div>
  );
};

import { QuantizedSlider } from '#src/components/quantized-slider.js';
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
  unit?: string;
  onValueChange: (value: number) => void;
}

export const ParameterSlider: FC<ParameterSliderProps> = ({
  ariaLabel,
  label,
  value,
  min,
  max,
  step,
  decimals,
  description,
  unit,
  onValueChange,
}) => {
  const largeStep = step * 10;

  const handleNumberChange = (nextValue: number | null) => {
    if (nextValue !== null) {
      onValueChange(nextValue);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-neutral-700 dark:text-neutral-300">{label}</span>
        <div className="flex items-center gap-2">
          {unit && <span className="text-xs text-neutral-500">{unit}</span>}
          <NumberField.Root
            value={value}
            onValueChange={handleNumberChange}
            min={min}
            max={max}
            step={step}
            largeStep={largeStep}
            format={{ minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: false }}
          >
            <NumberField.Input
              aria-label={`${ariaLabel} value`}
              inputMode="decimal"
              className="h-8 w-[9ch] rounded-md border border-neutral-200 bg-transparent px-2 text-right font-mono text-sm tabular-nums outline-none hover:border-neutral-400 focus-visible:border-neutral-600 focus-visible:ring-1 focus-visible:ring-neutral-600 dark:border-neutral-800 dark:hover:border-neutral-600 dark:focus-visible:border-neutral-400 dark:focus-visible:ring-neutral-400"
            />
          </NumberField.Root>
        </div>
      </div>
      <QuantizedSlider
        value={value}
        onValueChange={onValueChange}
        min={min}
        max={max}
        step={step}
        decimals={decimals}
        largeStep={largeStep}
      >
        <Slider.Control className="relative flex h-6 w-full touch-none items-center select-none">
          <Slider.Track className="h-1 w-full rounded-full bg-neutral-200 dark:bg-neutral-800">
            <Slider.Indicator className="rounded-full bg-neutral-500" />
            <Slider.Thumb
              className="h-4 w-2 rounded-sm bg-neutral-900 outline-none has-focus-visible:ring-2 has-focus-visible:ring-neutral-600 has-focus-visible:ring-offset-4 has-focus-visible:ring-offset-white dark:bg-neutral-100 dark:has-focus-visible:ring-neutral-400 dark:has-focus-visible:ring-offset-black"
              aria-label={ariaLabel}
            />
          </Slider.Track>
        </Slider.Control>
      </QuantizedSlider>
      <p className="text-xs/4 text-neutral-500">{description}</p>
    </div>
  );
};

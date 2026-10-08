import { Divider } from '#src/components/divider.js';
import { SpringHoverButton } from '#src/components/spring-hover-button.js';
import type { InitialVelocityMode, InitialVelocityUnit } from '#src/utils/initial-velocity.js';
import { NumberField } from '@base-ui/react/number-field';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import type { FC } from 'react';
import { ParameterSlider } from './parameter-slider.js';

const velocityModes = [
  { value: 'zero', label: 'Zero' },
  { value: 'toward-target', label: 'Toward target' },
  { value: 'fixed', label: 'Fixed direction' },
] as const;
const velocityUnits = [
  { value: 'normalized', label: 'Normalized' },
  { value: 'absolute', label: 'Absolute' },
] as const;

export const AdvancedSettings: FC<{
  initialVelocity: number;
  initialVelocityMode: InitialVelocityMode;
  initialVelocityUnit: InitialVelocityUnit;
  restDelta: number;
  restSpeed: number;
  onInitialVelocityChange: (value: number) => void;
  onInitialVelocityModeChange: (mode: InitialVelocityMode) => void;
  onInitialVelocityUnitChange: (unit: InitialVelocityUnit) => void;
  onRestDeltaChange: (value: number) => void;
  onRestSpeedChange: (value: number) => void;
}> = ({
  initialVelocity,
  initialVelocityMode,
  initialVelocityUnit,
  restDelta,
  restSpeed,
  onInitialVelocityChange,
  onInitialVelocityModeChange,
  onInitialVelocityUnitChange,
  onRestDeltaChange,
  onRestSpeedChange,
}) => {
  const unit = initialVelocityUnit === 'normalized' ? '%/s' : 'units/s';
  const speedDescription =
    initialVelocityUnit === 'normalized'
      ? 'Percent of travel distance per second.'
      : 'Absolute speed in units per second.';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Initial conditions</h3>
        <div className="flex flex-col gap-2">
          <span className="text-xs text-muted-foreground">Direction</span>
          <RadioGroup<InitialVelocityMode>
            aria-label="Initial velocity mode"
            value={initialVelocityMode}
            onValueChange={onInitialVelocityModeChange}
            className="flex flex-wrap gap-1"
          >
            {velocityModes.map(({ value, label }) => (
              <Radio.Root
                key={value}
                value={value}
                nativeButton
                render={<SpringHoverButton selected={initialVelocityMode === value} />}
                className="cursor-pointer rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium dark:border-neutral-800"
              >
                {label}
              </Radio.Root>
            ))}
          </RadioGroup>
        </div>
        {initialVelocityMode !== 'zero' && (
          <div className="flex flex-col gap-2">
            <span className="text-xs text-muted-foreground">Speed units</span>
            <RadioGroup<InitialVelocityUnit>
              aria-label="Initial velocity units"
              value={initialVelocityUnit}
              onValueChange={onInitialVelocityUnitChange}
              className="flex flex-wrap gap-1"
            >
              {velocityUnits.map(({ value, label }) => (
                <Radio.Root
                  key={value}
                  value={value}
                  nativeButton
                  render={<SpringHoverButton selected={initialVelocityUnit === value} />}
                  className="cursor-pointer rounded-md border border-neutral-200 px-2.5 py-1 text-xs font-medium dark:border-neutral-800"
                >
                  {label}
                </Radio.Root>
              ))}
            </RadioGroup>
          </div>
        )}
        {initialVelocityMode === 'zero' ? (
          <p className="text-xs text-muted-foreground">Initial velocity is 0 units/s.</p>
        ) : (
          <ParameterSlider
            ariaLabel="Initial velocity"
            label="Initial velocity"
            unit={unit}
            value={initialVelocityMode === 'toward-target' ? Math.abs(initialVelocity) : initialVelocity}
            min={initialVelocityMode === 'toward-target' ? 0 : -10000}
            max={10000}
            step={1}
            decimals={0}
            onValueChange={onInitialVelocityChange}
            description={
              initialVelocityMode === 'toward-target'
                ? `${speedDescription} Direction follows the target.`
                : `${speedDescription} Positive moves right; negative moves left.`
            }
          />
        )}
        <p className="text-xs text-muted-foreground">
          Used by the response curve and new springs when velocity is not inherited. Playback changes apply to the next
          spring.
        </p>
      </div>
      <Divider />
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-medium tracking-wide text-muted-foreground">Settling thresholds</h3>
        <NumericSetting
          label="Rest distance"
          description="Maximum remaining distance · units"
          value={restDelta}
          onChange={onRestDeltaChange}
          min={0.0001}
          max={100}
          step={0.001}
          largeStep={0.01}
        />
        <NumericSetting
          label="Rest speed"
          description="Maximum remaining speed · units / second"
          value={restSpeed}
          onChange={onRestSpeedChange}
          min={0.0001}
          max={100}
          step={0.001}
          largeStep={0.01}
        />
        <p className="text-xs text-muted-foreground">
          The spring stops when both thresholds are met. Smaller values take longer to settle.
        </p>
      </div>
    </div>
  );
};

const NumericSetting: FC<{
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  largeStep?: number;
}> = ({ label, description, value, onChange, min, max, step = 1, largeStep = 10 }) => {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-neutral-700 dark:text-neutral-300">{label}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <NumberField.Root
        value={value}
        min={min}
        max={max}
        step={step}
        largeStep={largeStep}
        onValueChange={(next) => {
          if (next !== null && Number.isFinite(next)) onChange(next);
        }}
        format={{ maximumFractionDigits: 4, useGrouping: false }}
      >
        <NumberField.Input
          aria-label={label}
          className="h-8 w-24 rounded-md border border-neutral-200 bg-transparent px-2 text-right font-mono text-sm outline-none focus-visible:ring-1 focus-visible:ring-neutral-600 dark:border-neutral-800 dark:focus-visible:ring-neutral-400"
        />
      </NumberField.Root>
    </div>
  );
};

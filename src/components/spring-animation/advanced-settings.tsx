import { NumberField } from '@base-ui/react/number-field';

export function AdvancedSettings({
  restDelta,
  restSpeed,
  onRestDeltaChange,
  onRestSpeedChange,
}: {
  restDelta: number;
  restSpeed: number;
  onRestDeltaChange: (value: number) => void;
  onRestSpeedChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-3">
      <Threshold
        label="Rest distance"
        description="Maximum remaining distance · units"
        value={restDelta}
        onChange={onRestDeltaChange}
      />
      <Threshold
        label="Rest speed"
        description="Maximum remaining speed · units / second"
        value={restSpeed}
        onChange={onRestSpeedChange}
      />
      <p className="text-xs text-neutral-500">
        The spring stops when both thresholds are met. Smaller values take longer to settle.
      </p>
    </div>
  );
}

function Threshold({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div>
        <div className="text-sm text-neutral-700 dark:text-neutral-300">{label}</div>
        <p className="text-xs text-neutral-500">{description}</p>
      </div>
      <NumberField.Root
        value={value}
        min={0.0001}
        max={100}
        step={0.001}
        largeStep={0.01}
        onValueChange={(next) => {
          if (next !== null) onChange(next);
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
}

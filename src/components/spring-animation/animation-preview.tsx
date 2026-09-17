import { Divider } from '#src/components/divider.js';
import { Switch } from '#src/components/switch.js';
import { AnimationVisualization } from './animation-visualization.js';
import { PresetValues, type PresetValuesProps } from './preset-values.js';
import { TargetValueSelector } from './target-value-selector.js';

interface AnimationPreviewProps extends Omit<PresetValuesProps, 'className'> {
  targetValue: number;
  currentValue: number;
  onTrackClick: (percentage: number) => void;
  preserveVelocity: boolean;
  onPreserveVelocityChange: (value: boolean) => void;
}

export function AnimationPreview({
  currentValue,
  targetValue,
  activePreset,
  onPresetClick,
  onTrackClick,
  preserveVelocity,
  onPreserveVelocityChange,
}: AnimationPreviewProps) {
  return (
    <section className="flex flex-col gap-5" aria-label="Live preview">
      <h2 className="flex h-7 items-center text-xs font-medium tracking-wide text-neutral-500">Live preview</h2>
      <div className="flex flex-col gap-6">
        <PreviewTrack label="Target value" value={targetValue} />
        <PreviewTrack label="Animated value" value={currentValue} />
      </div>
      <PresetValues activePreset={activePreset} onPresetClick={onPresetClick} />
      <TargetValueSelector targetProgress={targetValue / 100} onTrackClick={onTrackClick} />
      <Divider />
      <Switch
        checked={preserveVelocity}
        onCheckedChange={onPreserveVelocityChange}
        label="Preserve velocity"
        description="Keep momentum when the target changes"
      />
    </section>
  );
}

function PreviewTrack({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-neutral-600 dark:text-neutral-400">
        <span>{label}</span>
        <span className="font-mono text-neutral-800 tabular-nums dark:text-neutral-200">{value.toFixed(2)}</span>
      </div>
      <AnimationVisualization value={value} />
    </div>
  );
}

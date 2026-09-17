import { Divider } from '#src/components/divider.js';
import { Switch } from '#src/components/switch.js';
import { defaultSpringParams } from '#src/config/spring-schema.js';
import { resetUrlParams } from '#src/config/spring-url-params.js';
import {
  DEFAULT_TARGET_VALUE,
  MAX_MARK,
  MIN_MARK,
  PRESET_SHORTCUTS,
  PRESET_VALUES,
  SMALL_SCREEN_PRESET_SHORTCUTS,
  SMALL_SCREEN_PRESET_VALUES,
} from '#src/constants/marks.js';
import { useMediaQuery } from '#src/hooks/use-media-query.js';
import { useSpringAnimation } from '#src/hooks/use-spring-animation.js';
import { useSpringConfig } from '#src/hooks/use-spring-config.js';
import { useThrottledUrlUpdates } from '#src/hooks/use-throttled-url-updates.js';
import { perceptualToPhysical } from '#src/utils/spring-physics.js';
import type { FC } from 'react';
import { useState } from 'react';
import { AnimationVisualization } from './animation-visualization.js';
import { HelpText } from './help-text.js';
import { PresetValues } from './preset-values.js';
import { SpringParameterControl } from './spring-parameter-control.js';
import { TargetValueSelector } from './target-value-selector.js';

/**
 * Main component for Spring Animation Demo
 * Showcases physical spring animations with adjustable parameters
 */
export const SpringAnimationDemo: FC = () => {
  const { stiffness, damping, mass, setStiffness, setDamping, setMass } = useSpringConfig();
  const { throttledUpdateStiffness, throttledUpdateDamping, throttledUpdateMass } = useThrottledUrlUpdates();

  // Animation state
  const [targetValue, setTargetValue] = useState(DEFAULT_TARGET_VALUE);
  const [preserveVelocity, setPreserveVelocity] = useState(true);

  // Spring animation
  const currentValue = useSpringAnimation({
    targetValue,
    stiffness,
    damping,
    mass,
    preserveVelocity,
    initialValue: DEFAULT_TARGET_VALUE,
  });

  // Responsive preset values
  const isMdOrLarger = useMediaQuery('(width >= 48rem)');
  const presetValues = isMdOrLarger ? PRESET_VALUES : SMALL_SCREEN_PRESET_VALUES;
  const presetShortcuts = isMdOrLarger ? PRESET_SHORTCUTS : SMALL_SCREEN_PRESET_SHORTCUTS;

  const handleTrackClick = (percentage: number) => {
    setTargetValue(percentage * (MAX_MARK - MIN_MARK) + MIN_MARK);
  };

  const handlePresetClick = (value: number) => {
    setTargetValue(value);
  };

  const handleReset = () => {
    resetUrlParams();
    setStiffness(defaultSpringParams.stiffness);
    setDamping(defaultSpringParams.damping);
    setMass(defaultSpringParams.mass);
  };

  // Handle slider value change
  const handleStiffnessChange = (value: number) => {
    setStiffness(value);
    throttledUpdateStiffness(value);
  };

  const handleDampingChange = (value: number) => {
    setDamping(value);
    throttledUpdateDamping(value);
  };

  const handleMassChange = (value: number) => {
    setMass(value);
    throttledUpdateMass(value);
  };

  // Handle perceptual parameter changes (ω and ζ)
  // When ω changes, keep ζ constant and update stiffness/damping
  const handleOmegaChange = (newOmega: number) => {
    // Calculate current ζ from current values
    const currentOmega = Math.sqrt(stiffness / mass);
    const currentZeta = damping / (2 * currentOmega * mass);

    // Calculate new physical values with new ω but same ζ
    const { stiffness: newStiffness, damping: newDamping } = perceptualToPhysical(newOmega, currentZeta, mass);

    setStiffness(newStiffness);
    setDamping(newDamping);
    throttledUpdateStiffness(newStiffness);
    throttledUpdateDamping(newDamping);
  };

  // When ζ changes, keep ω constant and update damping only
  const handleZetaChange = (newZeta: number) => {
    // Calculate current ω
    const currentOmega = Math.sqrt(stiffness / mass);

    // Only damping needs to change (stiffness determines ω)
    const newDamping = newZeta * 2 * currentOmega * mass;

    setDamping(newDamping);
    throttledUpdateDamping(newDamping);
  };

  // Render component
  return (
    <div
      className="
        flex w-full max-w-2xl flex-col items-center justify-center
        md:rounded-lg md:bg-gray-800 md:p-6
      "
    >
      <h2 className="text-2xl font-bold">Spring Parameter Tuner</h2>

      <div className="flex w-full flex-col gap-6 pt-6">
        {/* Spring parameter sliders */}
        <SpringParameterControl
          stiffness={stiffness}
          damping={damping}
          mass={mass}
          onStiffnessChange={handleStiffnessChange}
          onDampingChange={handleDampingChange}
          onMassChange={handleMassChange}
          onOmegaChange={handleOmegaChange}
          onZetaChange={handleZetaChange}
          onReset={handleReset}
        />

        <Divider />

        {/* Axis and ball visualization */}
        <div className="flex w-full flex-col">
          <div className="mb-1 flex flex-row justify-between">
            <span className="text-sm font-medium">Target value</span>
            <span className="text-sm font-medium">{targetValue.toFixed(2)}</span>
          </div>
          <AnimationVisualization value={targetValue} />

          <div className="h-6" />

          <div className="mb-1 flex flex-row justify-between">
            <span className="text-sm font-medium">Animated value</span>
            <span className="text-sm font-medium">{currentValue.toFixed(2)}</span>
          </div>
          <AnimationVisualization value={currentValue} />
        </div>

        {/* Preset target values */}
        <PresetValues
          presetValues={presetValues}
          presetShortcuts={presetShortcuts}
          targetValue={targetValue}
          onPresetClick={handlePresetClick}
        />

        {/* Real-time data input area */}
        <TargetValueSelector onTrackClick={handleTrackClick} />

        <Divider />

        {/* Velocity preservation toggle */}
        <Switch
          checked={preserveVelocity}
          onCheckedChange={setPreserveVelocity}
          label="Preserve velocity"
          description="Keep current velocity when switching to a new target"
        />

        <HelpText />
      </div>
    </div>
  );
};

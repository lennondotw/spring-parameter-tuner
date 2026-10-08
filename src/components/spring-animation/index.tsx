import { Divider } from '#src/components/divider.js';
import { defaultSpringParams } from '#src/config/spring-schema.js';
import { resetUrlParams, updateUrlParams } from '#src/config/spring-url-params.js';
import { DEFAULT_TARGET_VALUE, MAX_MARK, MIN_MARK } from '#src/constants/marks.js';
import { useSpringAnimation } from '#src/hooks/use-spring-animation.js';
import { useSpringConfig } from '#src/hooks/use-spring-config.js';
import { useTargetShortcuts } from '#src/hooks/use-target-shortcuts.js';
import { useThrottledUrlUpdates } from '#src/hooks/use-throttled-url-updates.js';
import type { InitialVelocityMode, InitialVelocityUnit } from '#src/utils/initial-velocity.js';
import { normalizeSpring, perceptualToPhysical } from '#src/utils/spring-physics.js';
import type { FC } from 'react';
import { useCallback, useMemo, useState } from 'react';
import { AdvancedSettings } from './advanced-settings.js';
import { AnimationPreview } from './animation-preview.js';
import { HelpText } from './help-text.js';
import { ModulePanel } from './module-panel.js';
import { ResponseCurve } from './response-curve.js';
import { SpringParameterControl } from './spring-parameter-control.js';
import { SpringRunDetails } from './spring-run-details.js';

/**
 * Main component for Spring Animation Demo
 * Showcases physical spring animations with adjustable parameters
 */
export const SpringAnimationDemo: FC = () => {
  const { stiffness, damping, mass, setStiffness, setDamping, setMass } = useSpringConfig();
  const { throttledUpdateStiffness, throttledUpdateDamping, throttledUpdateMass } = useThrottledUrlUpdates();

  // Animation state
  const [targetValue, setTargetValue] = useState(DEFAULT_TARGET_VALUE);
  const [activePreset, setActivePreset] = useState<number | null>(DEFAULT_TARGET_VALUE);
  const [preserveVelocity, setPreserveVelocity] = useState(true);

  const [restDelta, setRestDelta] = useState(0.001);
  const [restSpeed, setRestSpeed] = useState(0.001);
  const [initialVelocity, setInitialVelocity] = useState(0);
  const [initialVelocityMode, setInitialVelocityMode] = useState<InitialVelocityMode>('zero');
  const [initialVelocityUnit, setInitialVelocityUnit] = useState<InitialVelocityUnit>('normalized');
  const hasInitialVelocity = initialVelocityMode !== 'zero' && initialVelocity !== 0;
  const effectivePreserveVelocity = preserveVelocity && !hasInitialVelocity;
  const responseOptions = useMemo(
    () => ({
      stiffness,
      damping,
      mass,
      restDelta,
      restSpeed,
      initialVelocity,
      initialVelocityMode,
      initialVelocityUnit,
    }),
    [stiffness, damping, mass, restDelta, restSpeed, initialVelocity, initialVelocityMode, initialVelocityUnit]
  );

  // Spring animation
  const spring = useSpringAnimation({
    targetValue,
    stiffness,
    damping,
    mass,
    preserveVelocity: effectivePreserveVelocity,
    initialValue: DEFAULT_TARGET_VALUE,
    initialVelocity,
    initialVelocityMode,
    initialVelocityUnit,
    restDelta,
    restSpeed,
  });

  const handleTrackClick = (percentage: number) => {
    setActivePreset(null);
    setTargetValue(percentage * (MAX_MARK - MIN_MARK) + MIN_MARK);
  };

  const handlePresetClick = useCallback((value: number) => {
    setActivePreset(value);
    setTargetValue(value);
  }, []);

  useTargetShortcuts(handlePresetClick);

  const handleReset = () => {
    throttledUpdateStiffness.cancel();
    throttledUpdateDamping.cancel();
    throttledUpdateMass.cancel();
    resetUrlParams();
    setStiffness(defaultSpringParams.stiffness);
    setDamping(defaultSpringParams.damping);
    setMass(defaultSpringParams.mass);
    setInitialVelocity(0);
    setInitialVelocityMode('zero');
    setInitialVelocityUnit('normalized');
  };

  const handleNormalize = () => {
    const normalized = normalizeSpring(stiffness, damping, mass);
    throttledUpdateStiffness.cancel();
    throttledUpdateDamping.cancel();
    throttledUpdateMass.cancel();
    setStiffness(normalized.stiffness);
    setDamping(normalized.damping);
    setMass(normalized.mass);
    updateUrlParams(normalized);
  };

  const handleInitialVelocityModeChange = (mode: InitialVelocityMode) => {
    setInitialVelocityMode(mode);
    if (mode === 'toward-target') setInitialVelocity((value) => Math.abs(value));
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

  return (
    <main className="flex w-full max-w-5xl flex-col gap-8">
      <header className="flex items-center gap-3 px-4">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden="true"
          className="text-neutral-600 dark:text-neutral-400"
        >
          <path
            d="M2 17C6 17 5 5 9 5S10 19 14 19S16 9 22 9"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <h1 className="font-title text-lg font-semibold tracking-tight">spring parameter tuner</h1>
      </header>
      <div className="grid items-start gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <ModulePanel persistenceId="parameters" title="Parameters">
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
              onNormalize={handleNormalize}
            />
          </ModulePanel>
          <ModulePanel persistenceId="advanced" title="Advanced" defaultOpen={false}>
            <AdvancedSettings
              initialVelocity={initialVelocity}
              initialVelocityMode={initialVelocityMode}
              initialVelocityUnit={initialVelocityUnit}
              onInitialVelocityUnitChange={setInitialVelocityUnit}
              onInitialVelocityChange={setInitialVelocity}
              onInitialVelocityModeChange={handleInitialVelocityModeChange}
              restDelta={restDelta}
              restSpeed={restSpeed}
              onRestDeltaChange={setRestDelta}
              onRestSpeedChange={setRestSpeed}
            />
          </ModulePanel>
        </div>
        <div className="flex flex-col gap-4">
          <ModulePanel persistenceId="response" title="Response curve">
            <ResponseCurve options={responseOptions} />
          </ModulePanel>
          <ModulePanel persistenceId="playback" title="Target & playback" allowOverflow>
            <AnimationPreview
              activePreset={activePreset}
              targetValue={targetValue}
              currentValue={spring.value}
              onPresetClick={handlePresetClick}
              onTrackClick={handleTrackClick}
              preserveVelocity={effectivePreserveVelocity}
              hasInitialVelocity={hasInitialVelocity}
              onPreserveVelocityChange={setPreserveVelocity}
            />
          </ModulePanel>
          <ModulePanel persistenceId="spring-details" title="Spring details" defaultOpen={false}>
            <SpringRunDetails spring={spring} />
          </ModulePanel>
        </div>
      </div>
      <footer className="flex flex-col gap-8 px-4">
        <Divider />
        <HelpText />
      </footer>
    </main>
  );
};

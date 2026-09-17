import { Divider } from '#src/components/divider.js';
import { SPRING_PARAMS } from '#src/constants/spring-params.js';
import { cn } from '#src/utils/cn.js';
import type { FC } from 'react';
import { DerivedSpringValues } from './derived-spring-values.js';
import { ParameterSlider } from './parameter-slider.js';

/**
 * Props for SpringParameterControl component
 */
export interface SpringParameterControlProps {
  stiffness: number;
  damping: number;
  mass: number;
  className?: string;
  onStiffnessChange: (value: number) => void;
  onDampingChange: (value: number) => void;
  onMassChange: (value: number) => void;
  onOmegaChange?: (omega: number) => void;
  onZetaChange?: (zeta: number) => void;
  onReset?: () => void;
  onNormalize?: () => void;
}

/**
 * Component for controlling spring animation parameters
 */
export const SpringParameterControl: FC<SpringParameterControlProps> = ({
  stiffness,
  damping,
  mass,
  onStiffnessChange,
  onDampingChange,
  onMassChange,
  onOmegaChange,
  onZetaChange,
  onReset,
  onNormalize,
  className,
}) => {
  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <h4 className="text-xs font-medium tracking-wide text-neutral-500">Spring parameters</h4>

      <ParameterSlider
        ariaLabel="Stiffness"
        label="k (stiffness)"
        value={stiffness}
        min={SPRING_PARAMS.STIFFNESS.MIN}
        max={SPRING_PARAMS.STIFFNESS.MAX}
        step={SPRING_PARAMS.STIFFNESS.STEP}
        decimals={2}
        description={SPRING_PARAMS.STIFFNESS.DESCRIPTION}
        onValueChange={onStiffnessChange}
      />

      <ParameterSlider
        ariaLabel="Damping"
        label="c (damping)"
        value={damping}
        min={SPRING_PARAMS.DAMPING.MIN}
        max={SPRING_PARAMS.DAMPING.MAX}
        step={SPRING_PARAMS.DAMPING.STEP}
        decimals={2}
        description={SPRING_PARAMS.DAMPING.DESCRIPTION}
        onValueChange={onDampingChange}
      />

      <div className="flex flex-col gap-4">
        <ParameterSlider
          ariaLabel="Mass"
          label="m (mass)"
          value={mass}
          min={SPRING_PARAMS.MASS.MIN}
          max={SPRING_PARAMS.MASS.MAX}
          step={SPRING_PARAMS.MASS.STEP}
          decimals={1}
          description={SPRING_PARAMS.MASS.DESCRIPTION}
          onValueChange={onMassChange}
        />

        <div className="flex items-center gap-2">
          {onNormalize && (
            <button
              type="button"
              onClick={onNormalize}
              title="Set mass to 1 while preserving the spring response"
              className="cursor-pointer rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Normalize
            </button>
          )}
          {onReset && (
            <button
              type="button"
              onClick={onReset}
              className="cursor-pointer rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-200 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:hover:bg-neutral-800"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <Divider />

      {/* Perceptual parameters (editable) */}
      <DerivedSpringValues
        stiffness={stiffness}
        damping={damping}
        mass={mass}
        onOmegaChange={onOmegaChange}
        onZetaChange={onZetaChange}
      />
    </div>
  );
};

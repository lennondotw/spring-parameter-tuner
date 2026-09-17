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
  className,
}) => {
  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      <div className="flex items-end justify-between">
        <h4 className="text-sm font-medium text-gray-400">Spring Parameters</h4>
        {onReset && (
          <button
            onClick={onReset}
            className="
              cursor-pointer rounded-sm bg-gray-700 px-2 py-1 text-xs text-white transition-colors
              hover:bg-gray-600
            "
          >
            Reset
          </button>
        )}
      </div>

      <ParameterSlider
        ariaLabel="Stiffness"
        label="k (stiffness)"
        value={stiffness}
        min={SPRING_PARAMS.STIFFNESS.MIN}
        max={SPRING_PARAMS.STIFFNESS.MAX}
        step={SPRING_PARAMS.STIFFNESS.STEP}
        decimals={2}
        description={SPRING_PARAMS.STIFFNESS.DESCRIPTION}
        accent="blue"
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
        accent="blue"
        onValueChange={onDampingChange}
      />

      <ParameterSlider
        ariaLabel="Mass"
        label="m (mass)"
        value={mass}
        min={SPRING_PARAMS.MASS.MIN}
        max={SPRING_PARAMS.MASS.MAX}
        step={SPRING_PARAMS.MASS.STEP}
        decimals={1}
        description={SPRING_PARAMS.MASS.DESCRIPTION}
        accent="blue"
        onValueChange={onMassChange}
      />

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

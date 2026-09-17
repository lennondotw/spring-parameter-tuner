import { PERCEPTUAL_PARAMS } from '#src/constants/spring-params.js';
import { cn } from '#src/utils/cn.js';
import type { DampingType } from '#src/utils/spring-physics.js';
import { calculateCriticalDamping, getDampingType, physicalToPerceptual } from '#src/utils/spring-physics.js';
import type { FC } from 'react';
import { useMemo } from 'react';
import { ParameterSlider } from './parameter-slider.js';

interface DerivedValues {
  omega: number;
  zeta: number;
  dampingType: DampingType;
  criticalDamping: number;
}

function calculateDerivedValues(stiffness: number, damping: number, mass: number): DerivedValues {
  const { omega, zeta } = physicalToPerceptual(stiffness, damping, mass);
  const criticalDamping = calculateCriticalDamping(stiffness, mass);
  const dampingType = getDampingType(zeta);

  return { omega, zeta, dampingType, criticalDamping };
}

/**
 * Damping type display configuration
 */
const DAMPING_TYPE_LABEL: Record<DampingType, string> = {
  underdamped: 'Underdamped',
  critical: 'Critical',
  overdamped: 'Overdamped',
};

/**
 * Props for DerivedSpringValues component
 */
export interface DerivedSpringValuesProps {
  stiffness: number;
  damping: number;
  mass: number;
  className?: string;
  onOmegaChange?: (omega: number) => void;
  onZetaChange?: (zeta: number) => void;
}

/**
 * Component displaying and editing derived spring physics values
 */
export const DerivedSpringValues: FC<DerivedSpringValuesProps> = ({
  stiffness,
  damping,
  mass,
  className,
  onOmegaChange,
  onZetaChange,
}) => {
  const derived = useMemo(() => calculateDerivedValues(stiffness, damping, mass), [stiffness, damping, mass]);

  const dampingTypeLabel = DAMPING_TYPE_LABEL[derived.dampingType];

  const handleOmegaChange = (value: number) => {
    onOmegaChange?.(value);
  };

  const handleZetaChange = (value: number) => {
    onZetaChange?.(value);
  };

  return (
    <div className={cn('flex w-full flex-col gap-3', className)}>
      <h4 className="text-xs font-medium tracking-wide text-neutral-500">Perceptual parameters</h4>

      <ParameterSlider
        ariaLabel="Natural frequency"
        label="ω (frequency)"
        value={derived.omega}
        min={PERCEPTUAL_PARAMS.OMEGA.MIN}
        max={PERCEPTUAL_PARAMS.OMEGA.MAX}
        step={PERCEPTUAL_PARAMS.OMEGA.STEP}
        decimals={2}
        description={PERCEPTUAL_PARAMS.OMEGA.DESCRIPTION}
        unit="rad/s"
        onValueChange={handleOmegaChange}
      />

      <ParameterSlider
        ariaLabel="Damping ratio"
        label="ζ (damping ratio)"
        value={derived.zeta}
        min={PERCEPTUAL_PARAMS.ZETA.MIN}
        max={PERCEPTUAL_PARAMS.ZETA.MAX}
        step={PERCEPTUAL_PARAMS.ZETA.STEP}
        decimals={3}
        description={PERCEPTUAL_PARAMS.ZETA.DESCRIPTION}
        onValueChange={handleZetaChange}
      />

      {/* Read-only status */}
      <div className="mt-1 grid grid-cols-2 gap-x-4 text-sm">
        <div className="flex flex-col">
          <div className="text-xs text-neutral-400 dark:text-neutral-600">Type</div>
          <div className="font-mono">{dampingTypeLabel}</div>
        </div>
        <div className="flex flex-col">
          <div className="text-xs text-neutral-400 dark:text-neutral-600">Critical damping</div>
          <div className="font-mono text-neutral-700 dark:text-neutral-300">{derived.criticalDamping.toFixed(2)}</div>
        </div>
      </div>
    </div>
  );
};

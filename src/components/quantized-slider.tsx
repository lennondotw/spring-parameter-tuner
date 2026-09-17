import { useFrameQueue } from '#src/hooks/use-frame-queue.js';
import { quantizeWithHysteresis } from '#src/utils/quantize-with-hysteresis.js';
import { Slider } from '@base-ui/react/slider';
import { useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';

interface QuantizedSliderProps {
  value: number;
  min: number;
  max: number;
  /** Decimal places emitted to the consumer, independent of thumb movement. */
  decimals: number;
  step: number;
  largeStep?: number;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
  onValueChange: (value: number) => void;
}

/** Unstyled, controlled, single-value horizontal slider built on Base UI. */
export function QuantizedSlider({
  value,
  min,
  max,
  decimals,
  step,
  largeStep = step * 10,
  disabled,
  className,
  children,
  onValueChange,
}: QuantizedSliderProps) {
  const quantize = (next: number) => Math.min(max, Math.max(min, Number(next.toFixed(decimals))));
  const [position, setPosition] = useState({ external: value, raw: value, quantized: value, min, max, decimals });
  const latchRef = useRef(value);
  const { schedule, flush, cancel } = useFrameQueue();

  // A consumer echo must not snap the thumb back to the quantized position.
  // Independent edits (number field, reset, derived parameters) still reposition it.
  let raw = position.raw;
  if (position.external !== value || position.min !== min || position.max !== max || position.decimals !== decimals) {
    // Derived spring parameters can round-trip with floating-point noise.
    const tolerance = Number.EPSILON * Math.max(1, Math.abs(value)) * 8;
    const isEcho =
      Math.abs(position.quantized - value) <= tolerance &&
      position.min === min &&
      position.max === max &&
      position.decimals === decimals;
    raw = isEcho ? raw : Math.min(max, Math.max(min, value));
    setPosition({ external: value, raw, quantized: value, min, max, decimals });
  }

  // External edits invalidate queued drag work before the browser paints.
  useLayoutEffect(() => {
    cancel();
    latchRef.current = value;
  }, [value, min, max, decimals, cancel]);

  const update = (next: number, immediate = false) => {
    const quantized = immediate ? quantize(next) : quantizeWithHysteresis(next, latchRef.current, decimals, min, max);
    latchRef.current = quantized;
    setPosition({ external: value, raw: next, quantized, min, max, decimals });
    // Always replace pending work, including a return to the current value.
    const notify = () => {
      if (quantized !== value) onValueChange(quantized);
    };
    if (immediate) {
      cancel();
      notify();
    } else {
      schedule(notify);
    }
  };

  const handleKeyDown = (event: KeyboardEvent) => {
    if (disabled || event.defaultPrevented) return;
    const direction = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: 1,
      PageDown: -1,
    }[event.key];
    if (direction === undefined && event.key !== 'Home' && event.key !== 'End') return;
    event.preventDefault();
    const increment = event.shiftKey || event.key.startsWith('Page') ? largeStep : step;
    const next = event.key === 'Home' ? min : event.key === 'End' ? max : value + (direction ?? 0) * increment;
    update(quantize(next), true);
  };

  return (
    <Slider.Root
      value={raw}
      min={min}
      max={max}
      step={0.000001}
      largeStep={largeStep}
      disabled={disabled}
      className={className}
      format={{ maximumFractionDigits: decimals }}
      onValueChange={(next) => update(next)}
      onValueCommitted={flush}
      onKeyDownCapture={handleKeyDown}
    >
      {children}
    </Slider.Root>
  );
}

import { BUTTON_HOVER_IN_SPRING, BUTTON_HOVER_OUT_SPRING } from '#src/constants/interface-springs.js';
import { useSpringValueWithVelocityHandoff } from '#src/hooks/use-spring-value-with-velocity-handoff.js';
import { cn } from '#src/utils/cn.js';
import { motion, useMotionTemplate, useTransform, type HTMLMotionProps } from 'framer-motion';
import type { FC } from 'react';

interface SpringHoverButtonProps extends Omit<HTMLMotionProps<'button'>, 'onHoverStart' | 'onHoverEnd'> {
  selected?: boolean;
  variant?: 'filled' | 'text';
}

export const SpringHoverButton: FC<SpringHoverButtonProps> = ({
  selected = false,
  variant = 'filled',
  className,
  style,
  onTapStart,
  onTap,
  onTapCancel,
  onKeyDown,
  onKeyUp,
  onBlur,
  ...props
}) => {
  const { value: progress, setTarget } = useSpringValueWithVelocityHandoff(0);
  const { value: pressProgress, setTarget: setPressTarget } = useSpringValueWithVelocityHandoff(0);
  const setPressed = (pressed: boolean) => {
    if (variant === 'filled')
      setPressTarget(pressed ? 1 : 0, pressed ? BUTTON_HOVER_IN_SPRING : BUTTON_HOVER_OUT_SPRING);
  };
  // A half-step towards the next neutral keeps pressed feedback subtle.
  const pressWeight = useTransform(pressProgress, (latest) => `${Math.min(1, Math.max(0, latest)) * 50}%`);
  const weight = useTransform(progress, (latest) => `${Math.min(1, Math.max(0, latest)) * 100}%`);
  const backgroundColor = useMotionTemplate`color-mix(in oklab, var(--button-rest), var(--button-hover) ${weight})`;
  const pressedBackgroundColor = useMotionTemplate`color-mix(in oklab, ${backgroundColor}, var(--button-active) ${pressWeight})`;
  const color = useMotionTemplate`color-mix(in oklab, var(--button-foreground-rest), var(--button-foreground-hover) ${weight})`;

  return (
    <motion.button
      type="button"
      {...props}
      onHoverStart={() => setTarget(1, BUTTON_HOVER_IN_SPRING)}
      onHoverEnd={() => setTarget(0, BUTTON_HOVER_OUT_SPRING)}
      onTapStart={(event, info) => {
        setPressed(true);
        onTapStart?.(event, info);
      }}
      onTap={(event, info) => {
        setPressed(false);
        onTap?.(event, info);
      }}
      onTapCancel={(event, info) => {
        setPressed(false);
        onTapCancel?.(event, info);
      }}
      onKeyDown={(event) => {
        // Motion's tap gesture covers Enter; native buttons also support Space.
        if (event.key === ' ') setPressed(true);
        onKeyDown?.(event);
      }}
      onKeyUp={(event) => {
        if (event.key === ' ') setPressed(false);
        onKeyUp?.(event);
      }}
      onBlur={(event) => {
        setPressed(false);
        onBlur?.(event);
      }}
      style={{
        ...style,
        ...(variant === 'text'
          ? { color, backgroundColor: 'transparent' }
          : { backgroundColor: pressedBackgroundColor }),
      }}
      className={cn(
        className,
        variant === 'text'
          ? `
              [--button-foreground-hover:var(--color-neutral-800)] [--button-foreground-rest:var(--color-neutral-600)]
              dark:[--button-foreground-hover:var(--color-neutral-200)] dark:[--button-foreground-rest:var(--color-neutral-400)]
            `
          : selected
            ? `
              text-white [--button-active:var(--color-neutral-900)] [--button-hover:var(--color-neutral-800)] [--button-rest:var(--color-neutral-800)]
              dark:text-black dark:[--button-active:var(--color-neutral-100)] dark:[--button-hover:var(--color-neutral-200)] dark:[--button-rest:var(--color-neutral-200)]
            `
            : `
              text-neutral-600 [--button-active:var(--color-neutral-300)] [--button-hover:var(--color-neutral-200)] [--button-rest:var(--color-neutral-50)]
              dark:text-neutral-400 dark:[--button-active:var(--color-neutral-700)] dark:[--button-hover:var(--color-neutral-800)] dark:[--button-rest:var(--color-neutral-950)]
            `
      )}
    />
  );
};

import { cn } from '#src/utils/cn.js';
import { Switch as BaseSwitch } from '@base-ui/react/switch';
import type { FC } from 'react';
import { useId } from 'react';

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  className?: string;
}

export const Switch: FC<SwitchProps> = ({ checked, onCheckedChange, label, description, className }) => {
  const id = useId();

  return (
    <label htmlFor={id} className={cn('flex cursor-pointer items-center justify-between gap-3', className)}>
      <div className="flex flex-col">
        {label && <span className="text-sm font-medium">{label}</span>}
        {description && <span className="text-xs text-gray-500">{description}</span>}
      </div>
      <BaseSwitch.Root
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        className={cn(
          `
            relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full
            transition-colors outline-none has-focus-visible:ring-2 has-focus-visible:ring-blue-300
          `,
          checked ? 'bg-blue-500' : 'bg-gray-600'
        )}
      >
        <BaseSwitch.Thumb
          className={cn(
            'pointer-events-none block size-4 rounded-full bg-white shadow-sm transition-transform',
            checked ? 'translate-x-[18px]' : 'translate-x-0.5'
          )}
        />
      </BaseSwitch.Root>
    </label>
  );
};

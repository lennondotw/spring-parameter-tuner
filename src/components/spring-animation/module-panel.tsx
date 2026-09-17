import { PANEL_TRANSITION_SPRING } from '#src/constants/interface-springs.js';
import { usePanelState } from '#src/hooks/use-panel-state.js';
import { cn } from '#src/utils/cn.js';
import { perceptualToPhysical } from '#src/utils/spring-physics.js';
import { MinusIcon } from '@phosphor-icons/react/dist/csr/Minus';
import { PlusIcon } from '@phosphor-icons/react/dist/csr/Plus';
import { motion, useReducedMotion } from 'framer-motion';
import { useId, useState, type ReactNode } from 'react';

const panelSpring = {
  type: 'spring' as const,
  ...perceptualToPhysical(PANEL_TRANSITION_SPRING.omega, PANEL_TRANSITION_SPRING.zeta),
  mass: 1,
};

export function ModulePanel({
  title,
  persistenceId,
  children,
  defaultOpen = true,
  allowOverflow = false,
}: {
  title: string;
  persistenceId?: string;
  children: ReactNode;
  defaultOpen?: boolean;
  allowOverflow?: boolean;
}) {
  const [open, setOpen] = usePanelState(persistenceId, defaultOpen);
  const [fullyExpanded, setFullyExpanded] = useState(open);
  const contentId = useId();
  const prefersReducedMotion = useReducedMotion();
  const overflowVisible = allowOverflow && open && (fullyExpanded || prefersReducedMotion);
  return (
    <section className="isolate rounded-lg border border-neutral-100 dark:border-neutral-900">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={contentId}
        onClick={() => {
          setFullyExpanded(false);
          setOpen(!open);
        }}
        className="flex w-full cursor-pointer items-center justify-between rounded-lg px-4 py-3 text-left text-xs text-neutral-600 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
      >
        <span>{title}</span>
        {open ? (
          <MinusIcon aria-hidden="true" size={10} className="shrink-0" />
        ) : (
          <PlusIcon aria-hidden="true" size={10} className="shrink-0" />
        )}
      </button>
      <motion.div
        id={contentId}
        initial={false}
        animate={{ gridTemplateRows: open ? '1fr' : '0fr' }}
        transition={prefersReducedMotion ? { duration: 0 } : panelSpring}
        inert={!open}
        onAnimationComplete={() => {
          setFullyExpanded(open);
        }}
        className={cn('isolate grid', overflowVisible ? 'overflow-visible' : 'overflow-hidden')}
      >
        {/* Keep state mounted; the zero-minimum track can collapse fully. */}
        <div className={cn('min-h-0', overflowVisible ? 'overflow-visible' : 'overflow-hidden')}>
          <div className="px-4 pb-4">{children}</div>
        </div>
      </motion.div>
    </section>
  );
}

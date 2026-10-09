import { useFrameQueue } from '#src/hooks/use-frame-queue.js';
import { cn } from '#src/utils/cn.js';
import { AnimatePresence, motion } from 'framer-motion';
import type { FC, PointerEvent } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

// The 8px gutters extend the same scale beyond 0–100.
const TRACK_INSET_PX = 8;
const TICKS = Array.from({ length: 51 }, (_, index) => index * 2);

/**
 * Marker data structure
 */
interface Marker {
  id: number;
  progress: number;
  released: boolean;
}

/**
 * Props for TargetValueSelector component
 */
export interface TargetValueSelectorProps {
  targetProgress: number;
  className?: string;
  onTrackClick: (percentage: number) => void;
}

/**
 * Component for selecting target values using interactive area
 */
export const TargetValueSelector: FC<TargetValueSelectorProps> = ({ onTrackClick, targetProgress, className }) => {
  const nextMarkerIdRef = useRef(0);
  const [markers, setMarkers] = useState<Marker[]>([]);

  const callbackRef = useRef(onTrackClick);
  useLayoutEffect(() => {
    callbackRef.current = onTrackClick;
  }, [onTrackClick]);
  const dragRef = useRef<{
    pointerId: number;
    markerId: number;
    startX: number;
    startY: number;
    dragging: boolean;
    progress: number;
    published: number;
    startProgress: number;
  } | null>(null);
  const { schedule, flush, cancel } = useFrameQueue();

  const readProgress = (event: PointerEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const track = event.currentTarget;
    const contentWidth = track.clientWidth;
    if (contentWidth <= 2 * TRACK_INSET_PX) return null;
    return (event.clientX - rect.left - track.clientLeft - TRACK_INSET_PX) / (contentWidth - 2 * TRACK_INSET_PX);
  };
  const publish = () => {
    const drag = dragRef.current;
    if (!drag || drag.progress === drag.published) return;
    drag.published = drag.progress;
    callbackRef.current(drag.progress);
  };
  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current || event.button !== 0) return;
    const progress = readProgress(event);
    if (progress === null) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    const markerId = nextMarkerIdRef.current++;
    dragRef.current = {
      pointerId: event.pointerId,
      markerId,
      startX: event.clientX,
      startY: event.clientY,
      dragging: false,
      progress,
      published: progress,
      startProgress: targetProgress,
    };
    setMarkers((previous) => [...previous, { id: markerId, progress, released: false }]);
    callbackRef.current(progress);
  };
  const move = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const progress = readProgress(event);
    if (progress === null) return;
    // The feedback follows every pointer event, independent of target throttling.
    setMarkers((previous) =>
      previous.map((marker) => (marker.id === drag.markerId ? { ...marker, progress } : marker))
    );
    drag.dragging ||= Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 3;
    if (!drag.dragging) return;
    drag.progress = progress;
    schedule(publish);
  };
  const finish = (event: PointerEvent<HTMLDivElement>, cancelled = false) => {
    const drag = dragRef.current;
    if (drag?.pointerId !== event.pointerId) return;
    if (cancelled) {
      cancel();
      callbackRef.current(drag.startProgress);
    } else flush();
    dragRef.current = null;
    setMarkers((previous) =>
      previous.map((marker) => (marker.id === drag.markerId ? { ...marker, released: true } : marker))
    );
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    if (event.buttons === 0) {
      finish(event);
      return;
    }
    move(event);
  };
  const handleUp = (event: PointerEvent<HTMLDivElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    move(event);
    finish(event);
  };

  // Remove marker by id
  const removeMarker = (id: number) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id));
  };

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <div className="block text-xs font-medium text-neutral-600 dark:text-neutral-400">
        Click or drag to set a target
      </div>
      <div
        className="relative h-12 w-full cursor-pointer touch-none overflow-hidden rounded-md border border-neutral-200 bg-black/3 dark:border-neutral-800 dark:bg-white/5"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={(event) => finish(event, true)}
        onLostPointerCapture={(event) => finish(event)}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0"
          style={{ left: TRACK_INSET_PX, right: TRACK_INSET_PX }}
        >
          {TICKS.map((value) => (
            <div
              key={value}
              className={cn(
                'absolute top-1/2 w-px -translate-1/2 rounded-full bg-black/15 dark:bg-white/15',
                value % 10 === 0 ? 'h-4' : 'h-2'
              )}
              style={{ left: `${value}%` }}
            />
          ))}
        </div>

        {/* Click position markers */}
        <AnimatePresence>
          {markers.map((marker) => (
            <motion.div
              key={marker.id}
              className="pointer-events-none absolute inset-y-2 w-0.5 -translate-x-1/2 rounded-full bg-neutral-900 dark:bg-neutral-100"
              style={{
                left: `calc(${marker.progress * 100}% + ${TRACK_INSET_PX * (1 - 2 * marker.progress)}px)`,
              }}
              initial={{ opacity: 0.6 }}
              animate={{ opacity: marker.released ? 0 : 0.6 }}
              exit={{ opacity: 0 }}
              transition={{
                opacity: { duration: marker.released ? 1 : 0, ease: 'easeOut' },
              }}
              onAnimationComplete={() => {
                if (marker.released) removeMarker(marker.id);
              }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

import { cn } from '@/utils/cn';
import { clamp } from '@/utils/math.ts';
import * as Label from '@radix-ui/react-label';
import { AnimatePresence, motion } from 'framer-motion';
import { FC, MouseEvent, useState } from 'react';

/**
 * Marker data structure
 */
interface Marker {
  id: number;
  position: number;
}

/**
 * Props for TargetValueSelector component
 */
export interface TargetValueSelectorProps {
  className?: string;
  onTrackClick: (percentage: number) => void;
}

/**
 * Component for selecting target values using interactive area
 */
export const TargetValueSelector: FC<TargetValueSelectorProps> = ({ onTrackClick, className }) => {
  const [markers, setMarkers] = useState<Marker[]>([]);

  // Handle click to show temporary line
  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    // Get element bounds
    const rect = e.currentTarget.getBoundingClientRect();

    // Calculate percentage position (relative to the element)
    const relativeX = e.clientX - rect.left;
    const percentage = clamp(relativeX / rect.width, 0, 1);

    // Add new marker
    const newMarker: Marker = {
      id: Date.now(), // Unique ID
      position: percentage,
    };

    setMarkers((prev) => [...prev, newMarker]);

    // Call the original click handler
    onTrackClick(percentage);
  };

  // Remove marker by id
  const removeMarker = (id: number) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id));
  };

  return (
    <div className={cn('flex w-full flex-col gap-2', className)}>
      <Label.Root className="block text-sm font-medium">Click the area below to set target value</Label.Root>
      <div className="h-8 w-full rounded-[6px] bg-gray-700 p-[4px]">
        <div className="relative size-full overflow-hidden rounded-[4px]">
          {/* Progress background */}
          <div className="size-full cursor-pointer bg-gray-600" onClick={handleClick} />

          {/* Click position markers */}
          <AnimatePresence>
            {markers.map((marker) => (
              <motion.div
                key={marker.id}
                className="absolute top-0 h-full w-[2px] -translate-x-1/2 bg-pink-400"
                style={{ left: `${marker.position * 100}%` }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  opacity: { duration: 1.5, ease: 'easeOut' },
                }}
                onAnimationComplete={() => removeMarker(marker.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

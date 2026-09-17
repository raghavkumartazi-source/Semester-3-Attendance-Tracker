'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AttendanceStatus } from '@/lib/types';
import { getAttendanceButtonColor } from '@/lib/calculations';
import { triggerCelebration } from './CelebrationBurst';

interface Props {
  status: AttendanceStatus;
  onMark: (status: AttendanceStatus) => void;
  compact?: boolean;
}

const BUTTONS: {
  label: string;
  emoji: string;
  value: AttendanceStatus;
  burst: 'PRESENT' | 'ABSENT' | 'CANCELLED';
}[] = [
  { label: 'Present', emoji: '✅', value: 'PRESENT', burst: 'PRESENT' },
  { label: 'Absent', emoji: '❌', value: 'ABSENT', burst: 'ABSENT' },
  { label: 'Cancelled', emoji: '🚫', value: 'CANCELLED', burst: 'CANCELLED' },
];

export default function AttendanceButtons({ status, onMark, compact }: Props) {
  const [popped, setPopped] = useState<AttendanceStatus | null>(null);

  const handleMark = useCallback(
    (value: AttendanceStatus, burst: AttendanceStatus, e: React.MouseEvent<HTMLButtonElement>) => {
      e.stopPropagation();
      const willActivate = status !== value;
      onMark(willActivate ? value : 'UNMARKED');

      if (willActivate) {
        // Fire the emoji/particle burst from the actual tap point
        triggerCelebration(burst, e.clientX, e.clientY);
        // Trigger the in-button emoji pop
        setPopped(burst);
        window.setTimeout(() => setPopped(null), 700);
      }
    },
    [status, onMark]
  );

  return (
    <div className="flex items-center gap-1.5">
      {BUTTONS.map((btn) => {
        const isActive = status === btn.value;
        return (
          <motion.button
            key={btn.value}
            onClick={(e) => handleMark(btn.value, btn.burst, e)}
            whileTap={{ scale: 0.82 }}
            whileHover={{ scale: 1.08, y: -1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 22, mass: 0.6 }}
            className={`relative flex items-center justify-center rounded-[14px] font-semibold overflow-visible ${
              compact ? 'h-9 w-9 text-sm' : 'h-11 w-11 text-base'
            } ${
              isActive
                ? `${getAttendanceButtonColor(btn.value)} shadow-lg`
                : 'glass-button text-white/40 hover:text-white/80'
            }`}
            title={isActive ? `Unmark ${btn.label}` : `Mark ${btn.label}`}
            aria-label={btn.label}
            aria-pressed={isActive}
          >
            {/* Expanding halo on activation */}
            <AnimatePresence>
              {isActive && (
                <motion.span
                  key={`halo-${btn.value}`}
                  initial={{ scale: 0.5, opacity: 0.7 }}
                  animate={{ scale: 2.1, opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={`pointer-events-none absolute inset-0 rounded-[14px] ${
                    btn.value === 'PRESENT'
                      ? 'bg-emerald-400/30'
                      : btn.value === 'ABSENT'
                        ? 'bg-red-400/30'
                        : 'bg-white/20'
                  }`}
                />
              )}
            </AnimatePresence>

            {/* Emoji glyph — re-mounts on activation to replay the pop */}
            <AnimatePresence mode="wait">
              <motion.span
                key={`${btn.value}-${isActive}`}
                initial={isActive ? { scale: 0, rotate: -25, opacity: 0 } : false}
                animate={
                  popped === btn.value
                    ? { scale: [1, 1.4, 0.9, 1.15, 1], rotate: [-25, 8, -4, 0], opacity: 1 }
                    : { scale: 1, rotate: 0, opacity: 1 }
                }
                transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                className="relative z-10 select-none"
                style={{ fontSize: compact ? '15px' : '18px', lineHeight: 1 }}
              >
                {btn.emoji}
              </motion.span>
            </AnimatePresence>

            {/* Full label under the glyph (non-compact only) */}
            {!compact && (
              <span className="sr-only">{btn.label}</span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

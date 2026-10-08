'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { CheckIcon, XMarkIcon, MinusIcon } from '@heroicons/react/24/outline';
import { AttendanceStatus } from '@/lib/types';
import { triggerCelebration } from './CelebrationBurst';

interface Props {
  status: AttendanceStatus;
  onMark: (status: AttendanceStatus) => void;
  compact?: boolean;
}

const buttons = [
  { label: 'Present', value: 'PRESENT' as const, icon: CheckIcon },
  { label: 'Absent', value: 'ABSENT' as const, icon: XMarkIcon },
  { label: 'Cancelled', value: 'CANCELLED' as const, icon: MinusIcon },
];

export default function AttendanceButtons({ status, onMark, compact }: Props) {
  const reduced = useReducedMotion();
  return (
    <div className={`attendance-actions${compact ? ' is-compact' : ''}`} role="group" aria-label="Mark attendance">
      {buttons.map(({ label, value, icon: Icon }) => (
        <motion.button whileTap={reduced ? undefined : { scale: .86 }} transition={{ type: 'spring', stiffness: 480, damping: 20 }} type="button" key={value} className={`attendance-action status-${value.toLowerCase()}`} aria-label={status === value ? `Unmark ${label}` : `Mark ${label}`} aria-pressed={status === value} title={label}
          onClick={(event) => {
            event.stopPropagation();
            const nextStatus = status === value ? 'UNMARKED' : value;
            const rect = event.currentTarget.getBoundingClientRect();
            if (nextStatus !== 'UNMARKED') triggerCelebration(nextStatus, rect.left + rect.width / 2, rect.top + rect.height / 2);
            onMark(nextStatus);
          }}>
          <motion.span className="attendance-icon" key={`${value}-${status === value}`} initial={reduced ? false : { scale: .65, rotate: -12 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 400, damping: 16 }}><Icon aria-hidden="true" /></motion.span>
          {!compact && <span>{label}</span>}
        </motion.button>
      ))}
    </div>
  );
}

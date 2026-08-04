'use client';

import { AttendanceStatus } from '@/lib/types';
import { getAttendanceButtonColor } from '@/lib/calculations';

interface Props {
  status: AttendanceStatus;
  onMark: (status: AttendanceStatus) => void;
  compact?: boolean;
}

export default function AttendanceButtons({ status, onMark, compact }: Props) {
  const buttons: { label: string; short: string; value: AttendanceStatus }[] = [
    { label: 'Present', short: 'P', value: 'PRESENT' },
    { label: 'Absent', short: 'A', value: 'ABSENT' },
    { label: 'Cancelled', short: 'C', value: 'CANCELLED' },
  ];

  return (
    <div className="flex items-center gap-1.5">
      {buttons.map(btn => {
        const isActive = status === btn.value;
        return (
          <button
            key={btn.value}
            onClick={(e) => {
              e.stopPropagation();
              // Toggle: if already selected, go back to UNMARKED
              onMark(isActive ? 'UNMARKED' : btn.value);
            }}
            className={`flex items-center justify-center rounded-[14px] font-semibold transition-all duration-200 ease-out active:scale-95 ${
              compact ? 'h-9 w-9 text-xs' : 'h-11 w-11 text-sm'
            } ${
              isActive
                ? getAttendanceButtonColor(btn.value)
                : 'glass-button text-white/40 hover:text-white/80'
            }`}
            title={btn.label}
          >
            {btn.short}
          </button>
        );
      })}
    </div>
  );
}

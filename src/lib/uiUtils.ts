import { AttendanceStatus, ClassType } from './types';

export const TYPE_SHORT: Record<ClassType, string> = {
  Lecture: 'Lec',
  Tutorial: 'Tut',
  Lab: 'Lab',
};

export const STATUS_DISPLAY: Record<AttendanceStatus, string> = {
  PRESENT: 'P',
  ABSENT: 'A',
  CANCELLED: 'C',
  UNMARKED: '—',
};

export function getStatusCellClass(status: AttendanceStatus): string {
  switch (status) {
    case 'PRESENT':
      return 'bg-gradient-to-b from-emerald-500/35 to-emerald-500/15 text-emerald-300 border-emerald-400/40 shadow-[inset_0_1px_0_rgba(52,211,153,0.4),0_0_12px_rgba(16,185,129,0.2)] font-bold';
    case 'ABSENT':
      return 'bg-gradient-to-b from-red-500/35 to-red-500/15 text-red-300 border-red-400/40 shadow-[inset_0_1px_0_rgba(248,113,113,0.4),0_0_12px_rgba(239,68,68,0.2)] font-bold';
    case 'CANCELLED':
      return 'bg-gradient-to-b from-white/10 to-white/[0.04] text-zinc-300 border-white/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] font-medium';
    case 'UNMARKED':
      return 'glass-recessed text-white/20 hover:bg-white/[0.06] !border-white/[0.03]';
  }
}

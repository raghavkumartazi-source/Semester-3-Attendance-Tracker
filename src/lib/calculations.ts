import { AttendanceLevel, AttendanceStatus, SubjectAttendance, OverallAttendance, Session } from './types';
import { MINIMUM_ATTENDANCE } from './config';

/**
 * Calculate attendance percentage.
 * Returns null if no classes conducted.
 */
export function calculateAttendance(present: number, absent: number): number | null {
  const total = present + absent;
  if (total === 0) return null;
  return (present / total) * 100;
}

/**
 * Calculate maximum classes that can be bunked while staying >= 75%.
 * Solve: present / (total + x) >= 0.75
 * => x <= (present / 0.75) - total
 * => x <= (present - 0.75 * total) / 0.75
 */
export function calculateCanBunk(present: number, absent: number): number {
  const total = present + absent;
  if (total === 0) return 0;
  const percentage = present / total;
  if (percentage < MINIMUM_ATTENDANCE) return 0;
  const x = Math.floor(present / MINIMUM_ATTENDANCE) - total;
  return Math.max(0, x);
}

/**
 * Calculate minimum classes that must be attended to reach >= 75%.
 * Solve: (present + x) / (total + x) >= 0.75
 * => present + x >= 0.75 * total + 0.75 * x
 * => 0.25 * x >= 0.75 * total - present
 * => x >= (0.75 * total - present) / 0.25
 * => x >= 3 * total - 4 * present
 */
export function calculateNeedToAttend(present: number, absent: number): number {
  const total = present + absent;
  if (total === 0) return 0;
  const percentage = present / total;
  if (percentage >= MINIMUM_ATTENDANCE) return 0;
  const x = Math.ceil((MINIMUM_ATTENDANCE * total - present) / (1 - MINIMUM_ATTENDANCE));
  return Math.max(0, x);
}

/**
 * Determine attendance status level.
 */
export function calculateStatus(present: number, absent: number): AttendanceLevel {
  const total = present + absent;
  if (total === 0) return 'NO_DATA';
  const percentage = (present / total) * 100;
  if (percentage >= 80) return 'SAFE';
  if (percentage >= 75) return 'WARNING';
  return 'DANGER';
}

/**
 * Get complete attendance stats for a subject from its sessions.
 */
export function getSubjectAttendance(sessions: Session[]): SubjectAttendance {
  let present = 0;
  let absent = 0;
  let cancelled = 0;
  let unmarked = 0;

  for (const s of sessions) {
    switch (s.status) {
      case 'PRESENT': present++; break;
      case 'ABSENT': absent++; break;
      case 'CANCELLED': cancelled++; break;
      case 'UNMARKED': unmarked++; break;
    }
  }

  return {
    present,
    absent,
    cancelled,
    unmarked,
    totalConducted: present + absent,
    percentage: calculateAttendance(present, absent),
    canBunk: calculateCanBunk(present, absent),
    needToAttend: calculateNeedToAttend(present, absent),
    level: calculateStatus(present, absent),
  };
}

/**
 * Get overall attendance across all subjects.
 */
export function getOverallAttendance(allSessions: Session[]): OverallAttendance {
  let totalPresent = 0;
  let totalAbsent = 0;

  for (const s of allSessions) {
    if (s.status === 'PRESENT') totalPresent++;
    if (s.status === 'ABSENT') totalAbsent++;
  }

  const totalConducted = totalPresent + totalAbsent;

  return {
    totalPresent,
    totalAbsent,
    totalConducted,
    percentage: calculateAttendance(totalPresent, totalAbsent),
    level: calculateStatus(totalPresent, totalAbsent),
  };
}

/**
 * Format attendance percentage for display.
 */
export function formatPercentage(value: number | null): string {
  if (value === null) return '--';
  return `${Math.round(value * 10) / 10}%`;
}

/**
 * Get status color classes.
 */
export function getStatusColor(level: AttendanceLevel): string {
  switch (level) {
    case 'SAFE': return 'text-emerald-400';
    case 'WARNING': return 'text-amber-400';
    case 'DANGER': return 'text-red-400';
    case 'NO_DATA': return 'text-zinc-500';
  }
}

export function getStatusBg(level: AttendanceLevel): string {
  switch (level) {
    case 'SAFE': return 'bg-emerald-500/10 border-emerald-500/20 shadow-[inset_0_1px_1px_rgba(16,185,129,0.1)]';
    case 'WARNING': return 'bg-amber-500/10 border-amber-500/20 shadow-[inset_0_1px_1px_rgba(245,158,11,0.1)]';
    case 'DANGER': return 'bg-red-500/10 border-red-500/20 shadow-[inset_0_1px_1px_rgba(239,68,68,0.1)]';
    case 'NO_DATA': return 'bg-white/[0.03] border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)]';
  }
}

export function getStatusLabel(level: AttendanceLevel): string {
  switch (level) {
    case 'SAFE': return 'SAFE';
    case 'WARNING': return 'WARNING';
    case 'DANGER': return 'DANGER';
    case 'NO_DATA': return 'NO DATA';
  }
}

export function getAttendanceButtonColor(status: AttendanceStatus): string {
  switch (status) {
    case 'PRESENT': return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md';
    case 'ABSENT': return 'bg-red-500/20 text-red-300 border border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.2),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md';
    case 'CANCELLED': return 'bg-white/10 text-white/90 border border-white/20 shadow-[0_0_15px_rgba(255,255,255,0.1),inset_0_1px_1px_rgba(255,255,255,0.1)] backdrop-blur-md';
    case 'UNMARKED': return 'glass-button text-zinc-400 hover:text-white drop-shadow-sm';
  }
}

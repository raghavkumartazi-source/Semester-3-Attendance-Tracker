/* ============================================================
   lib/theme.ts
   ------------------------------------------------------------
   Centralized theme tokens + domain helpers for the
   background atmosphere system. Single source of truth shared
   by globals.css (CSS vars) and BackgroundFX (JS bindings).
   ============================================================ */

/** Semester bounds — must match timeUtils.getSemesterProgress(). */
export const SEMESTER_START = new Date(2026, 6, 23); // 23 July 2026
export const SEMESTER_END = new Date(2026, 10, 27); // 27 November 2026

const MS_PER_SECOND = 1000;

/** Subject accent map — mirrors the OKLCH tokens in globals.css @theme. */
export const SUBJECT_COLORS: Record<string, string> = {
  'EC-201': 'oklch(65% 0.22 250)',
  'EC-202': 'oklch(65% 0.22 250)',
  'EC-203': 'oklch(65% 0.22 250)',
  'EO-201': 'oklch(60% 0.18 150)',
  'EO-103': 'oklch(60% 0.18 150)',
  'MA-201': 'oklch(75% 0.15 90)',
  'MO-201': 'oklch(65% 0.20 340)',
  HLM: 'oklch(50% 0.02 240)',
};

export const DEFAULT_WASH_COLOR = 'oklch(65% 0.22 250)';

/** Time-of-day aurora triads. Hue shifts like a sky through the day. */
const AURORA_TIME_OF_DAY: { hours: [number, number]; a: string; b: string; c: string }[] = [
  { hours: [0, 5], a: 'oklch(60% 0.18 260 / 0.22)', b: 'oklch(55% 0.16 230 / 0.18)', c: 'oklch(50% 0.14 300 / 0.16)' },
  { hours: [5, 9], a: 'oklch(70% 0.18 40 / 0.22)', b: 'oklch(65% 0.16 90 / 0.18)', c: 'oklch(60% 0.18 250 / 0.16)' },
  { hours: [9, 17], a: 'oklch(62% 0.20 250 / 0.22)', b: 'oklch(58% 0.18 150 / 0.18)', c: 'oklch(60% 0.18 200 / 0.16)' },
  { hours: [17, 20], a: 'oklch(68% 0.22 30 / 0.22)', b: 'oklch(62% 0.20 350 / 0.18)', c: 'oklch(55% 0.18 280 / 0.16)' },
  { hours: [20, 24], a: 'oklch(58% 0.20 290 / 0.22)', b: 'oklch(55% 0.18 250 / 0.18)', c: 'oklch(52% 0.16 320 / 0.16)' },
];

/** Pick the aurora triad for the current hour. */
export function auroraTriadForHour(hour: number = new Date().getHours()) {
  return (
    AURORA_TIME_OF_DAY.find(({ hours: [from, to] }) => hour >= from && hour < to) ??
    AURORA_TIME_OF_DAY[0]
  );
}

/** A complementary accent (subject's hue shifted ~180°) for aurora variety. */
export function complementOf(oklch: string): string {
  const match = oklch.match(/oklch\((\d+)%\s+([\d.]+)\s+(\d+)/);
  if (!match) return oklch;
  const [, l, c, h] = match;
  return `oklch(${l}% ${c} ${(Number(h) + 180) % 360} / 0.16)`;
}

/** Attendance-level → horizon color token. */
export function horizonColorForLevel(level: 'SAFE' | 'WARNING' | 'DANGER' | 'NO_DATA'): string {
  switch (level) {
    case 'SAFE':
      return 'oklch(55% 0.18 145)';
    case 'WARNING':
      return 'oklch(65% 0.20 85)';
    case 'DANGER':
      return 'oklch(55% 0.22 25)';
    default:
      return 'oklch(55% 0.18 145)';
  }
}

/** Seconds between semester start and end — one full "breath". */
export function semesterDurationSeconds(): number {
  return (SEMESTER_END.getTime() - SEMESTER_START.getTime()) / MS_PER_SECOND;
}

/** Negative delay (seconds) so the breath starts at today's progress. */
export function semesterDelaySeconds(): number {
  const now = Date.now();
  const clamped = Math.max(SEMESTER_START.getTime(), Math.min(now, SEMESTER_END.getTime()));
  const elapsed = (clamped - SEMESTER_START.getTime()) / MS_PER_SECOND;
  return -elapsed;
}

/**
 * Today's column offset on the timetable grid, centered on Wednesday:
 * (dayOfWeek - 3) × 60px.
 */
export function todayGridColumnPx(): number {
  return (new Date().getDay() - 3) * 60;
}

import { Session, TimetableSlot } from './types';
import { TIMETABLE, SEMESTER_START, SEMESTER_END } from './config';

/**
 * Generate all sessions for the semester based on the weekly timetable.
 */
export function generateSemesterSessions(): Session[] {
  const sessions: Session[] = [];
  const start = new Date(SEMESTER_START);
  const end = new Date(SEMESTER_END);

  // Iterate over every day in the semester
  const current = new Date(start);
  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat

    // Get all slots for this day
    const daySlots = TIMETABLE.filter(slot => slot.day === dayOfWeek);

    for (const slot of daySlots) {
      const dateStr = formatDate(current);
      const id = `${dateStr}-${slot.subjectCode}-${slot.startTime}`;

      sessions.push({
        id,
        subjectCode: slot.subjectCode,
        date: dateStr,
        day: dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        classType: slot.classType,
        status: 'UNMARKED',
        isExtra: false,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return sessions;
}

/**
 * Format a Date to "YYYY-MM-DD".
 */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Parse "YYYY-MM-DD" into Date.
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Get today's weekday name.
 */
export function getTodaySlots(): TimetableSlot[] {
  const today = new Date().getDay();
  return TIMETABLE.filter(slot => slot.day === today);
}

/**
 * Get sessions for today.
 */
export function getTodaySessions(sessions: Session[]): Session[] {
  const todayStr = formatDate(new Date());
  return sessions
    .filter(s => s.date === todayStr)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));
}

/**
 * Get sessions for a specific subject, sorted by date and time.
 */
export function getSubjectSessions(sessions: Session[], subjectCode: string): Session[] {
  return sessions
    .filter(s => s.subjectCode === subjectCode)
    .sort((a, b) => {
      const dateCmp = a.date.localeCompare(b.date);
      if (dateCmp !== 0) return dateCmp;
      return a.startTime.localeCompare(b.startTime);
    });
}

/**
 * Create a new extra session.
 */
export function createExtraSession(
  subjectCode: string,
  date: string,
  startTime: string,
  endTime: string,
  classType: 'Lecture' | 'Tutorial' | 'Lab'
): Session {
  const d = parseDate(date);
  return {
    id: `extra-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    subjectCode,
    date,
    day: d.getDay(),
    startTime,
    endTime,
    classType,
    status: 'UNMARKED',
    isExtra: true,
  };
}

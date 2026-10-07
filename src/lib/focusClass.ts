import { Session } from './types';
import { timeUtils } from './timeUtils';

export const timeInMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function getFocusClass(sessions: Session[], now: Date) {
  const today = timeUtils.getLocalISODate(now);
  const minutes = now.getHours() * 60 + now.getMinutes();
  const available = sessions.filter(s => s.status !== 'CANCELLED')
    .sort((a, b) => a.date.localeCompare(b.date) || timeInMinutes(a.startTime) - timeInMinutes(b.startTime));
  const todays = available.filter(s => s.date === today);
  const current = todays.find(s => minutes >= timeInMinutes(s.startTime) && minutes < timeInMinutes(s.endTime));
  if (current) {
    const start = timeInMinutes(current.startTime), end = timeInMinutes(current.endTime);
    return { session: current, kind: 'current' as const, label: 'Happening now', timing: `${end - minutes} min left`, progress: (minutes - start) / Math.max(1, end - start) * 100, canMark: true };
  }
  const upcoming = todays.find(s => timeInMinutes(s.startTime) > minutes);
  if (upcoming) {
    const wait = timeInMinutes(upcoming.startTime) - minutes;
    const timing = wait < 60 ? `In ${wait} min` : `In ${Math.floor(wait / 60)}h${wait % 60 ? ` ${wait % 60}m` : ''}`;
    return { session: upcoming, kind: 'upcoming' as const, label: 'Up next', timing, progress: 0, canMark: true };
  }
  const unmarked = todays.find(s => s.status === 'UNMARKED');
  if (unmarked) return { session: unmarked, kind: 'catchup' as const, label: 'Still to mark', timing: 'Earlier today', progress: 100, canMark: true };
  const next = available.find(s => s.date > today);
  if (next) {
    const date = new Date(`${next.date}T12:00:00`);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timing = next.date === timeUtils.getLocalISODate(tomorrow) ? 'Tomorrow' : date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    return { session: next, kind: 'next-day' as const, label: 'Your next class', timing, progress: 0, canMark: false };
  }
  return null;
}

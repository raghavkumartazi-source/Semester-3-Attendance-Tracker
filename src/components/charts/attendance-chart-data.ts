import { Session } from '@/lib/types';
import { timeUtils } from '@/lib/timeUtils';

export interface AttendanceDay {
  date: string;
  present: number;
  absent: number;
  totalPresent: number;
  totalAbsent: number;
  percentage: number;
}

export const chartDate = (date: string) => new Date(`${date}T12:00:00`);
export const dateLabel = (date: string, full = false) => chartDate(date).toLocaleDateString('en-IN', full
  ? { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }
  : { day: 'numeric', month: 'short' });

export function offsetDate(date: string, days: number) {
  const value = chartDate(date);
  value.setDate(value.getDate() + days);
  return timeUtils.getLocalISODate(value);
}

/** Build the cumulative history before applying a display range. */
export function recordedAttendanceHistory(sessions: Session[], today: string): AttendanceDay[] {
  const byDate = new Map<string, { present: number; absent: number }>();
  for (const session of sessions) {
    if (session.date > today || (session.status !== 'PRESENT' && session.status !== 'ABSENT')) continue;
    const day = byDate.get(session.date) ?? { present: 0, absent: 0 };
    day[session.status === 'PRESENT' ? 'present' : 'absent'] += 1;
    byDate.set(session.date, day);
  }
  let totalPresent = 0;
  let totalAbsent = 0;
  return [...byDate.keys()].sort().map(date => {
    const day = byDate.get(date)!;
    totalPresent += day.present;
    totalAbsent += day.absent;
    return { date, ...day, totalPresent, totalAbsent, percentage: totalPresent / (totalPresent + totalAbsent) * 100 };
  });
}

export function attendanceInRange(history: AttendanceDay[], today: string, days: number | null) {
  return days === null ? history : history.filter(day => day.date >= offsetDate(today, 1 - days));
}

export interface ChartPoint { x: number; y: number }

/** A stable vertex count lets a range change morph instead of replaying the reveal. */
export function trendGeometry(data: AttendanceDay[], start: string, end: string) {
  const left = 34, right = 394, top = 20, bottom = 176;
  const startTime = chartDate(start).getTime();
  const duration = Math.max(86400000, chartDate(end).getTime() - startTime);
  const points = data.map(day => ({
    x: left + (chartDate(day.date).getTime() - startTime) / duration * (right - left),
    y: bottom - day.percentage / 100 * (bottom - top),
  }));
  if (!points.length) return { line: '', area: '', points };
  const slopes = points.slice(1).map((point, index) => (point.y - points[index].y) / (point.x - points[index].x));
  const tangents = points.map((_, index) => {
    if (points.length < 2) return 0;
    if (index === 0) return slopes[0];
    if (index === points.length - 1) return slopes.at(-1)!;
    const before = slopes[index - 1], after = slopes[index];
    return before * after <= 0 ? 0 : 2 / (1 / before + 1 / after);
  });
  const vertices = Array.from({ length: 72 }, (_, index) => {
    const x = points[0].x + (points.at(-1)!.x - points[0].x) * index / 71;
    let segment = 0;
    while (segment < points.length - 2 && points[segment + 1].x < x) segment++;
    const from = points[segment];
    const to = points[Math.min(segment + 1, points.length - 1)];
    const t = to.x === from.x ? 0 : (x - from.x) / (to.x - from.x);
    const width = to.x - from.x;
    const y = (2 * t ** 3 - 3 * t ** 2 + 1) * from.y
      + (t ** 3 - 2 * t ** 2 + t) * width * tangents[segment]
      + (-2 * t ** 3 + 3 * t ** 2) * to.y
      + (t ** 3 - t ** 2) * width * tangents[Math.min(segment + 1, points.length - 1)];
    return { x, y: Math.max(Math.min(from.y, to.y), Math.min(Math.max(from.y, to.y), y)) };
  });
  const line = vertices.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  return { line, area: `${line} L ${points.at(-1)!.x.toFixed(2)} ${bottom} L ${points[0].x.toFixed(2)} ${bottom} Z`, points };
}

export interface HeatmapDay {
  date: string;
  column: number;
  row: number;
  inRange: boolean;
  present: number;
  absent: number;
  cancelled: number;
  unmarked: number;
  level: number;
}

export function attendanceHeatmap(sessions: Session[], today: string, days: number) {
  const start = offsetDate(today, 1 - days);
  const first = offsetDate(start, -((chartDate(start).getDay() + 6) % 7));
  const columns = Math.ceil((Math.round((chartDate(today).getTime() - chartDate(first).getTime()) / 86400000) + 1) / 7);
  const byDate = new Map<string, Session[]>();
  for (const session of sessions) {
    if (session.date < start || session.date > today) continue;
    const existing = byDate.get(session.date) ?? [];
    existing.push(session);
    byDate.set(session.date, existing);
  }
  const cells: HeatmapDay[] = [];
  for (let column = 0; column < columns; column++) {
    for (let row = 0; row < 7; row++) {
      const date = offsetDate(first, column * 7 + row);
      const day = byDate.get(date) ?? [];
      const present = day.filter(session => session.status === 'PRESENT').length;
      const absent = day.filter(session => session.status === 'ABSENT').length;
      cells.push({ date, column, row, inRange: date >= start && date <= today,
        present, absent,
        cancelled: day.filter(session => session.status === 'CANCELLED').length,
        unmarked: day.filter(session => session.status === 'UNMARKED').length,
        level: !present && !absent ? 0 : present === 0 ? 1 : absent === 0 ? 4 : present / (present + absent) >= .5 ? 3 : 2,
      });
    }
  }
  return { cells, columns, start, first };
}

import { describe, expect, it } from 'vitest';
import { Session } from '@/lib/types';
import { attendanceHeatmap, attendanceInRange, chartDate, offsetDate, recordedAttendanceHistory, trendGeometry } from './attendance-chart-data';

const session = (date: string, status: Session['status'], id = `${date}-${status}`): Session => ({ id, date, status, subjectCode: 'CS201', day: chartDate(date).getDay(), startTime: '09:00', endTime: '10:00', classType: 'Lecture', isExtra: false });

describe('recorded attendance chart data', () => {
  it('excludes future, cancelled and unmarked sessions from history and its denominator', () => {
    const history = recordedAttendanceHistory([
      session('2026-10-01', 'PRESENT'), session('2026-10-02', 'ABSENT'),
      session('2026-10-03', 'CANCELLED'), session('2026-10-04', 'UNMARKED'),
      session('2026-10-10', 'PRESENT'), session('2026-10-10', 'ABSENT'),
    ], '2026-10-09');
    expect(history.map(day => day.date)).toEqual(['2026-10-01', '2026-10-02']);
    expect(history.at(-1)).toMatchObject({ totalPresent: 1, totalAbsent: 1, percentage: 50 });
  });

  it('keeps the complete cumulative history when a recent display window is selected', () => {
    const history = recordedAttendanceHistory([
      session('2026-09-01', 'PRESENT'), session('2026-09-02', 'ABSENT'),
      session('2026-10-08', 'PRESENT'), session('2026-10-08', 'PRESENT', 'second'),
    ], '2026-10-09');
    const visible = attendanceInRange(history, '2026-10-09', 7);
    expect(visible).toHaveLength(1);
    expect(visible[0]).toMatchObject({ present: 2, absent: 0, totalPresent: 3, totalAbsent: 1, percentage: 75 });
  });

  it('does not create an attendance percentage before anything is marked', () => {
    expect(recordedAttendanceHistory([session('2026-10-01', 'CANCELLED'), session('2026-10-02', 'UNMARKED')], '2026-10-09')).toEqual([]);
  });

  it('builds a Monday-first calendar with hidden padding and exactly the requested date range', () => {
    const { cells, columns, start } = attendanceHeatmap([], '2026-10-09', 30);
    expect(cells).toHaveLength(columns * 7);
    expect(chartDate(cells[0].date).getDay()).toBe(1);
    expect(cells.filter(day => day.inRange)).toHaveLength(30);
    expect(cells.find(day => day.inRange)?.date).toBe(start);
    expect(cells.filter(day => day.inRange).at(-1)?.date).toBe('2026-10-09');
  });

  it('maps real attendance shares to calendar levels while excluding cancellation from that share', () => {
    const { cells } = attendanceHeatmap([
      session('2026-10-07', 'PRESENT'), session('2026-10-07', 'CANCELLED'),
      session('2026-10-08', 'PRESENT'), session('2026-10-08', 'ABSENT'),
      session('2026-10-09', 'ABSENT'), session('2026-10-09', 'UNMARKED'),
      session('2026-10-10', 'PRESENT'),
    ], '2026-10-09', 7);
    expect(cells.find(day => day.date === '2026-10-07')).toMatchObject({ level: 4, present: 1, cancelled: 1 });
    expect(cells.find(day => day.date === '2026-10-08')).toMatchObject({ level: 3, present: 1, absent: 1 });
    expect(cells.find(day => day.date === '2026-10-09')).toMatchObject({ level: 1, absent: 1, unmarked: 1 });
    expect(cells.find(day => day.date === '2026-10-10')).toMatchObject({ inRange: false, present: 0 });
  });

  it('uses a stable morph path and keeps visual interpolation inside the measured percentages', () => {
    const history = recordedAttendanceHistory([session('2026-10-01', 'PRESENT'), session('2026-10-02', 'ABSENT'), session('2026-10-05', 'PRESENT')], '2026-10-09');
    const geometry = trendGeometry(history, '2026-10-01', '2026-10-09');
    const single = trendGeometry(history.slice(-1), '2026-10-01', '2026-10-09');
    expect(geometry.line.match(/[ML]/g)).toHaveLength(72);
    expect(single.line.match(/[ML]/g)).toHaveLength(72);
    const values = [...geometry.line.matchAll(/[ML] [\d.]+ ([\d.]+)/g)].map(match => Number(match[1]));
    expect(Math.min(...values)).toBeGreaterThanOrEqual(20);
    expect(Math.max(...values)).toBeLessThanOrEqual(98);
    expect(geometry.points).toHaveLength(history.length);
  });

  it('offsets local dates across month boundaries without UTC conversion', () => {
    expect(offsetDate('2026-10-01', -1)).toBe('2026-09-30');
    expect(offsetDate('2026-10-31', 1)).toBe('2026-11-01');
  });
});

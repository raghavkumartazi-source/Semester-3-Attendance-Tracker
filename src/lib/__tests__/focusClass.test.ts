import { describe, expect, it } from 'vitest';
import { getFocusClass } from '../focusClass';
import { Session } from '../types';

const session = (id: string, start: string, end: string, overrides: Partial<Session> = {}): Session => ({
  id, subjectCode: 'EC-201', date: '2026-10-07', day: 3, startTime: start, endTime: end,
  classType: 'Lecture', status: 'UNMARKED', isExtra: false, ...overrides,
});

describe('daily focus selection', () => {
  it('prioritizes the current class and its real end time, including extra classes', () => {
    const current = session('extra', '09:15', '10:05', { isExtra: true });
    const result = getFocusClass([session('later', '11:00', '11:55'), current], new Date('2026-10-07T09:45:00'));
    expect(result?.session.id).toBe('extra');
    expect(result?.timing).toBe('20 min left');
    expect(result?.progress).toBe(60);
  });

  it('moves to the next class at the exact end boundary', () => {
    const result = getFocusClass([session('first', '09:00', '09:55'), session('second', '10:00', '10:55')], new Date('2026-10-07T09:55:00'));
    expect(result?.session.id).toBe('second');
    expect(result?.timing).toBe('In 5 min');
  });

  it('sorts by hours and minutes and skips cancelled classes', () => {
    const result = getFocusClass([session('late', '09:45', '10:15'), session('cancelled', '09:00', '09:30', { status: 'CANCELLED' }), session('early', '09:15', '09:40')], new Date('2026-10-07T08:00:00'));
    expect(result?.session.id).toBe('early');
  });

  it('offers unmarked classes after the day ends and advances when recorded', () => {
    const first = session('first', '08:00', '08:55');
    const second = session('second', '09:00', '09:55');
    const now = new Date('2026-10-07T18:00:00');
    expect(getFocusClass([first, second], now)?.kind).toBe('catchup');
    expect(getFocusClass([{ ...first, status: 'PRESENT' }, second], now)?.session.id).toBe('second');
  });

  it('shows the next scheduled day without attendance controls for future dates', () => {
    const result = getFocusClass([session('tomorrow', '08:00', '08:55', { date: '2026-10-08' })], new Date('2026-10-07T18:00:00'));
    expect(result?.timing).toBe('Tomorrow');
    expect(result?.canMark).toBe(false);
  });

  it('returns a free-day state at the end of the timetable', () => {
    expect(getFocusClass([session('past', '08:00', '08:55', { status: 'PRESENT' })], new Date('2026-10-07T18:00:00'))).toBeNull();
  });
});

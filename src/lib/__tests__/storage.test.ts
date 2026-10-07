import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { storage } from '../storage';
import { generateSemesterSessions } from '../sessions';

let dom: JSDOM;
beforeEach(() => {
  dom = new JSDOM('', { url: 'http://localhost/' });
  vi.stubGlobal('localStorage', dom.window.localStorage);
  localStorage.clear();
});
afterEach(() => {
  vi.unstubAllGlobals();
  dom.window.close();
});

describe('attendance persistence', () => {
  it('keeps edit timestamps when the generated timetable is rebuilt', () => {
    const [first] = generateSemesterSessions();
    storage.save([{ ...first, status: 'ABSENT', updatedAt: '2026-10-07T08:00:00.000Z' }]);
    expect(storage.load().find(s => s.id === first.id)).toMatchObject({ status: 'ABSENT', updatedAt: '2026-10-07T08:00:00.000Z' });
  });

  it('preserves a timestamped undo across reloads', () => {
    const [first] = generateSemesterSessions();
    storage.save([{ ...first, status: 'UNMARKED', updatedAt: '2026-10-07T09:00:00.000Z' }]);
    expect(storage.load().find(s => s.id === first.id)).toMatchObject({ status: 'UNMARKED', updatedAt: '2026-10-07T09:00:00.000Z' });
  });

  it('keeps a recoverable copy when saved JSON cannot be read', () => {
    localStorage.setItem('attendance-tracker-v1', '{broken existing data');
    expect(storage.load().length).toBeGreaterThan(0);
    const recoveryKey = Object.keys(localStorage).find(k => k.startsWith('attendance-tracker-v1-recovery-'));
    expect(recoveryKey).toBeDefined();
    expect(localStorage.getItem(recoveryKey!)).toBe('{broken existing data');
  });
});

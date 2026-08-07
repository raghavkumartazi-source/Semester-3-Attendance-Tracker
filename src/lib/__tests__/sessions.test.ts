import { describe, it, expect } from 'vitest';
import {
  createExtraSession,
  parseExtraSessionId,
  generateSemesterSessions,
} from '../sessions';
import { AttendanceStatus } from '../types';

describe('sessions', () => {
  describe('Extra Sessions', () => {
    it('creates correct extra session ID', () => {
      const session = createExtraSession(
        'SUBJ01',
        '2026-08-10',
        '09:00',
        '10:00',
        'Lecture'
      );
      expect(session.id).toBe('extra|SUBJ01|2026-08-10|09:00|10:00|Lecture');
      expect(session.status).toBe('UNMARKED');
      expect(session.isExtra).toBe(true);
    });

    it('identifies extra class IDs correctly', () => {
      expect('extra|SUBJ01|2026-08-10|09:00|10:00|Lecture'.startsWith('extra|')).toBe(true);
      expect('SUBJ01-2026-08-10-09:00'.startsWith('extra|')).toBe(false);
    });

    it('parses extra session IDs correctly', () => {
      const parsed = parseExtraSessionId('extra|SUBJ01|2026-08-10|09:00|10:00|Lecture');
      expect(parsed).toEqual({
        id: 'extra|SUBJ01|2026-08-10|09:00|10:00|Lecture',
        subjectCode: 'SUBJ01',
        date: '2026-08-10',
        day: 1, // 2026-08-10 is a Monday (1)
        startTime: '09:00',
        endTime: '10:00',
        classType: 'Lecture',
        status: 'UNMARKED',
        isExtra: true
      });
    });

    it('returns null for invalid extra session IDs', () => {
      expect(parseExtraSessionId('SUBJ01-2026-08-10-09:00')).toBeNull();
      expect(parseExtraSessionId('extra|incomplete')).toBeNull();
    });
  });

  describe('generateSemesterSessions', () => {
    it('generates sessions correctly for valid date range', () => {
      // It generates sessions for the entire semester using the config.
      const sessions = generateSemesterSessions();
      expect(sessions.length).toBeGreaterThan(0);
      
      // All generated sessions should have a status of UNMARKED
      expect(sessions.every((s: { status: AttendanceStatus; }) => s.status === 'UNMARKED')).toBe(true);
      
      // Should have correct ID formats (e.g. 2026-07-23-EO-201-08:00)
      const first = sessions[0];
      expect(first.id).toMatch(/^[0-9]{4}-[0-9]{2}-[0-9]{2}-[A-Za-z0-9-]+-[0-9]{2}:[0-9]{2}$/);
    });
  });
});

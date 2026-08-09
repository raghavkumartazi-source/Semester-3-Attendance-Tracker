import { Session } from './types';
import { generateSemesterSessions } from './sessions';

const STORAGE_KEY = 'attendance-tracker-v1';

export interface StorageData {
  sessions: Session[];
  version: number;
}

/**
 * Clean storage abstraction layer.
 * All localStorage interaction is confined here.
 */
export const storage = {
  /**
   * Load sessions from localStorage.
   * On first load, generates the semester schedule.
   */
  load(): Session[] {
    if (typeof window === 'undefined') return [];
    
    const freshSessions = generateSemesterSessions();
    
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.save(freshSessions);
        return freshSessions;
      }
      
      const data: StorageData = JSON.parse(raw);
      const savedSessions = data.sessions || [];
      
      // Map existing non-unmarked statuses and collect extra sessions
      const savedStatusMap = new Map<string, Session['status']>();
      const extraSessions: Session[] = [];
      
      for (const s of savedSessions) {
        if (s.isExtra) {
          extraSessions.push(s);
        } else if (s.status && s.status !== 'UNMARKED') {
          savedStatusMap.set(s.id, s.status);
        }
      }
      
      // Migration v1 → v2: Remap old timetable session IDs to new ones.
      // The Aug 2026 timetable update changed slot times for some subjects,
      // which changed session IDs and orphaned existing attendance marks.
      // This one-time migration translates old IDs to new IDs.
      const needsMigration = !data.version || data.version < 2;
      if (needsMigration) {
        // [dayOfWeek, oldSubject-Time, newSubject-Time]
        const REMAP_TABLE: [number, string, string][] = [
          [2, 'MO-201-09:00', 'MO-201-12:00'],   // Tue: MO-201 moved 09:00→12:00
          [2, 'EC-202-14:30', 'EC-202-17:30'],   // Tue: EC-202 moved 14:30→17:30
          [3, 'MO-201-09:00', 'MO-201-12:00'],   // Wed: MO-201 moved 09:00→12:00
          [3, 'EC-202-14:30', 'EC-202-17:30'],   // Wed: EC-202 moved 14:30→17:30
          [5, 'MO-201-09:00', 'MO-201-12:00'],   // Fri: MO-201 moved 09:00→12:00
          [5, 'EC-202-14:30', 'EC-202-17:30'],   // Fri: EC-202 moved 14:30→17:30
        ];

        const entriesToAdd: [string, Session['status']][] = [];
        const entriesToRemove: string[] = [];

        for (const [oldId, status] of savedStatusMap) {
          const datePart = oldId.substring(0, 10); // YYYY-MM-DD
          const suffix = oldId.substring(11);       // subjectCode-startTime
          const [y, m, d] = datePart.split('-').map(Number);
          const dayOfWeek = new Date(y, m - 1, d).getDay();

          for (const [remapDay, oldSuffix, newSuffix] of REMAP_TABLE) {
            if (dayOfWeek === remapDay && suffix === oldSuffix) {
              const newId = `${datePart}-${newSuffix}`;
              if (!savedStatusMap.has(newId)) {
                entriesToAdd.push([newId, status]);
                entriesToRemove.push(oldId);
              }
              break;
            }
          }
        }

        for (const [newId, status] of entriesToAdd) {
          savedStatusMap.set(newId, status);
        }
        for (const oldId of entriesToRemove) {
          savedStatusMap.delete(oldId);
        }
      }

      // Merge into fresh timetable
      const mergedSessions = freshSessions.map(session => {
        const savedStatus = savedStatusMap.get(session.id);
        if (savedStatus) {
          return { ...session, status: savedStatus };
        }
        return session;
      });
      
      const result = [...mergedSessions, ...extraSessions];

      // Persist immediately after migration to bump version and prevent re-runs
      if (needsMigration) {
        this.save(result);
      }

      return result;
    } catch {
      this.save(freshSessions);
      return freshSessions;
    }
  },

  /**
   * Save sessions to localStorage.
   */
  save(sessions: Session[]): void {
    if (typeof window === 'undefined') return;
    
    const data: StorageData = {
      sessions,
      version: 2,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  },

  /**
   * Reset all attendance data.
   */
  reset(): Session[] {
    const sessions = generateSemesterSessions();
    this.save(sessions);
    return sessions;
  },

  /**
   * Export data as JSON string.
   */
  exportData(sessions: Session[]): string {
    const data: StorageData = {
      sessions,
      version: 2,
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import data from JSON string.
   */
  importData(json: string): Session[] | null {
    try {
      const data: StorageData = JSON.parse(json);
      if (!data.sessions || !Array.isArray(data.sessions)) return null;
      this.save(data.sessions);
      return data.sessions;
    } catch {
      return null;
    }
  },
};

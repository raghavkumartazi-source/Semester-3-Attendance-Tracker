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
      
      // Merge into fresh timetable
      const mergedSessions = freshSessions.map(session => {
        const savedStatus = savedStatusMap.get(session.id);
        if (savedStatus) {
          return { ...session, status: savedStatus };
        }
        return session;
      });
      
      return [...mergedSessions, ...extraSessions];
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
      version: 1,
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
      version: 1,
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

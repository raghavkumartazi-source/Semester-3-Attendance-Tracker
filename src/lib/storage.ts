import { accountStorageKey } from './accountStorage';
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
export function createStorage(ownerId: string | null) {
const STORAGE_KEY_SCOPED = accountStorageKey(STORAGE_KEY, ownerId);
const storage = {
  /**
   * Load sessions from localStorage.
   * On first load, generates the semester schedule.
   */
  load(): Session[] {
    if (typeof window === 'undefined') return [];
    
    const freshSessions = generateSemesterSessions();
    
    try {
      const raw = localStorage.getItem(STORAGE_KEY_SCOPED);
      if (!raw) {
        this.save(freshSessions);
        return freshSessions;
      }
      
      const data: StorageData = JSON.parse(raw);
      const savedSessions = data.sessions || [];
      
      const saved = new Map(savedSessions.map(session => [session.id, session]));
      const extraSessions = savedSessions.filter(session => session.isExtra);
      const mergedSessions = freshSessions.map(session => {
        const previous = saved.get(session.id);
        return previous ? { ...session, status: previous.status, updatedAt: previous.updatedAt } : session;
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
      version: 2,
    };
    localStorage.setItem(STORAGE_KEY_SCOPED, JSON.stringify(data));
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

return storage;
}

export const storage = createStorage(null);

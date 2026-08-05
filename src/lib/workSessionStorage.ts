import { WorkSession } from './types';

const STORAGE_KEY = 'semester_os_work_sessions';

export const workSessionStorage = {
  load: (): WorkSession[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load sessions from local storage', e);
      return [];
    }
  },

  save: (sessions: WorkSession[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.error('Failed to save sessions to local storage', e);
    }
  },

  reset: (): WorkSession[] => {
    if (typeof window === 'undefined') return [];
    localStorage.removeItem(STORAGE_KEY);
    return [];
  },
  
  exportData: (sessions: WorkSession[]): string => {
    return JSON.stringify({
      version: 1,
      type: 'semester_os_sessions',
      exportDate: new Date().toISOString(),
      sessions,
    }, null, 2);
  },

  importData: (jsonString: string): WorkSession[] | null => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.type === 'semester_os_sessions' && Array.isArray(parsed.sessions)) {
        workSessionStorage.save(parsed.sessions);
        return parsed.sessions;
      }
      return null;
    } catch (e) {
      console.error('Invalid session backup file', e);
      return null;
    }
  }
};

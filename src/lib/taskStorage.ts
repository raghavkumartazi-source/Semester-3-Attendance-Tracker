import { Task } from './types';

const STORAGE_KEY = 'semester_os_tasks';

export const taskStorage = {
  load: (): Task[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load tasks from local storage', e);
      return [];
    }
  },

  save: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to local storage', e);
    }
  },

  reset: (): Task[] => {
    if (typeof window === 'undefined') return [];
    localStorage.removeItem(STORAGE_KEY);
    return [];
  },
  
  exportData: (tasks: Task[]): string => {
    return JSON.stringify({
      version: 1,
      type: 'semester_os_tasks',
      exportDate: new Date().toISOString(),
      tasks,
    }, null, 2);
  },

  importData: (jsonString: string): Task[] | null => {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed.type === 'semester_os_tasks' && Array.isArray(parsed.tasks)) {
        taskStorage.save(parsed.tasks);
        return parsed.tasks;
      }
      return null;
    } catch (e) {
      console.error('Invalid task backup file', e);
      return null;
    }
  }
};

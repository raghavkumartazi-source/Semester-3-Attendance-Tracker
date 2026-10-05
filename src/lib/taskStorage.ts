import { accountStorageKey } from './accountStorage';
import { Task } from './types';

const STORAGE_KEY = 'semester_os_tasks';

export function createTaskStorage(ownerId: string | null) {
const STORAGE_KEY_SCOPED = accountStorageKey(STORAGE_KEY, ownerId);
const taskStorage = {
  load: (): Task[] => {
    if (typeof window === 'undefined') return [];
    try {
      const data = localStorage.getItem(STORAGE_KEY_SCOPED);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load tasks from local storage', e);
      return [];
    }
  },

  save: (tasks: Task[]): void => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY_SCOPED, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to local storage', e);
    }
  },

  reset: (): Task[] => {
    if (typeof window === 'undefined') return [];
    localStorage.removeItem(STORAGE_KEY_SCOPED);
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

return taskStorage;
}

export const taskStorage = createTaskStorage(null);

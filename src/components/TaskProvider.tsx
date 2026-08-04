'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task } from '@/lib/types';
import { taskStorage } from '@/lib/taskStorage';
import { taskSync } from '@/lib/taskSync';
import { useAttendance } from './AttendanceProvider';

interface TaskContextType {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  syncStatus: 'Synced' | 'Syncing' | 'Offline' | 'Error';
  syncError?: string;
  isLoaded: boolean;
}

const TaskContext = createContext<TaskContextType | null>(null);

export function TaskProvider({ children }: { children: ReactNode }) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { user, isLoaded: authLoaded } = useAttendance();
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Offline' | 'Error'>('Offline');
  const [syncError, setSyncError] = useState<string>('');

  useEffect(() => {
    const loaded = taskStorage.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTasks(loaded);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoaded(true);
  }, []);

  const performFullSync = useCallback(async (currentTasks: Task[]) => {
    if (!user) return;
    setSyncStatus('Syncing');
    
    try {
      const cloudTasks = await taskSync.fetchCloudTasks(user.id);
      
      let changed = false;
      const newTasks = [...currentTasks];
      const cloudMap = new Map<string, Task>();
      cloudTasks.forEach(cr => cloudMap.set(cr.id, cr));
      
      for (let i = 0; i < newTasks.length; i++) {
        const local = newTasks[i];
        const cloud = cloudMap.get(local.id);
        
        if (cloud) {
          const cloudDate = new Date(cloud.updated_at).getTime();
          const localDate = new Date(local.updated_at).getTime();
          
          if (cloudDate > localDate) {
            newTasks[i] = { ...cloud };
            changed = true;
          }
        }
      }
      
      cloudTasks.forEach(cloud => {
        if (!newTasks.find(t => t.id === cloud.id)) {
          newTasks.push({ ...cloud });
          changed = true;
        }
      });
      
      if (changed) {
        taskStorage.save(newTasks);
        setTasks(newTasks);
      }
      
      const tasksToUpload = newTasks.filter(s => {
        const cloud = cloudMap.get(s.id);
        if (!cloud) return true; 
        const cloudDate = new Date(cloud.updated_at).getTime();
        const localDate = new Date(s.updated_at).getTime();
        return localDate > cloudDate;
      });
      
      if (tasksToUpload.length > 0) {
        await taskSync.uploadLocalTasks(user.id, tasksToUpload);
      }
      
      setSyncStatus('Synced');
      setSyncError('');
    } catch (e) {
      console.warn('Full sync failed:', e);
      const error = e as { message?: string };
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setSyncStatus('Error');
        setSyncError(error?.message || 'Unknown database error');
      } else {
        setSyncStatus('Offline');
      }
    }
  }, [user]);

  useEffect(() => {
    if (user && isLoaded && authLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      performFullSync(tasks);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded, authLoaded]); 

  useEffect(() => {
    const handleFocus = () => {
      if (user && isLoaded) performFullSync(tasks);
    };
    const handleOnline = () => {
      if (user && isLoaded) performFullSync(tasks);
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setSyncStatus('Offline'));
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => setSyncStatus('Offline'));
    };
  }, [user, isLoaded, tasks, performFullSync]);

  const addTask = useCallback((taskPayload: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...taskPayload,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    
    setTasks(prev => {
      const updated = [...prev, newTask];
      taskStorage.save(updated);
      
      if (user) {
        setSyncStatus('Syncing');
        taskSync.syncSingleTask(user.id, newTask).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch((e) => {
          const error = e as { message?: string };
          setSyncStatus('Error');
          setSyncError(error?.message || 'Insert failed');
        });
      }
      return updated;
    });
  }, [user]);

  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    const now = new Date().toISOString();
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, ...updates, updated_at: now } : t
      );
      taskStorage.save(updated);
      
      const updatedTask = updated.find(t => t.id === taskId);
      if (user && updatedTask) {
        setSyncStatus('Syncing');
        taskSync.syncSingleTask(user.id, updatedTask).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch((e) => {
          const error = e as { message?: string };
          setSyncStatus('Error');
          setSyncError(error?.message || 'Update failed');
        });
      }
      return updated;
    });
  }, [user]);

  const deleteTask = useCallback((taskId: string) => {
    const now = new Date().toISOString();
    setTasks(prev => {
      const updated = prev.map(t =>
        t.id === taskId ? { ...t, deleted_at: now, updated_at: now } : t
      );
      taskStorage.save(updated);
      
      const updatedTask = updated.find(t => t.id === taskId);
      if (user && updatedTask) {
        setSyncStatus('Syncing');
        taskSync.syncSingleTask(user.id, updatedTask).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch((e) => {
          const error = e as { message?: string };
          setSyncStatus('Error');
          setSyncError(error?.message || 'Delete sync failed');
        });
      }
      return updated;
    });
  }, [user]);

  return (
    <TaskContext.Provider value={{
      tasks: tasks.filter(t => !t.deleted_at), // hide tombstones
      addTask,
      updateTask,
      deleteTask,
      syncStatus,
      syncError,
      isLoaded
    }}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within TaskProvider');
  return ctx;
}

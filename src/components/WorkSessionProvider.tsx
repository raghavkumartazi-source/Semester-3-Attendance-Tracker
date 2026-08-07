'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { WorkSession } from '@/lib/types';
import { workSessionStorage } from '@/lib/workSessionStorage';
import { workSessionSync } from '@/lib/workSessionSync';
import { useAttendance } from './AttendanceProvider';

interface SessionContextType {
  sessions: WorkSession[];
  addSession: (session: Omit<WorkSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => void;
  updateSession: (sessionId: string, updates: Partial<WorkSession>) => void;
  deleteSession: (sessionId: string) => void;
  syncStatus: 'Synced' | 'Syncing' | 'Offline' | 'Error';
  syncError?: string;
  isLoaded: boolean;
  bulkAddSessions: (newSessions: Omit<WorkSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[]) => Promise<void>;
}

const WorkSessionContext = createContext<SessionContextType | null>(null);

export function WorkSessionProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<WorkSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { user, isLoaded: authLoaded } = useAttendance();
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Offline' | 'Error'>('Offline');
  const [syncError, setSyncError] = useState<string>('');

  useEffect(() => {
    const loaded = workSessionStorage.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(loaded);
    setIsLoaded(true);
  }, []);

  const performFullSync = useCallback(async (currentSessions: WorkSession[]) => {
    if (!user) return;
    setSyncStatus('Syncing');
    
    try {
      const cloudSessions = await workSessionSync.fetchCloudSessions(user.id);
      
      let changed = false;
      const newSessions = [...currentSessions];
      const cloudMap = new Map<string, WorkSession>();
      cloudSessions.forEach(cr => cloudMap.set(cr.id, cr));
      
      for (let i = 0; i < newSessions.length; i++) {
        const local = newSessions[i];
        const cloud = cloudMap.get(local.id);
        
        if (cloud) {
          const cloudDate = new Date(cloud.updated_at).getTime();
          const localDate = new Date(local.updated_at).getTime();
          
          if (cloudDate > localDate) {
            newSessions[i] = { ...cloud };
            changed = true;
          }
        }
      }
      
      cloudSessions.forEach(cloud => {
        if (!newSessions.find(s => s.id === cloud.id)) {
          newSessions.push({ ...cloud });
          changed = true;
        }
      });
      
      if (changed) {
        workSessionStorage.save(newSessions);
        setSessions(newSessions);
      }
      
      const sessionsToUpload = newSessions.filter(s => {
        const cloud = cloudMap.get(s.id);
        if (!cloud) return true; 
        const cloudDate = new Date(cloud.updated_at).getTime();
        const localDate = new Date(s.updated_at).getTime();
        return localDate > cloudDate;
      });
      
      if (sessionsToUpload.length > 0) {
        await workSessionSync.uploadLocalSessions(user.id, sessionsToUpload);
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
      performFullSync(sessions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded, authLoaded]); 

  useEffect(() => {
    const handleFocus = () => {
      if (user && isLoaded) performFullSync(sessions);
    };
    const handleOnline = () => {
      if (user && isLoaded) performFullSync(sessions);
    };
    const handleOffline = () => setSyncStatus('Offline');
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isLoaded, sessions, performFullSync]);

  const addSession = useCallback((payload: Omit<WorkSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>) => {
    const now = new Date().toISOString();
    const newSession: WorkSession = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      deleted_at: null,
    };
    
    setSessions(prev => {
      const updated = [...prev, newSession];
      workSessionStorage.save(updated);
      
      if (user) {
        setSyncStatus('Syncing');
        workSessionSync.syncSingleSession(user.id, newSession).then(() => {
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

  const bulkAddSessions = useCallback(async (payloads: Omit<WorkSession, 'id' | 'created_at' | 'updated_at' | 'deleted_at'>[]): Promise<void> => {
    if (payloads.length === 0) return;
    
    // 1. Deduplicate within the incoming batch itself
    const uniquePayloads: typeof payloads = [];
    const seen = new Set<string>();
    for (const p of payloads) {
      const key = `${p.task_id}-${p.planned_start}-${p.planned_end}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniquePayloads.push(p);
      }
    }
    
    if (uniquePayloads.length === 0) return;

    return new Promise((resolve, reject) => {
      const now = new Date().toISOString();
      
      setSessions(prev => {
        // 2. Deduplicate against existing active sessions
        const actuallyNew = uniquePayloads.filter(p => {
          const isDuplicate = prev.some(s => 
            !s.deleted_at && 
            s.status !== 'CANCELLED' && 
            s.task_id === p.task_id && 
            s.planned_start === p.planned_start && 
            s.planned_end === p.planned_end
          );
          return !isDuplicate;
        });

        if (actuallyNew.length === 0) {
          resolve(); // Nothing new to add
          return prev;
        }

        const newSessions = actuallyNew.map(p => ({
          ...p,
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now,
          deleted_at: null,
        }));

        const updated = [...prev, ...newSessions];
        workSessionStorage.save(updated);
        
        if (user) {
          setSyncStatus('Syncing');
          workSessionSync.uploadLocalSessions(user.id, newSessions).then(() => {
            setSyncStatus('Synced');
            setSyncError('');
            resolve();
          }).catch((e) => {
            const error = e as { message?: string };
            setSyncStatus('Error');
            setSyncError(error?.message || 'Bulk insert failed');
            reject(new Error(error?.message || 'Bulk insert failed'));
          });
        } else {
          resolve();
        }
        
        return updated;
      });
    });
  }, [user]);

  const updateSession = useCallback((sessionId: string, updates: Partial<WorkSession>) => {
    const now = new Date().toISOString();
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === sessionId ? { ...s, ...updates, updated_at: now } : s
      );
      workSessionStorage.save(updated);
      
      const updatedSession = updated.find(s => s.id === sessionId);
      if (user && updatedSession) {
        setSyncStatus('Syncing');
        workSessionSync.syncSingleSession(user.id, updatedSession).then(() => {
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

  const deleteSession = useCallback((sessionId: string) => {
    const now = new Date().toISOString();
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === sessionId ? { ...s, deleted_at: now, updated_at: now } : s
      );
      workSessionStorage.save(updated);
      
      const updatedSession = updated.find(s => s.id === sessionId);
      if (user && updatedSession) {
        setSyncStatus('Syncing');
        workSessionSync.syncSingleSession(user.id, updatedSession).then(() => {
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
    <WorkSessionContext.Provider value={{
      sessions: sessions.filter(s => !s.deleted_at),
      addSession,
      updateSession,
      deleteSession,
      bulkAddSessions,
      syncStatus,
      syncError,
      isLoaded
    }}>
      {children}
    </WorkSessionContext.Provider>
  );
}

export function useWorkSessions() {
  const ctx = useContext(WorkSessionContext);
  if (!ctx) throw new Error('useWorkSessions must be used within WorkSessionProvider');
  return ctx;
}

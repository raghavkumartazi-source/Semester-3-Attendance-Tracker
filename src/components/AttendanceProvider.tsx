'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, AttendanceStatus } from '@/lib/types';
import { storage } from '@/lib/storage';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncRepo, CloudRecord } from '@/lib/sync';
import { parseExtraSessionId } from '@/lib/sessions';

interface AttendanceContextType {
  sessions: Session[];
  updateSessionStatus: (sessionId: string, status: AttendanceStatus) => void;
  addSession: (session: Session) => void;
  resetAll: (clearCloud?: boolean) => Promise<void>;
  exportData: () => string;
  importData: (json: string) => boolean;
  isLoaded: boolean;

  // Cloud Auth & Sync
  user: User | null;
  syncStatus: 'Synced' | 'Syncing' | 'Offline' | 'Error';
  syncError?: string;
  lastSynced?: Date;
  syncNow: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Offline' | 'Error'>('Offline');
  const [syncError, setSyncError] = useState<string>('');
  const [lastSynced, setLastSynced] = useState<Date | undefined>();

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const loaded = storage.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(loaded);
    setIsLoaded(true);
  }, []);

  // 2. Auth State Listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // 3. Full Sync Logic
  const performFullSync = useCallback(async (currentUser: User, currentSessions: Session[]) => {
    setSyncStatus('Syncing');
    
    try {
      const cloudRecords = await syncRepo.fetchCloudRecords(currentUser.id);
      
      let changed = false;
      const newSessions = [...currentSessions];
      const cloudMap = new Map<string, CloudRecord>();
      cloudRecords.forEach(cr => cloudMap.set(cr.session_id, cr));
      
      // Merge Cloud into Local
      const localIds = new Set(newSessions.map(s => s.id));
      for (let i = 0; i < newSessions.length; i++) {
        const local = newSessions[i];
        const cloud = cloudMap.get(local.id);
        
        if (cloud) {
          const cloudDate = new Date(cloud.updated_at).getTime();
          const localDate = local.updatedAt ? new Date(local.updatedAt).getTime() : 0;
          
          if (cloudDate > localDate) {
            newSessions[i] = { 
              ...local, 
              status: cloud.status as AttendanceStatus, 
              updatedAt: cloud.updated_at 
            };
            changed = true;
          }
        }
      }
      
      // Inject cloud extra sessions missing locally
      for (const cr of cloudRecords) {
        if (!localIds.has(cr.session_id) && cr.session_id.startsWith('extra|')) {
           const newExtra = parseExtraSessionId(cr.session_id);
           if (newExtra) {
             newExtra.status = cr.status as AttendanceStatus;
             newExtra.updatedAt = cr.updated_at;
             newSessions.push(newExtra);
             changed = true;
           }
        }
      }
      
      if (changed) {
        storage.save(newSessions);
        setSessions(newSessions);
      }
      
      // Upload Local records that are missing in cloud or newer
      const recordsToUpload = newSessions.filter(s => {
        if (s.status === 'UNMARKED') return false;
        const cloud = cloudMap.get(s.id);
        if (!cloud) return true; 
        const cloudDate = new Date(cloud.updated_at).getTime();
        const localDate = s.updatedAt ? new Date(s.updatedAt).getTime() : 0;
        return localDate > cloudDate;
      });
      
      if (recordsToUpload.length > 0) {
        await syncRepo.uploadLocalRecords(currentUser.id, recordsToUpload);
      }
      
      setSyncStatus('Synced');
      setSyncError('');
      setLastSynced(new Date());
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
  }, []);

  // 4. Trigger Full Sync on Login or Focus
  useEffect(() => {
    if (user && isLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      performFullSync(user, sessions);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded]); // Deliberately omitted 'sessions' to prevent loop on every local change

  useEffect(() => {
    const handleFocus = () => {
      if (user && isLoaded) performFullSync(user, sessions);
    };
    const handleOnline = () => {
      if (user && isLoaded) performFullSync(user, sessions);
    };
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', () => setSyncStatus('Offline'));
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', () => setSyncStatus('Offline'));
    };
  }, [user, isLoaded, sessions, performFullSync]);

  const syncNow = useCallback(async () => {
    if (user && isLoaded) {
      await performFullSync(user, sessions);
    }
  }, [user, isLoaded, sessions, performFullSync]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSyncStatus('Offline');
    setLastSynced(undefined);
  }, []);

  const updateSessionStatus = useCallback((sessionId: string, status: AttendanceStatus) => {
    const now = new Date().toISOString();
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === sessionId ? { ...s, status, updatedAt: now } : s
      );
      storage.save(updated);
      
      const updatedSession = updated.find(s => s.id === sessionId);
      if (user && updatedSession) {
        setSyncStatus('Syncing');
        syncRepo.syncSingleSession(user.id, updatedSession).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
          setLastSynced(new Date());
        }).catch((e) => {
          console.warn('Sync failed:', e);
          const error = e as { message?: string };
          setSyncStatus('Error');
          setSyncError(error?.message || 'Update failed');
        });
      }
      return updated;
    });
  }, [user]);

  const addSession = useCallback((session: Session) => {
    const now = new Date().toISOString();
    setSessions(prev => {
      const sessionWithTime = { ...session, updatedAt: now };
      const updated = [...prev, sessionWithTime];
      storage.save(updated);
      
      if (user) {
        setSyncStatus('Syncing');
        syncRepo.syncSingleSession(user.id, sessionWithTime).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
          setLastSynced(new Date());
        }).catch((e) => {
          const error = e as { message?: string };
          setSyncStatus('Error');
          setSyncError(error?.message || 'Insert failed');
        });
      }
      return updated;
    });
  }, [user]);

  const resetAll = useCallback(async (clearCloud: boolean = false) => {
    const fresh = storage.reset();
    setSessions(fresh);
    if (user && clearCloud) {
       setSyncStatus('Syncing');
       await supabase.from('attendance_records').delete().eq('user_id', user.id);
       setSyncStatus('Synced');
       setLastSynced(new Date());
    }
  }, [user]);

  const exportData = useCallback(() => {
    return storage.exportData(sessions);
  }, [sessions]);

  const importDataFn = useCallback((json: string): boolean => {
    const result = storage.importData(json);
    if (result) {
      setSessions(result);
      if (user) {
         performFullSync(user, result);
      }
      return true;
    }
    return false;
  }, [user, performFullSync]);

  return (
    <AttendanceContext.Provider value={{
      sessions,
      updateSessionStatus,
      addSession,
      resetAll,
      exportData,
      importData: importDataFn,
      isLoaded,
      user,
      syncStatus,
      syncError,
      lastSynced,
      syncNow,
      signOut
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}

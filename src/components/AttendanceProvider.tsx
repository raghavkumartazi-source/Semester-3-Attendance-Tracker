'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { Session, AttendanceStatus } from '@/lib/types';
import { createStorage } from '@/lib/storage';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { syncRepo, CloudRecord } from '@/lib/sync';
import { parseExtraSessionId } from '@/lib/sessions';
import { emitParticle } from '@/lib/backgroundParticles';
import UndoToast from './UndoToast';

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
  const [auth, setAuth] = useState<{ ready: boolean; user: User | null }>({ ready: false, user: null });
  useEffect(() => {
    let active = true;
    let authEventReceived = false;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      authEventReceived = true;
      if (active) setAuth({ ready: true, user: session?.user ?? null });
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (active && !authEventReceived) setAuth({ ready: true, user: session?.user ?? null });
    }).catch(() => {
      if (active && !authEventReceived) setAuth({ ready: true, user: null });
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  if (!auth.ready) return <p role="status">Loading your workspace…</p>;
  return <AccountAttendanceProvider key={auth.user?.id ?? 'guest'} user={auth.user}>{children}</AccountAttendanceProvider>;
}

function AccountAttendanceProvider({ children, user }: { children: ReactNode; user: User | null }) {
  const storage = useMemo(() => createStorage(user?.id ?? null), [user?.id]);
  const active = useRef(true);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Offline' | 'Error'>('Offline');
  const [syncError, setSyncError] = useState<string>('');
  const [lastSynced, setLastSynced] = useState<Date | undefined>();
  
  const [toastState, setToastState] = useState<{
    show: boolean;
    sessionId: string;
    subjectCode: string;
    status: AttendanceStatus;
    previousStatus: AttendanceStatus;
  } | null>(null);

  // 1. Initial Load from LocalStorage
  useEffect(() => {
    const loaded = storage.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(loaded);
    setIsLoaded(true);
  }, [storage]);

  // 3. Full Sync Logic
  const performFullSync = useCallback(async (currentUser: User) => {
    setSyncStatus('Syncing');
    
    try {
      const cloudRecords = await syncRepo.fetchCloudRecords(currentUser.id);
      
      if (!active.current) return;
      let changed = false;
      // Re-read after the network response so offline edits made during the request survive.
      const newSessions = storage.load();
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
        if (s.status === 'UNMARKED' && !s.updatedAt) return false;
        const cloud = cloudMap.get(s.id);
        if (!cloud) return true; 
        const cloudDate = new Date(cloud.updated_at).getTime();
        const localDate = s.updatedAt ? new Date(s.updatedAt).getTime() : 0;
        return localDate > cloudDate;
      });
      
      if (recordsToUpload.length > 0) {
        await syncRepo.uploadLocalRecords(currentUser.id, recordsToUpload);
      }
      
      if (!active.current) return;
      setSyncStatus('Synced');
      setSyncError('');
      setLastSynced(new Date());
    } catch (e) {
      if (!active.current) return;
      console.warn('Full sync failed:', e);
      const error = e as { message?: string };
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setSyncStatus('Error');
        setSyncError(error?.message || 'Unknown database error');
      } else {
        setSyncStatus('Offline');
      }
    }
  }, [storage]);

  // 4. Trigger Full Sync on Login or Focus
  useEffect(() => {
    if (user && isLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      performFullSync(user);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded]); // Deliberately omitted 'sessions' to prevent loop on every local change

  useEffect(() => {
    const handleFocus = () => {
      if (user && isLoaded) performFullSync(user);
    };
    const handleOnline = () => {
      if (user && isLoaded) performFullSync(user);
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

  const syncNow = useCallback(async () => {
    if (user && isLoaded) {
      await performFullSync(user);
    }
  }, [user, isLoaded, performFullSync]);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) { setSyncStatus("Error"); setSyncError(error.message); return; }
    setSyncStatus('Offline');
    setLastSynced(undefined);
  }, []);

  const updateSessionStatus = useCallback((sessionId: string, status: AttendanceStatus) => {
    const now = new Date().toISOString();
    let markedPresent = false;
    setSessions(prev => {
      const oldSession = prev.find(s => s.id === sessionId);
      if (oldSession && status !== 'UNMARKED' && oldSession.status !== status) {
        setToastState({
          show: true,
          sessionId,
          subjectCode: oldSession.subjectCode,
          status,
          previousStatus: oldSession.status
        });
        if (status === 'PRESENT') markedPresent = true;
      }

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

    // Feed the progress horizon with a green ember when marking Present.
    if (markedPresent && typeof window !== 'undefined') {
      emitParticle(
        window.innerWidth / 2 + (Math.random() - 0.5) * window.innerWidth * 0.3,
        window.innerHeight * 0.65,
        'oklch(55% 0.18 145)',
        'tap'
      );
    }
  }, [user, storage]);

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
  }, [user, storage]);

  const resetAll = useCallback(async (clearCloud: boolean = false) => {
    const now = new Date().toISOString();
    const fresh = storage.load().map(session => ({ ...session, status: 'UNMARKED' as const, updatedAt: now }));
    storage.save(fresh);
    setSessions(fresh);
    if (user && clearCloud) {
      setSyncStatus('Syncing');
      try {
        // Include cloud-only extras, and retain tombstones so another device cannot restore marks.
        const cloud = await syncRepo.fetchCloudRecords(user.id);
        if (!active.current) return;
        const missing = cloud.filter(record => !fresh.some(session => session.id === record.session_id))
          .map(record => parseExtraSessionId(record.session_id)).filter((session): session is Session => !!session)
          .map(session => ({ ...session, status: 'UNMARKED' as const, updatedAt: now }));
        const cleared = [...fresh, ...missing];
        storage.save(cleared);
        setSessions(cleared);
        await syncRepo.uploadLocalRecords(user.id, cleared);
        if (!active.current) return;
        setSyncStatus('Synced');
        setLastSynced(new Date());
      } catch (error) {
        setSyncStatus('Error');
        setSyncError(error instanceof Error ? error.message : 'Reset could not sync. Try Sync now.');
      }
    }
  }, [user, storage]);

  const exportData = useCallback(() => {
    return storage.exportData(sessions);
  }, [sessions, storage]);

  const importDataFn = useCallback((json: string): boolean => {
    const result = storage.importData(json);
    if (result) {
      setSessions(result);
      if (user) {
         performFullSync(user);
      }
      return true;
    }
    return false;
  }, [user, performFullSync, storage]);

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
      {toastState && (
        <UndoToast
          show={toastState.show}
          subjectCode={toastState.subjectCode}
          status={toastState.status}
          onUndo={() => {
            updateSessionStatus(toastState.sessionId, toastState.previousStatus);
            setToastState(null);
          }}
          onClose={() => setToastState(prev => prev ? { ...prev, show: false } : null)}
        />
      )}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error('useAttendance must be used within AttendanceProvider');
  return ctx;
}

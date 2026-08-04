'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Session, AttendanceStatus } from '@/lib/types';
import { storage } from '@/lib/storage';

interface AttendanceContextType {
  sessions: Session[];
  updateSessionStatus: (sessionId: string, status: AttendanceStatus) => void;
  addSession: (session: Session) => void;
  resetAll: () => void;
  exportData: () => string;
  importData: (json: string) => boolean;
  isLoaded: boolean;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

export function AttendanceProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const loaded = storage.load();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSessions(loaded);
    setIsLoaded(true);
  }, []);

  const updateSessionStatus = useCallback((sessionId: string, status: AttendanceStatus) => {
    setSessions(prev => {
      const updated = prev.map(s =>
        s.id === sessionId ? { ...s, status } : s
      );
      storage.save(updated);
      return updated;
    });
  }, []);

  const addSession = useCallback((session: Session) => {
    setSessions(prev => {
      const updated = [...prev, session];
      storage.save(updated);
      return updated;
    });
  }, []);

  const resetAll = useCallback(() => {
    const fresh = storage.reset();
    setSessions(fresh);
  }, []);

  const exportData = useCallback(() => {
    return storage.exportData(sessions);
  }, [sessions]);

  const importDataFn = useCallback((json: string): boolean => {
    const result = storage.importData(json);
    if (result) {
      setSessions(result);
      return true;
    }
    return false;
  }, []);

  return (
    <AttendanceContext.Provider value={{
      sessions,
      updateSessionStatus,
      addSession,
      resetAll,
      exportData,
      importData: importDataFn,
      isLoaded,
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

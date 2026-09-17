'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { MarkComponent, SubjectGradeConfig, GradeScenario, SubjectMarksSummary, OverallGradeSummary } from '@/lib/types';
import { marksStorage } from '@/lib/marksStorage';
import { marksSync } from '@/lib/marksSync';
import { calculateSubjectMarksSummary, calculateOverallGradeSummary } from '@/lib/calculations';
import { useAttendance } from './AttendanceProvider';

interface MarksContextType {
  components: MarkComponent[];
  gradeConfigs: SubjectGradeConfig[];
  scenarios: GradeScenario[];
  addComponent: (component: Omit<MarkComponent, 'id' | 'created_at' | 'updated_at'>) => void;
  updateComponent: (componentId: string, updates: Partial<MarkComponent>) => void;
  deleteComponent: (componentId: string) => void;
  upsertGradeConfig: (config: Omit<SubjectGradeConfig, 'id' | 'created_at' | 'updated_at'>) => void;
  addScenario: (scenario: Omit<GradeScenario, 'id' | 'created_at' | 'updated_at'>) => void;
  updateScenario: (scenarioId: string, updates: Partial<GradeScenario>) => void;
  deleteScenario: (scenarioId: string) => void;
  getSubjectSummary: (subjectCode: string) => SubjectMarksSummary | null;
  getOverallSummary: () => OverallGradeSummary;
  syncStatus: 'Synced' | 'Syncing' | 'Offline' | 'Error';
  syncError?: string;
  isLoaded: boolean;
}

const MarksContext = createContext<MarksContextType | null>(null);

export function MarksProvider({ children }: { children: ReactNode }) {
  const [components, setComponents] = useState<MarkComponent[]>([]);
  const [gradeConfigs, setGradeConfigs] = useState<SubjectGradeConfig[]>([]);
  const [scenarios, setScenarios] = useState<GradeScenario[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { user, isLoaded: authLoaded } = useAttendance();
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Offline' | 'Error'>('Offline');
  const [syncError, setSyncError] = useState<string>('');

  useEffect(() => {
    const loadedComponents = marksStorage.loadComponents();
    const loadedConfigs = marksStorage.loadGradeConfigs();
    const loadedScenarios = marksStorage.loadScenarios();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setComponents(loadedComponents);
    setGradeConfigs(loadedConfigs);
    setScenarios(loadedScenarios);
    setIsLoaded(true);
  }, []);

  const performFullSync = useCallback(async () => {
    if (!user) return;
    setSyncStatus('Syncing');
    
    try {
      const [cloudComponents, cloudConfigs, cloudScenarios] = await Promise.all([
        marksSync.fetchCloudComponents(user.id),
        marksSync.fetchCloudGradeConfigs(user.id),
        marksSync.fetchCloudScenarios(user.id),
      ]);
      
      // Merge cloud into local
      let changed = false;
      const newComponents = [...components];
      const cloudCompMap = new Map(cloudComponents.map(c => [c.id, c]));
      
      for (let i = 0; i < newComponents.length; i++) {
        const local = newComponents[i];
        const cloud = cloudCompMap.get(local.id);
        if (cloud && new Date(cloud.updated_at).getTime() > new Date(local.updated_at).getTime()) {
          newComponents[i] = { ...cloud };
          changed = true;
        }
      }
      
      for (const cloud of cloudComponents) {
        if (!newComponents.find(c => c.id === cloud.id)) {
          newComponents.push({ ...cloud });
          changed = true;
        }
      }
      
      const newConfigs = [...gradeConfigs];
      const cloudConfigMap = new Map(cloudConfigs.map(c => [c.id, c]));
      for (let i = 0; i < newConfigs.length; i++) {
        const local = newConfigs[i];
        const cloud = cloudConfigMap.get(local.id);
        if (cloud && new Date(cloud.updated_at).getTime() > new Date(local.updated_at).getTime()) {
          newConfigs[i] = { ...cloud };
          changed = true;
        }
      }
      for (const cloud of cloudConfigs) {
        if (!newConfigs.find(c => c.id === cloud.id)) {
          newConfigs.push({ ...cloud });
          changed = true;
        }
      }
      
      const newScenarios = [...scenarios];
      const cloudScenarioMap = new Map(cloudScenarios.map(s => [s.id, s]));
      for (let i = 0; i < newScenarios.length; i++) {
        const local = newScenarios[i];
        const cloud = cloudScenarioMap.get(local.id);
        if (cloud && new Date(cloud.updated_at).getTime() > new Date(local.updated_at).getTime()) {
          newScenarios[i] = { ...cloud };
          changed = true;
        }
      }
      for (const cloud of cloudScenarios) {
        if (!newScenarios.find(s => s.id === cloud.id)) {
          newScenarios.push({ ...cloud });
          changed = true;
        }
      }
      
      if (changed) {
        marksStorage.saveAll(newComponents, newConfigs, newScenarios);
        setComponents(newComponents);
        setGradeConfigs(newConfigs);
        setScenarios(newScenarios);
      }
      
      // Upload local changes
      const compsToUpload = newComponents.filter(c => {
        const cloud = cloudCompMap.get(c.id);
        if (!cloud) return true;
        return new Date(c.updated_at).getTime() > new Date(cloud.updated_at).getTime();
      });
      const configsToUpload = newConfigs.filter(c => {
        const cloud = cloudConfigMap.get(c.id);
        if (!cloud) return true;
        return new Date(c.updated_at).getTime() > new Date(cloud.updated_at).getTime();
      });
      const scenariosToUpload = newScenarios.filter(s => {
        const cloud = cloudScenarioMap.get(s.id);
        if (!cloud) return true;
        return new Date(s.updated_at).getTime() > new Date(cloud.updated_at).getTime();
      });
      
      await Promise.all([
        compsToUpload.length > 0 ? marksSync.uploadLocalComponents(user.id, compsToUpload) : Promise.resolve(),
        configsToUpload.length > 0 ? marksSync.uploadLocalGradeConfigs(user.id, configsToUpload) : Promise.resolve(),
        scenariosToUpload.length > 0 ? marksSync.uploadLocalScenarios(user.id, scenariosToUpload) : Promise.resolve(),
      ]);
      
      setSyncStatus('Synced');
      setSyncError('');
    } catch (e) {
      console.warn('Marks sync failed:', e);
      const error = e as { message?: string };
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setSyncStatus('Error');
        setSyncError(error?.message || 'Unknown database error');
      } else {
        setSyncStatus('Offline');
      }
    }
  }, [user, components, gradeConfigs, scenarios]);

  useEffect(() => {
    if (user && isLoaded && authLoaded) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      performFullSync();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isLoaded, authLoaded]);

  useEffect(() => {
    const handleFocus = () => { if (user && isLoaded) performFullSync(); };
    const handleOnline = () => { if (user && isLoaded) performFullSync(); };
    const handleOffline = () => setSyncStatus('Offline');
    
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, isLoaded, performFullSync]);

  const addComponent = useCallback((payload: Omit<MarkComponent, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newComponent: MarkComponent = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    setComponents(prev => {
      const updated = [...prev, newComponent];
      marksStorage.saveComponents(updated);
      if (user) {
        setSyncStatus('Syncing');
        marksSync.syncSingleComponent(user.id, newComponent).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch(() => {
          setSyncStatus('Error');
          setSyncError('Insert failed');
        });
      }
      return updated;
    });
  }, [user]);

  const updateComponent = useCallback((componentId: string, updates: Partial<MarkComponent>) => {
    const now = new Date().toISOString();
    setComponents(prev => {
      const updated = prev.map(c => c.id === componentId ? { ...c, ...updates, updated_at: now } : c);
      marksStorage.saveComponents(updated);
      const updatedComp = updated.find(c => c.id === componentId);
      if (user && updatedComp) {
        setSyncStatus('Syncing');
        marksSync.syncSingleComponent(user.id, updatedComp).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch(() => {
          setSyncStatus('Error');
          setSyncError('Update failed');
        });
      }
      return updated;
    });
  }, [user]);

  const deleteComponent = useCallback((componentId: string) => {
    const now = new Date().toISOString();
    setComponents(prev => {
      const updated = prev.map(c => c.id === componentId ? { ...c, deleted_at: now, updated_at: now } : c);
      marksStorage.saveComponents(updated);
      const updatedComp = updated.find(c => c.id === componentId);
      if (user && updatedComp) {
        setSyncStatus('Syncing');
        marksSync.syncSingleComponent(user.id, updatedComp).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch(() => {
          setSyncStatus('Error');
          setSyncError('Delete sync failed');
        });
      }
      return updated;
    });
  }, [user]);

  const upsertGradeConfig = useCallback((payload: Omit<SubjectGradeConfig, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    setGradeConfigs(prev => {
      const existingIndex = prev.findIndex(c => c.subject_code === payload.subject_code && c.user_id === payload.user_id);
      let updated: SubjectGradeConfig[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...payload, updated_at: now };
      } else {
        const newConfig: SubjectGradeConfig = {
          ...payload,
          id: crypto.randomUUID(),
          created_at: now,
          updated_at: now,
        };
        updated = [...prev, newConfig];
      }
      marksStorage.saveGradeConfigs(updated);
      if (user) {
        setSyncStatus('Syncing');
        marksSync.syncSingleGradeConfig(user.id, existingIndex >= 0 ? updated[existingIndex] : updated[updated.length - 1])
          .then(() => { setSyncStatus('Synced'); setSyncError(''); })
          .catch(() => { setSyncStatus('Error'); setSyncError('Config sync failed'); });
      }
      return updated;
    });
  }, [user]);

  const addScenario = useCallback((payload: Omit<GradeScenario, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newScenario: GradeScenario = {
      ...payload,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };
    setScenarios(prev => {
      const updated = [...prev, newScenario];
      marksStorage.saveScenarios(updated);
      if (user) {
        setSyncStatus('Syncing');
        marksSync.syncSingleScenario(user.id, newScenario).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch(() => {
          setSyncStatus('Error');
          setSyncError('Scenario insert failed');
        });
      }
      return updated;
    });
  }, [user]);

  const updateScenario = useCallback((scenarioId: string, updates: Partial<GradeScenario>) => {
    const now = new Date().toISOString();
    setScenarios(prev => {
      const updated = prev.map(s => s.id === scenarioId ? { ...s, ...updates, updated_at: now } : s);
      marksStorage.saveScenarios(updated);
      const updatedScen = updated.find(s => s.id === scenarioId);
      if (user && updatedScen) {
        setSyncStatus('Syncing');
        marksSync.syncSingleScenario(user.id, updatedScen).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch(() => {
          setSyncStatus('Error');
          setSyncError('Scenario update failed');
        });
      }
      return updated;
    });
  }, [user]);

  const deleteScenario = useCallback((scenarioId: string) => {
    const now = new Date().toISOString();
    setScenarios(prev => {
      const updated = prev.map(s => s.id === scenarioId ? { ...s, deleted_at: now, updated_at: now } : s);
      marksStorage.saveScenarios(updated);
      const updatedScen = updated.find(s => s.id === scenarioId);
      if (user && updatedScen) {
        setSyncStatus('Syncing');
        marksSync.syncSingleScenario(user.id, updatedScen).then(() => {
          setSyncStatus('Synced');
          setSyncError('');
        }).catch(() => {
          setSyncStatus('Error');
          setSyncError('Scenario delete failed');
        });
      }
      return updated;
    });
  }, [user]);


  const getSubjectSummary = useCallback((subjectCode: string): SubjectMarksSummary | null => {
    const subjectComponents = components.filter(c => c.subject_code === subjectCode);
    if (subjectComponents.length === 0) return null;
    const gradeConfig = gradeConfigs.find(c => c.subject_code === subjectCode) || null;
    return calculateSubjectMarksSummary(subjectComponents, gradeConfig);
  }, [components, gradeConfigs]);

  const getOverallSummary = useCallback((): OverallGradeSummary => {
    const summaries: SubjectMarksSummary[] = [];
    for (const subject of components.reduce((acc, c) => {
      if (!acc.includes(c.subject_code)) acc.push(c.subject_code);
      return acc;
    }, [] as string[])) {
      const summary = getSubjectSummary(subject);
      if (summary) summaries.push(summary);
    }
    return calculateOverallGradeSummary(summaries);
  }, [components, getSubjectSummary]);

  return (
    <MarksContext.Provider value={{
      components,
      gradeConfigs,
      scenarios,
      addComponent,
      updateComponent,
      deleteComponent,
      upsertGradeConfig,
      addScenario,
      updateScenario,
      deleteScenario,
      getSubjectSummary,
      getOverallSummary,
      syncStatus,
      syncError,
      isLoaded,
    }}>
      {children}
    </MarksContext.Provider>
  );
}

export function useMarks() {
  const ctx = useContext(MarksContext);
  if (!ctx) throw new Error('useMarks must be used within MarksProvider');
  return ctx;
}
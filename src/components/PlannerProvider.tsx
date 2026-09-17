'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { 
  SyllabusTopic, 
  TopicCoverage, 
  ExamSchedule, 
  PastPaper, 
  PaperPractice, 
  DailyStudyPlan, 
  StudySession, 
  PlannerConfig,
  ReverseCountdownPlan
} from '@/lib/types';
import { plannerStorage } from '@/lib/plannerStorage';
import { plannerSync } from '@/lib/plannerSync';
import { useAttendance } from './AttendanceProvider';
import { 
  generateReverseCountdownPlan, 
  getNextReviewDate, 
  calculateTopicPriority 
} from '@/lib/calculations';

interface PlannerContextType {
  topics: SyllabusTopic[];
  coverage: TopicCoverage[];
  exams: ExamSchedule[];
  pastPapers: PastPaper[];
  practice: PaperPractice[];
  dailyPlans: DailyStudyPlan[];
  studySessions: StudySession[];
  plannerConfigs: PlannerConfig[];
  
  // CRUD for topics
  addTopic: (topic: Omit<SyllabusTopic, 'id' | 'created_at' | 'updated_at'>) => void;
  updateTopic: (topicId: string, updates: Partial<SyllabusTopic>) => void;
  deleteTopic: (topicId: string) => void;
  
  // CRUD for coverage
  upsertCoverage: (coverage: Omit<TopicCoverage, 'id' | 'created_at' | 'updated_at'>) => void;
  
  // CRUD for exams
  addExam: (exam: Omit<ExamSchedule, 'id' | 'created_at' | 'updated_at'>) => void;
  updateExam: (examId: string, updates: Partial<ExamSchedule>) => void;
  deleteExam: (examId: string) => void;
  
  // CRUD for past papers
  addPastPaper: (paper: Omit<PastPaper, 'id' | 'created_at'>) => void;
  updatePastPaper: (paperId: string, updates: Partial<PastPaper>) => void;
  deletePastPaper: (paperId: string) => void;
  
  // CRUD for practice
  addPractice: (practice: Omit<PaperPractice, 'id' | 'created_at'>) => void;
  updatePractice: (practiceId: string, updates: Partial<PaperPractice>) => void;
  
  // CRUD for daily plans
  addDailyPlan: (plan: Omit<DailyStudyPlan, 'id' | 'created_at' | 'updated_at'>) => void;
  updateDailyPlan: (planId: string, updates: Partial<DailyStudyPlan>) => void;
  deleteDailyPlan: (planId: string) => void;
  
  // CRUD for study sessions
  addStudySession: (session: Omit<StudySession, 'id' | 'created_at'>) => void;
  updateStudySession: (sessionId: string, updates: Partial<StudySession>) => void;
  
  // CRUD for planner config
  upsertPlannerConfig: (config: Omit<PlannerConfig, 'id' | 'created_at' | 'updated_at'>) => void;
  
  // Computed
  getReverseCountdownPlan: (subjectCode: string) => ReverseCountdownPlan | null;
  getNextReview: (topicId: string) => Date | null;
  getTopicPriority: (topicId: string) => number;
  getTodayPlan: (subjectCode?: string) => DailyStudyPlan[];
  getUpcomingExams: (days?: number) => ExamSchedule[];
  
  syncStatus: 'Synced' | 'Syncing' | 'Offline' | 'Error';
  syncError?: string;
  isLoaded: boolean;
}

const PlannerContext = createContext<PlannerContextType | null>(null);

export function PlannerProvider({ children }: { children: ReactNode }) {
  const [topics, setTopics] = useState<SyllabusTopic[]>([]);
  const [coverage, setCoverage] = useState<TopicCoverage[]>([]);
  const [exams, setExams] = useState<ExamSchedule[]>([]);
  const [pastPapers, setPastPapers] = useState<PastPaper[]>([]);
  const [practice, setPractice] = useState<PaperPractice[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyStudyPlan[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [plannerConfigs, setPlannerConfigs] = useState<PlannerConfig[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { user, isLoaded: authLoaded } = useAttendance();
  const [syncStatus, setSyncStatus] = useState<'Synced' | 'Syncing' | 'Offline' | 'Error'>('Offline');
  const [syncError, setSyncError] = useState<string>('');

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTopics(plannerStorage.loadTopics());
    setCoverage(plannerStorage.loadCoverage());
    setExams(plannerStorage.loadExams());
    setPastPapers(plannerStorage.loadPastPapers());
    setPractice(plannerStorage.loadPractice());
    setDailyPlans(plannerStorage.loadDailyPlans());
    setStudySessions(plannerStorage.loadStudySessions());
    setPlannerConfigs(plannerStorage.loadPlannerConfigs());
    setIsLoaded(true);
  }, []);

  const performFullSync = useCallback(async () => {
    if (!user) return;
    setSyncStatus('Syncing');
    
    try {
      const [cloudTopics, cloudCoverage, cloudExams, cloudPapers, cloudPractice, cloudPlans, cloudSessions, cloudConfigs] = await Promise.all([
        plannerSync.fetchCloudTopics(user.id),
        plannerSync.fetchCloudCoverage(user.id),
        plannerSync.fetchCloudExams(user.id),
        plannerSync.fetchCloudPastPapers(user.id),
        plannerSync.fetchCloudPractice(user.id),
        plannerSync.fetchCloudDailyPlans(user.id),
        plannerSync.fetchCloudStudySessions(user.id),
        plannerSync.fetchCloudPlannerConfigs(user.id),
      ]);
      
      // Merge function
      const merge = <T extends { id: string; updated_at: string }>(
        local: T[], 
        cloud: T[], 
        setLocal: (items: T[]) => void
      ) => {
        let changed = false;
        const newLocal = [...local];
        const cloudMap = new Map(cloud.map(c => [c.id, c]));
        
        for (let i = 0; i < newLocal.length; i++) {
          const l = newLocal[i];
          const c = cloudMap.get(l.id);
          if (c && new Date(c.updated_at).getTime() > new Date(l.updated_at).getTime()) {
            newLocal[i] = { ...c };
            changed = true;
          }
        }
        
        for (const c of cloud) {
          if (!newLocal.find(l => l.id === c.id)) {
            newLocal.push({ ...c });
            changed = true;
          }
        }
        
        if (changed) {
          setLocal(newLocal);
        }
        return { items: newLocal, cloudMap, changed };
      };
      
      const topicMerge = merge(topics, cloudTopics, setTopics);
      const coverageMerge = merge(coverage, cloudCoverage, setCoverage);
      const examMerge = merge(exams, cloudExams, setExams);
      const paperMerge = merge(pastPapers, cloudPapers, setPastPapers);
      const practiceMerge = merge(practice, cloudPractice, setPractice);
      const planMerge = merge(dailyPlans, cloudPlans, setDailyPlans);
      const sessionMerge = merge(studySessions, cloudSessions, setStudySessions);
      const configMerge = merge(plannerConfigs, cloudConfigs, setPlannerConfigs);
      
      const anyChanged = topicMerge.changed || coverageMerge.changed || examMerge.changed || 
                        paperMerge.changed || practiceMerge.changed || planMerge.changed || 
                        sessionMerge.changed || configMerge.changed;
      
      if (anyChanged) {
        plannerStorage.saveAll(
          topicMerge.items, coverageMerge.items, examMerge.items, paperMerge.items,
          practiceMerge.items, planMerge.items, sessionMerge.items, configMerge.items
        );
      }
      
      // Upload local changes
      const uploadPromises: Promise<void>[] = [];
      
      const uploadIfNeeded = <T extends { id: string; updated_at: string }>(
        local: T[], cloudMap: Map<string, T>, uploadFn: (userId: string, items: T[]) => Promise<void>
      ) => {
        const toUpload = local.filter(l => {
          const c = cloudMap.get(l.id);
          if (!c) return true;
          return new Date(l.updated_at).getTime() > new Date(c.updated_at).getTime();
        });
        if (toUpload.length > 0) uploadPromises.push(uploadFn(user.id, toUpload));
      };
      
      uploadIfNeeded(topicMerge.items, topicMerge.cloudMap, plannerSync.uploadLocalTopics);
      uploadIfNeeded(coverageMerge.items, coverageMerge.cloudMap, plannerSync.uploadLocalCoverage);
      uploadIfNeeded(examMerge.items, examMerge.cloudMap, plannerSync.uploadLocalExams);
      uploadIfNeeded(paperMerge.items, paperMerge.cloudMap, plannerSync.uploadLocalPastPapers);
      uploadIfNeeded(practiceMerge.items, practiceMerge.cloudMap, plannerSync.uploadLocalPractice);
      uploadIfNeeded(planMerge.items, planMerge.cloudMap, plannerSync.uploadLocalDailyPlans);
      uploadIfNeeded(sessionMerge.items, sessionMerge.cloudMap, plannerSync.uploadLocalStudySessions);
      uploadIfNeeded(configMerge.items, configMerge.cloudMap, plannerSync.uploadLocalPlannerConfigs);
      
      await Promise.all(uploadPromises);
      
      setSyncStatus('Synced');
      setSyncError('');
    } catch (e) {
      console.warn('Planner sync failed:', e);
      const error = e as { message?: string };
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        setSyncStatus('Error');
        setSyncError(error?.message || 'Unknown database error');
      } else {
        setSyncStatus('Offline');
      }
    }
  }, [user, topics, coverage, exams, pastPapers, practice, dailyPlans, studySessions, plannerConfigs]);

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

  // CRUD helpers
  const withSync = useCallback(async <T extends { id: string; user_id?: string }>(
    items: T[],
    setter: (items: T[]) => void,
    storageSave: (items: T[]) => void,
    syncSingle: (userId: string, item: T) => Promise<void>,
    newItem: T
  ) => {
    setter([...items, newItem]);
    storageSave([...items, newItem]);
    if (user) {
      setSyncStatus('Syncing');
      try {
        await syncSingle(user.id, newItem);
        setSyncStatus('Synced');
        setSyncError('');
      } catch {
        setSyncStatus('Error');
        setSyncError('Sync failed');
      }
    }
  }, [user]);

  const updateWithSync = useCallback(async <T extends { id: string; user_id?: string }>(
    items: T[],
    setter: (items: T[]) => void,
    storageSave: (items: T[]) => void,
    syncSingle: (userId: string, item: T) => Promise<void>,
    itemId: string,
    updates: Partial<T>
  ) => {
    const now = new Date().toISOString();
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, ...updates, updated_at: now } as T : item
    );
    setter(updatedItems);
    storageSave(updatedItems);
    const updatedItem = updatedItems.find(i => i.id === itemId);
    if (user && updatedItem) {
      setSyncStatus('Syncing');
      try {
        await syncSingle(user.id, updatedItem);
        setSyncStatus('Synced');
        setSyncError('');
      } catch {
        setSyncStatus('Error');
        setSyncError('Sync failed');
      }
    }
  }, [user]);

  const deleteWithSync = useCallback(async <T extends { id: string; user_id?: string; deleted_at?: string }>(
    items: T[],
    setter: (items: T[]) => void,
    storageSave: (items: T[]) => void,
    syncSingle: (userId: string, item: T) => Promise<void>,
    itemId: string
  ) => {
    const now = new Date().toISOString();
    const updatedItems = items.map(item => 
      item.id === itemId ? { ...item, deleted_at: now, updated_at: now } as T : item
    );
    setter(updatedItems);
    storageSave(updatedItems);
    const updatedItem = updatedItems.find(i => i.id === itemId);
    if (user && updatedItem) {
      setSyncStatus('Syncing');
      try {
        await syncSingle(user.id, updatedItem);
        setSyncStatus('Synced');
        setSyncError('');
      } catch {
        setSyncStatus('Error');
        setSyncError('Sync failed');
      }
    }
  }, [user]);

  // Topics
  const addTopic = useCallback((payload: Omit<SyllabusTopic, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newTopic: SyllabusTopic = { ...payload, id: crypto.randomUUID(), created_at: now, updated_at: now };
    withSync(topics, setTopics, plannerStorage.saveTopics, plannerSync.syncSingleTopic, newTopic);
  }, [topics, withSync]);

  const updateTopic = useCallback((topicId: string, updates: Partial<SyllabusTopic>) => {
    updateWithSync(topics, setTopics, plannerStorage.saveTopics, plannerSync.syncSingleTopic, topicId, updates);
  }, [topics, updateWithSync]);

  const deleteTopic = useCallback((topicId: string) => {
    deleteWithSync(topics, setTopics, plannerStorage.saveTopics, plannerSync.syncSingleTopic, topicId);
  }, [topics, deleteWithSync]);

  // Coverage
  const upsertCoverage = useCallback((payload: Omit<TopicCoverage, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    setCoverage(prev => {
      const existingIndex = prev.findIndex(c => c.topic_id === payload.topic_id && c.user_id === payload.user_id);
      let updated: TopicCoverage[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...payload, updated_at: now };
      } else {
        const newCov: TopicCoverage = { ...payload, id: crypto.randomUUID(), created_at: now, updated_at: now };
        updated = [...prev, newCov];
      }
      plannerStorage.saveCoverage(updated);
      if (user) {
        setSyncStatus('Syncing');
        plannerSync.syncSingleCoverage(user.id, existingIndex >= 0 ? updated[existingIndex] : updated[updated.length - 1])
          .then(() => { setSyncStatus('Synced'); setSyncError(''); })
          .catch(() => { setSyncStatus('Error'); setSyncError('Coverage sync failed'); });
      }
      return updated;
    });
  }, [user]);

  // Exams
  const addExam = useCallback((payload: Omit<ExamSchedule, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newExam: ExamSchedule = { ...payload, id: crypto.randomUUID(), created_at: now, updated_at: now };
    withSync(exams, setExams, plannerStorage.saveExams, plannerSync.syncSingleExam, newExam);
  }, [exams, withSync]);

  const updateExam = useCallback((examId: string, updates: Partial<ExamSchedule>) => {
    updateWithSync(exams, setExams, plannerStorage.saveExams, plannerSync.syncSingleExam, examId, updates);
  }, [exams, updateWithSync]);

  const deleteExam = useCallback((examId: string) => {
    deleteWithSync(exams, setExams, plannerStorage.saveExams, plannerSync.syncSingleExam, examId);
  }, [exams, deleteWithSync]);

  // Past Papers
  const addPastPaper = useCallback((payload: Omit<PastPaper, 'id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const newPaper: PastPaper = { ...payload, id: crypto.randomUUID(), created_at: now };
    withSync(pastPapers, setPastPapers, plannerStorage.savePastPapers, plannerSync.syncSinglePastPaper, newPaper);
  }, [pastPapers, withSync]);

  const updatePastPaper = useCallback((paperId: string, updates: Partial<PastPaper>) => {
    updateWithSync(pastPapers, setPastPapers, plannerStorage.savePastPapers, plannerSync.syncSinglePastPaper, paperId, updates);
  }, [pastPapers, updateWithSync]);

  const deletePastPaper = useCallback((paperId: string) => {
    deleteWithSync(pastPapers, setPastPapers, plannerStorage.savePastPapers, plannerSync.syncSinglePastPaper, paperId);
  }, [pastPapers, deleteWithSync]);

  // Practice
  const addPractice = useCallback((payload: Omit<PaperPractice, 'id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const newPractice: PaperPractice = { ...payload, id: crypto.randomUUID(), created_at: now };
    withSync(practice, setPractice, plannerStorage.savePractice, plannerSync.syncSinglePractice, newPractice);
  }, [practice, withSync]);

  const updatePractice = useCallback((practiceId: string, updates: Partial<PaperPractice>) => {
    updateWithSync(practice, setPractice, plannerStorage.savePractice, plannerSync.syncSinglePractice, practiceId, updates);
  }, [practice, updateWithSync]);

  // Daily Plans
  const addDailyPlan = useCallback((payload: Omit<DailyStudyPlan, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    const newPlan: DailyStudyPlan = { ...payload, id: crypto.randomUUID(), created_at: now, updated_at: now };
    withSync(dailyPlans, setDailyPlans, plannerStorage.saveDailyPlans, plannerSync.syncSingleDailyPlan, newPlan);
  }, [dailyPlans, withSync]);

  const updateDailyPlan = useCallback((planId: string, updates: Partial<DailyStudyPlan>) => {
    updateWithSync(dailyPlans, setDailyPlans, plannerStorage.saveDailyPlans, plannerSync.syncSingleDailyPlan, planId, updates);
  }, [dailyPlans, updateWithSync]);

  const deleteDailyPlan = useCallback((planId: string) => {
    deleteWithSync(dailyPlans, setDailyPlans, plannerStorage.saveDailyPlans, plannerSync.syncSingleDailyPlan, planId);
  }, [dailyPlans, deleteWithSync]);

  // Study Sessions
  const addStudySession = useCallback((payload: Omit<StudySession, 'id' | 'created_at'>) => {
    const now = new Date().toISOString();
    const newSession: StudySession = { ...payload, id: crypto.randomUUID(), created_at: now };
    withSync(studySessions, setStudySessions, plannerStorage.saveStudySessions, plannerSync.syncSingleStudySession, newSession);
  }, [studySessions, withSync]);

  const updateStudySession = useCallback((sessionId: string, updates: Partial<StudySession>) => {
    updateWithSync(studySessions, setStudySessions, plannerStorage.saveStudySessions, plannerSync.syncSingleStudySession, sessionId, updates);
  }, [studySessions, updateWithSync]);

  // Planner Config
  const upsertPlannerConfig = useCallback((payload: Omit<PlannerConfig, 'id' | 'created_at' | 'updated_at'>) => {
    const now = new Date().toISOString();
    setPlannerConfigs(prev => {
      const existingIndex = prev.findIndex(c => c.subject_code === payload.subject_code && c.user_id === payload.user_id);
      let updated: PlannerConfig[];
      if (existingIndex >= 0) {
        updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], ...payload, updated_at: now };
      } else {
        const newConfig: PlannerConfig = { ...payload, id: crypto.randomUUID(), created_at: now, updated_at: now };
        updated = [...prev, newConfig];
      }
      plannerStorage.savePlannerConfigs(updated);
      if (user) {
        setSyncStatus('Syncing');
        plannerSync.syncSinglePlannerConfig(user.id, existingIndex >= 0 ? updated[existingIndex] : updated[updated.length - 1])
          .then(() => { setSyncStatus('Synced'); setSyncError(''); })
          .catch(() => { setSyncStatus('Error'); setSyncError('Config sync failed'); });
      }
      return updated;
    });
  }, [user]);

  // Computed
  const getReverseCountdownPlan = useCallback((subjectCode: string): ReverseCountdownPlan | null => {
    const config = plannerConfigs.find(c => c.subject_code === subjectCode);
    const subjectExams = exams.filter(e => e.subject_code === subjectCode);
    const endsemExam = subjectExams.find(e => e.exam_type === 'ENDSEM');
    
    if (!config || !endsemExam) return null;
    
    return generateReverseCountdownPlan(
      subjectCode,
      topics,
      coverage,
      exams,
      config,
      studySessions
    );
  }, [topics, coverage, exams, plannerConfigs, studySessions]);

  const getNextReview = useCallback((topicId: string): Date | null => {
    const cov = coverage.find(c => c.topic_id === topicId);
    if (!cov) return null;
    return getNextReviewDate(cov);
  }, [coverage]);

  const getTopicPriority = useCallback((topicId: string): number => {
    const topic = topics.find(t => t.id === topicId);
    const cov = coverage.find(c => c.topic_id === topicId);
    const config = topic ? plannerConfigs.find(c => c.subject_code === topic.subject_code) : null;
    const endsemExam = topic ? exams.find(e => e.subject_code === topic.subject_code && e.exam_type === 'ENDSEM') : null;
    
    if (!topic || !config || !endsemExam) return 0;
    
    const targetDate = new Date(config.target_exam_date);
    const today = new Date();
    const daysUntilExam = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return calculateTopicPriority(topic, cov, daysUntilExam);
  }, [topics, coverage, plannerConfigs, exams]);

  const getTodayPlan = useCallback((subjectCode?: string): DailyStudyPlan[] => {
    const today = new Date().toISOString().split('T')[0];
    return dailyPlans.filter(p => 
      p.plan_date === today && 
      p.status !== 'COMPLETED' && 
      p.status !== 'SKIPPED' &&
      (!subjectCode || p.subject_code === subjectCode)
    ).sort((a, b) => a.priority - b.priority);
  }, [dailyPlans]);

  const getUpcomingExams = useCallback((days: number = 30): ExamSchedule[] => {
    const today = new Date();
    const future = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
    return exams.filter(e => {
      const examDate = new Date(e.exam_date);
      return examDate >= today && examDate <= future && e.is_confirmed;
    }).sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime());
  }, [exams]);

  return (
    <PlannerContext.Provider value={{
      topics, coverage, exams, pastPapers, practice, dailyPlans, studySessions, plannerConfigs,
      addTopic, updateTopic, deleteTopic,
      upsertCoverage,
      addExam, updateExam, deleteExam,
      addPastPaper, updatePastPaper, deletePastPaper,
      addPractice, updatePractice,
      addDailyPlan, updateDailyPlan, deleteDailyPlan,
      addStudySession, updateStudySession,
      upsertPlannerConfig,
      getReverseCountdownPlan,
      getNextReview,
      getTopicPriority,
      getTodayPlan,
      getUpcomingExams,
      syncStatus,
      syncError,
      isLoaded,
    }}>
      {children}
    </PlannerContext.Provider>
  );
}

export function usePlanner() {
  const ctx = useContext(PlannerContext);
  if (!ctx) throw new Error('usePlanner must be used within PlannerProvider');
  return ctx;
}
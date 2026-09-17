import { 
  SyllabusTopic, 
  TopicCoverage, 
  ExamSchedule, 
  PastPaper, 
  PaperPractice, 
  DailyStudyPlan, 
  StudySession, 
  PlannerConfig 
} from '@/lib/types';

const KEYS = {
  topics: 'planner_topics_v1',
  coverage: 'planner_coverage_v1',
  exams: 'planner_exams_v1',
  pastPapers: 'planner_past_papers_v1',
  practice: 'planner_practice_v1',
  dailyPlans: 'planner_daily_plans_v1',
  studySessions: 'planner_study_sessions_v1',
  plannerConfigs: 'planner_configs_v1',
} as const;

function loadJSON<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, data: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

export const plannerStorage = {
  loadTopics: (): SyllabusTopic[] => loadJSON<SyllabusTopic[]>(KEYS.topics, []),
  saveTopics: (items: SyllabusTopic[]) => saveJSON(KEYS.topics, items),
  
  loadCoverage: (): TopicCoverage[] => loadJSON<TopicCoverage[]>(KEYS.coverage, []),
  saveCoverage: (items: TopicCoverage[]) => saveJSON(KEYS.coverage, items),
  
  loadExams: (): ExamSchedule[] => loadJSON<ExamSchedule[]>(KEYS.exams, []),
  saveExams: (items: ExamSchedule[]) => saveJSON(KEYS.exams, items),
  
  loadPastPapers: (): PastPaper[] => loadJSON<PastPaper[]>(KEYS.pastPapers, []),
  savePastPapers: (items: PastPaper[]) => saveJSON(KEYS.pastPapers, items),
  
  loadPractice: (): PaperPractice[] => loadJSON<PaperPractice[]>(KEYS.practice, []),
  savePractice: (items: PaperPractice[]) => saveJSON(KEYS.practice, items),
  
  loadDailyPlans: (): DailyStudyPlan[] => loadJSON<DailyStudyPlan[]>(KEYS.dailyPlans, []),
  saveDailyPlans: (items: DailyStudyPlan[]) => saveJSON(KEYS.dailyPlans, items),
  
  loadStudySessions: (): StudySession[] => loadJSON<StudySession[]>(KEYS.studySessions, []),
  saveStudySessions: (items: StudySession[]) => saveJSON(KEYS.studySessions, items),
  
  loadPlannerConfigs: (): PlannerConfig[] => loadJSON<PlannerConfig[]>(KEYS.plannerConfigs, []),
  savePlannerConfigs: (items: PlannerConfig[]) => saveJSON(KEYS.plannerConfigs, items),
  
  saveAll: (
    topics: SyllabusTopic[],
    coverage: TopicCoverage[],
    exams: ExamSchedule[],
    pastPapers: PastPaper[],
    practice: PaperPractice[],
    dailyPlans: DailyStudyPlan[],
    studySessions: StudySession[],
    plannerConfigs: PlannerConfig[]
  ) => {
    saveJSON(KEYS.topics, topics);
    saveJSON(KEYS.coverage, coverage);
    saveJSON(KEYS.exams, exams);
    saveJSON(KEYS.pastPapers, pastPapers);
    saveJSON(KEYS.practice, practice);
    saveJSON(KEYS.dailyPlans, dailyPlans);
    saveJSON(KEYS.studySessions, studySessions);
    saveJSON(KEYS.plannerConfigs, plannerConfigs);
  },
  
  reset: () => {
    Object.values(KEYS).forEach(key => saveJSON(key, []));
  },
  
  exportData: (
    topics: SyllabusTopic[],
    coverage: TopicCoverage[],
    exams: ExamSchedule[],
    pastPapers: PastPaper[],
    practice: PaperPractice[],
    dailyPlans: DailyStudyPlan[],
    studySessions: StudySession[],
    plannerConfigs: PlannerConfig[]
  ): string => {
    return JSON.stringify({
      topics, coverage, exams, pastPapers, practice, dailyPlans, studySessions, plannerConfigs,
      exportedAt: new Date().toISOString()
    }, null, 2);
  },
  
  importData: (json: string): {
    topics: SyllabusTopic[];
    coverage: TopicCoverage[];
    exams: ExamSchedule[];
    pastPapers: PastPaper[];
    practice: PaperPractice[];
    dailyPlans: DailyStudyPlan[];
    studySessions: StudySession[];
    plannerConfigs: PlannerConfig[];
  } | null => {
    try {
      const data = JSON.parse(json);
      if (data.topics) saveJSON(KEYS.topics, data.topics);
      if (data.coverage) saveJSON(KEYS.coverage, data.coverage);
      if (data.exams) saveJSON(KEYS.exams, data.exams);
      if (data.pastPapers) saveJSON(KEYS.pastPapers, data.pastPapers);
      if (data.practice) saveJSON(KEYS.practice, data.practice);
      if (data.dailyPlans) saveJSON(KEYS.dailyPlans, data.dailyPlans);
      if (data.studySessions) saveJSON(KEYS.studySessions, data.studySessions);
      if (data.plannerConfigs) saveJSON(KEYS.plannerConfigs, data.plannerConfigs);
      return {
        topics: data.topics || [],
        coverage: data.coverage || [],
        exams: data.exams || [],
        pastPapers: data.pastPapers || [],
        practice: data.practice || [],
        dailyPlans: data.dailyPlans || [],
        studySessions: data.studySessions || [],
        plannerConfigs: data.plannerConfigs || [],
      };
    } catch {
      return null;
    }
  },
};
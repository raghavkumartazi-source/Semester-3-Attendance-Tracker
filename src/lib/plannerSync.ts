import { 
  SyllabusTopic, 
  TopicCoverage, 
  ExamSchedule, 
  PastPaper, 
  PaperPractice, 
  DailyStudyPlan, 
  StudySession, 
  PlannerConfig,
  CoverageStatus
} from '@/lib/types';
import { supabase } from './supabase';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTopicFromDB(row: any): SyllabusTopic {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_code: row.subject_code,
    topic_code: row.topic_code,
    topic_name: row.topic_name,
    unit_number: row.unit_number,
    order_in_subject: row.order_in_subject,
    estimated_hours: row.estimated_hours,
    difficulty: row.difficulty,
    weightage_estimate: row.weightage_estimate,
    is_core: row.is_core,
    prerequisites: row.prerequisites || [],
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCoverageFromDB(row: any): TopicCoverage {
  return {
    id: row.id,
    user_id: row.user_id,
    topic_id: row.topic_id,
    status: row.status,
    confidence: row.confidence,
    hours_spent: row.hours_spent,
    last_studied: row.last_studied,
    last_revised: row.last_revised,
    next_review: row.next_review,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExamFromDB(row: any): ExamSchedule {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_code: row.subject_code,
    exam_type: row.exam_type,
    exam_name: row.exam_name,
    exam_date: row.exam_date,
    start_time: row.start_time,
    end_time: row.end_time,
    venue: row.venue,
    syllabus_coverage: row.syllabus_coverage || [],
    max_marks: row.max_marks,
    weightage: row.weightage,
    is_confirmed: row.is_confirmed,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPaperFromDB(row: any): PastPaper {
  return {
    id: row.id,
    user_id: row.user_id,
    subject_code: row.subject_code,
    year: row.year,
    exam_type: row.exam_type,
    semester: row.semester,
    file_path: row.file_path,
    file_name: row.file_name,
    has_solutions: row.has_solutions,
    solution_file_path: row.solution_file_path,
    topics_covered: row.topics_covered || [],
    difficulty_rating: row.difficulty_rating as number | null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) || (row.created_at as string),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPracticeFromDB(row: any): PaperPractice {
  return {
    id: row.id,
    user_id: row.user_id,
    paper_id: row.paper_id,
    attempted_date: row.attempted_date,
    score_obtained: row.score_obtained,
    max_score: row.max_score,
    time_taken_minutes: row.time_taken_minutes,
    questions_attempted: row.questions_attempted,
    total_questions: row.total_questions,
    weak_topics: (row.weak_topics as string[]) || [],
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) || (row.created_at as string),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPlanFromDB(row: any): DailyStudyPlan {
  return {
    id: row.id,
    user_id: row.user_id,
    plan_date: row.plan_date,
    subject_code: row.subject_code,
    topic_id: row.topic_id,
    planned_hours: row.planned_hours,
    actual_hours: row.actual_hours,
    session_type: row.session_type,
    priority: row.priority,
    status: row.status,
    notes: row.notes,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSessionFromDB(row: any): StudySession {
  return {
    id: row.id,
    user_id: row.user_id,
    session_date: row.session_date,
    start_time: row.start_time,
    end_time: row.end_time,
    subject_code: row.subject_code,
    topic_id: row.topic_id,
    session_type: row.session_type,
    planned_duration_minutes: row.planned_duration_minutes,
    actual_duration_minutes: row.actual_duration_minutes,
    focus_rating: row.focus_rating,
    coverage_status: row.coverage_status as CoverageStatus | null,
    notes: row.notes as string | null,
    created_at: row.created_at as string,
    updated_at: (row.updated_at as string) || (row.created_at as string),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapConfigFromDB(row: any): PlannerConfig {
  return {
    id: row.id as string,
    user_id: row.user_id as string,
    subject_code: row.subject_code as string,
    target_exam_date: row.target_exam_date as string,
    buffer_days: row.buffer_days as number,
    revision_cycles: row.revision_cycles as number,
    daily_study_hours: row.daily_study_hours as number,
    preferred_session_length_minutes: row.preferred_session_length_minutes as number,
    break_between_sessions_minutes: row.break_between_sessions_minutes as number,
    weak_topic_extra_time_multiplier: row.weak_topic_extra_time_multiplier as number,
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTopicToDB(topic: SyllabusTopic): any {
  return {
    id: topic.id,
    user_id: topic.user_id,
    subject_code: topic.subject_code,
    topic_code: topic.topic_code,
    topic_name: topic.topic_name,
    unit_number: topic.unit_number,
    order_in_subject: topic.order_in_subject,
    estimated_hours: topic.estimated_hours,
    difficulty: topic.difficulty,
    weightage_estimate: topic.weightage_estimate,
    is_core: topic.is_core,
    prerequisites: topic.prerequisites,
    created_at: topic.created_at,
    updated_at: topic.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapCoverageToDB(cov: TopicCoverage): any {
  return {
    id: cov.id,
    user_id: cov.user_id,
    topic_id: cov.topic_id,
    status: cov.status,
    confidence: cov.confidence,
    hours_spent: cov.hours_spent,
    last_studied: cov.last_studied,
    last_revised: cov.last_revised,
    next_review: cov.next_review,
    notes: cov.notes,
    created_at: cov.created_at,
    updated_at: cov.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapExamToDB(exam: ExamSchedule): any {
  return {
    id: exam.id,
    user_id: exam.user_id,
    subject_code: exam.subject_code,
    exam_type: exam.exam_type,
    exam_name: exam.exam_name,
    exam_date: exam.exam_date,
    start_time: exam.start_time,
    end_time: exam.end_time,
    venue: exam.venue,
    syllabus_coverage: exam.syllabus_coverage,
    max_marks: exam.max_marks,
    weightage: exam.weightage,
    is_confirmed: exam.is_confirmed,
    created_at: exam.created_at,
    updated_at: exam.updated_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapPaperToDB(paper: PastPaper): any {
  return {
    id: paper.id,
    user_id: paper.user_id,
    subject_code: paper.subject_code,
    year: paper.year,
    exam_type: paper.exam_type,
    semester: paper.semester,
    file_path: paper.file_path,
    file_name: paper.file_name,
    has_solutions: paper.has_solutions,
    solution_file_path: paper.solution_file_path,
    topics_covered: paper.topics_covered,
    difficulty_rating: paper.difficulty_rating,
    created_at: paper.created_at,
    updated_at: paper.updated_at,
  };
}

function mapPracticeToDB(practice: PaperPractice) {
  return {
    id: practice.id,
    user_id: practice.user_id,
    paper_id: practice.paper_id,
    attempted_date: practice.attempted_date,
    score_obtained: practice.score_obtained,
    max_score: practice.max_score,
    time_taken_minutes: practice.time_taken_minutes,
    questions_attempted: practice.questions_attempted,
    total_questions: practice.total_questions,
    weak_topics: practice.weak_topics,
    notes: practice.notes,
    created_at: practice.created_at,
    updated_at: practice.updated_at,
  };
}

function mapPlanToDB(plan: DailyStudyPlan) {
  return {
    id: plan.id,
    user_id: plan.user_id,
    plan_date: plan.plan_date,
    subject_code: plan.subject_code,
    topic_id: plan.topic_id,
    planned_hours: plan.planned_hours,
    actual_hours: plan.actual_hours,
    session_type: plan.session_type,
    priority: plan.priority,
    status: plan.status,
    notes: plan.notes,
    created_at: plan.created_at,
    updated_at: plan.updated_at,
  };
}

function mapSessionToDB(session: StudySession) {
  return {
    id: session.id,
    user_id: session.user_id,
    session_date: session.session_date,
    start_time: session.start_time,
    end_time: session.end_time,
    subject_code: session.subject_code,
    topic_id: session.topic_id,
    session_type: session.session_type,
    planned_duration_minutes: session.planned_duration_minutes,
    actual_duration_minutes: session.actual_duration_minutes,
    focus_rating: session.focus_rating,
    coverage_status: session.coverage_status,
    notes: session.notes,
    created_at: session.created_at,
    updated_at: session.updated_at,
  };
}

function mapConfigToDB(config: PlannerConfig) {
  return {
    id: config.id,
    user_id: config.user_id,
    subject_code: config.subject_code,
    target_exam_date: config.target_exam_date,
    buffer_days: config.buffer_days,
    revision_cycles: config.revision_cycles,
    daily_study_hours: config.daily_study_hours,
    preferred_session_length_minutes: config.preferred_session_length_minutes,
    break_between_sessions_minutes: config.break_between_sessions_minutes,
    weak_topic_extra_time_multiplier: config.weak_topic_extra_time_multiplier,
    created_at: config.created_at,
    updated_at: config.updated_at,
  };
}

export const plannerSync = {
  async fetchCloudTopics(userId: string): Promise<SyllabusTopic[]> {
    const { data, error } = await supabase
      .from('syllabus_topics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapTopicFromDB);
  },

  async fetchCloudCoverage(userId: string): Promise<TopicCoverage[]> {
    const { data, error } = await supabase
      .from('topic_coverage')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapCoverageFromDB);
  },

  async fetchCloudExams(userId: string): Promise<ExamSchedule[]> {
    const { data, error } = await supabase
      .from('exam_schedule')
      .select('*')
      .eq('user_id', userId)
      .order('exam_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapExamFromDB);
  },

  async fetchCloudPastPapers(userId: string): Promise<PastPaper[]> {
    const { data, error } = await supabase
      .from('past_papers')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapPaperFromDB);
  },

  async fetchCloudPractice(userId: string): Promise<PaperPractice[]> {
    const { data, error } = await supabase
      .from('paper_practice')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapPracticeFromDB);
  },

  async fetchCloudDailyPlans(userId: string): Promise<DailyStudyPlan[]> {
    const { data, error } = await supabase
      .from('daily_study_plan')
      .select('*')
      .eq('user_id', userId)
      .order('plan_date', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapPlanFromDB);
  },

  async fetchCloudStudySessions(userId: string): Promise<StudySession[]> {
    const { data, error } = await supabase
      .from('study_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('session_date', { ascending: false });
    if (error) throw error;
    return (data || []).map(mapSessionFromDB);
  },

  async fetchCloudPlannerConfigs(userId: string): Promise<PlannerConfig[]> {
    const { data, error } = await supabase
      .from('planner_config')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(mapConfigFromDB);
  },

  async uploadLocalTopics(userId: string, topics: SyllabusTopic[]): Promise<void> {
    const payload = topics.map(mapTopicToDB);
    const { error } = await supabase.from('syllabus_topics').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalCoverage(userId: string, coverage: TopicCoverage[]): Promise<void> {
    const payload = coverage.map(mapCoverageToDB);
    const { error } = await supabase.from('topic_coverage').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalExams(userId: string, exams: ExamSchedule[]): Promise<void> {
    const payload = exams.map(mapExamToDB);
    const { error } = await supabase.from('exam_schedule').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalPastPapers(userId: string, papers: PastPaper[]): Promise<void> {
    const payload = papers.map(mapPaperToDB);
    const { error } = await supabase.from('past_papers').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalPractice(userId: string, practice: PaperPractice[]): Promise<void> {
    const payload = practice.map(mapPracticeToDB);
    const { error } = await supabase.from('paper_practice').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalDailyPlans(userId: string, plans: DailyStudyPlan[]): Promise<void> {
    const payload = plans.map(mapPlanToDB);
    const { error } = await supabase.from('daily_study_plan').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalStudySessions(userId: string, sessions: StudySession[]): Promise<void> {
    const payload = sessions.map(mapSessionToDB);
    const { error } = await supabase.from('study_sessions').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async uploadLocalPlannerConfigs(userId: string, configs: PlannerConfig[]): Promise<void> {
    const payload = configs.map(mapConfigToDB);
    const { error } = await supabase.from('planner_config').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleTopic(userId: string, topic: SyllabusTopic): Promise<void> {
    const payload = mapTopicToDB(topic);
    const { error } = await supabase.from('syllabus_topics').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleCoverage(userId: string, coverage: TopicCoverage): Promise<void> {
    const payload = mapCoverageToDB(coverage);
    const { error } = await supabase.from('topic_coverage').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleExam(userId: string, exam: ExamSchedule): Promise<void> {
    const payload = mapExamToDB(exam);
    const { error } = await supabase.from('exam_schedule').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSinglePastPaper(userId: string, paper: PastPaper): Promise<void> {
    const payload = mapPaperToDB(paper);
    const { error } = await supabase.from('past_papers').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSinglePractice(userId: string, practice: PaperPractice): Promise<void> {
    const payload = mapPracticeToDB(practice);
    const { error } = await supabase.from('paper_practice').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleDailyPlan(userId: string, plan: DailyStudyPlan): Promise<void> {
    const payload = mapPlanToDB(plan);
    const { error } = await supabase.from('daily_study_plan').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSingleStudySession(userId: string, session: StudySession): Promise<void> {
    const payload = mapSessionToDB(session);
    const { error } = await supabase.from('study_sessions').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },

  async syncSinglePlannerConfig(userId: string, config: PlannerConfig): Promise<void> {
    const payload = mapConfigToDB(config);
    const { error } = await supabase.from('planner_config').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
  },
};
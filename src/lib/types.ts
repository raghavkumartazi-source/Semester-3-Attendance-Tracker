// Types for the attendance tracker application

export type AttendanceStatus = 'UNMARKED' | 'PRESENT' | 'ABSENT' | 'CANCELLED';

export type ClassType = 'Lecture' | 'Tutorial' | 'Lab';

export type AttendanceLevel = 'SAFE' | 'WARNING' | 'DANGER' | 'NO_DATA';

export interface Subject {
  code: string;
  name: string;
  shortName: string;
  lectures: number;
  tutorials: number;
  practicals: number;
}

export interface TimetableSlot {
  day: number; // 0=Sun, 1=Mon, ..., 5=Fri, 6=Sat
  subjectCode: string;
  startTime: string; // "HH:MM"
  endTime: string;   // "HH:MM"
  classType: ClassType;
}

export interface Session {
  id: string;
  subjectCode: string;
  date: string;       // "YYYY-MM-DD"
  day: number;        // 0-6
  startTime: string;  // "HH:MM"
  endTime: string;    // "HH:MM"
  classType: ClassType;
  status: AttendanceStatus;
  isExtra: boolean;
  updatedAt?: string; // ISO timestamp string (consistent with cloud & other providers)
}

export interface SubjectAttendance {
  present: number;
  absent: number;
  cancelled: number;
  unmarked: number;
  totalConducted: number;
  percentage: number | null;
  canBunk: number;
  needToAttend: number;
  level: AttendanceLevel;
}

export interface OverallAttendance {
  totalPresent: number;
  totalAbsent: number;
  totalConducted: number;
  percentage: number | null;
  level: AttendanceLevel;
}

export type SortOrder = 'lowest' | 'highest' | 'code';

export type TaskType = 'STUDY' | 'ASSIGNMENT' | 'PRACTICE' | 'REVISION' | 'PROJECT' | 'QUIZ_PREP' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH';

export interface Task {
  id: string;
  user_id?: string;
  title: string;
  subject_id: string | null;
  type: TaskType;
  due_at: string | null; // ISO string
  priority: TaskPriority;
  completed: boolean;
  completed_at: string | null; // ISO string
  deleted_at: string | null; // ISO string for tombstones
  notes: string | null;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  estimated_minutes?: number | null;
}

export type WorkSessionStatus = 'PLANNED' | 'COMPLETED' | 'CANCELLED';

export interface WorkSession {
  id: string;
  user_id?: string;
  task_id: string | null;
  planned_start: string; // ISO string
  planned_end: string; // ISO string
  status: WorkSessionStatus;
  created_at: string; // ISO string
  updated_at: string; // ISO string
  deleted_at: string | null; // ISO string for tombstones
}

// =============================================================================
// MARKS & GRADE TRACKER TYPES
// =============================================================================

export type MarkComponentType = 
  | 'MIDSEM' 
  | 'ENDSEM' 
  | 'QUIZ' 
  | 'ASSIGNMENT' 
  | 'LAB' 
  | 'VIVA' 
  | 'PROJECT' 
  | 'ATTENDANCE' 
  | 'OTHER';

export interface MarkComponent {
  id: string;
  user_id?: string;
  subject_code: string;
  component_type: MarkComponentType;
  component_name: string;
  weightage: number;        // percentage weight in final grade
  scored: number | null;    // marks obtained (null = not yet taken)
  max_marks: number;        // total marks for this component
  date: string | null;      // "YYYY-MM-DD"
  is_published: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface SubjectGradeConfig {
  id: string;
  user_id?: string;
  subject_code: string;
  grade_aa_min: number;
  grade_ab_min: number;
  grade_bb_min: number;
  grade_bc_min: number;
  grade_cc_min: number;
  grade_cd_min: number;
  grade_dd_min: number;
  credits: number;
  created_at: string;
  updated_at: string;
}

export type GradeLetter = 'AA' | 'AB' | 'BB' | 'BC' | 'CC' | 'CD' | 'DD' | 'F';

export interface GradeBoundary {
  grade: GradeLetter;
  min_percentage: number;
  grade_points: number; // 10, 9, 8, 7, 6, 5, 4, 0
}

export interface SubjectMarksSummary {
  subject_code: string;
  subject_name: string;
  components: MarkComponent[];
  total_weightage: number;
  earned_weightage: number;       // sum of (scored/max_marks * weightage) for published components
  pending_weightage: number;      // weightage of unpublished/not-taken components
  current_percentage: number | null; // earned_weightage / total_weightage * 100 (only published)
  projected_percentage: number | null; // if all pending scored at current rate
  best_case_percentage: number;   // all pending = 100%
  worst_case_percentage: number;  // all pending = 0%
  current_grade: GradeLetter | null;
  projected_grade: GradeLetter | null;
  credits: number;
  grade_points: number | null;
}

export interface OverallGradeSummary {
  subjects: SubjectMarksSummary[];
  sgpa: number | null;
  cgpa: number | null; // if previous semesters stored
  total_credits: number;
  earned_credits: number;
}

export interface GradeScenario {
  id: string;
  user_id?: string;
  subject_code: string;
  name: string;
  assumptions: Record<string, number>; // component_id -> assumed_percentage (0-100)
  projected_final_percentage: number | null;
  projected_grade: GradeLetter | null;
  created_at: string;
  updated_at: string;
}

// =============================================================================
// EXAM PREPARATION PLANNER TYPES
// =============================================================================

export interface SyllabusTopic {
  id: string;
  user_id?: string;
  subject_code: string;
  topic_code: string;
  topic_name: string;
  unit_number: number | null;
  order_in_subject: number;
  estimated_hours: number;
  difficulty: number; // 1-5
  weightage_estimate: number | null;
  is_core: boolean;
  prerequisites: string[]; // topic_codes
  created_at: string;
  updated_at: string;
}

export type CoverageStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COVERED' | 'REVISING' | 'MASTERED';

export interface TopicCoverage {
  id: string;
  user_id?: string;
  topic_id: string;
  status: CoverageStatus;
  confidence: number; // 0-100
  hours_spent: number;
  last_studied: string | null; // "YYYY-MM-DD"
  last_revised: string | null;
  next_review: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type ExamType = 'MIDSEM' | 'ENDSEM' | 'QUIZ' | 'LAB_EXAM' | 'VIVA' | 'ASSIGNMENT_DUE';

export interface ExamSchedule {
  id: string;
  user_id?: string;
  subject_code: string;
  exam_type: ExamType;
  exam_name: string;
  exam_date: string; // "YYYY-MM-DD"
  start_time: string | null; // "HH:MM"
  end_time: string | null;
  venue: string | null;
  syllabus_coverage: string[]; // topic_codes
  max_marks: number | null;
  weightage: number | null;
  is_confirmed: boolean;
  created_at: string;
  updated_at: string;
}

export interface PastPaper {
  id: string;
  user_id?: string;
  subject_code: string;
  year: number;
  exam_type: 'MIDSEM' | 'ENDSEM' | 'QUIZ';
  semester: string | null;
  file_path: string | null;
  file_name: string | null;
  has_solutions: boolean;
  solution_file_path: string | null;
  topics_covered: string[]; // topic_codes
  difficulty_rating: number | null; // 1-5
  created_at: string;
  updated_at: string;
}

export interface PaperPractice {
  id: string;
  user_id?: string;
  paper_id: string;
  attempted_date: string; // "YYYY-MM-DD"
  score_obtained: number | null;
  max_score: number | null;
  time_taken_minutes: number | null;
  questions_attempted: number | null;
  total_questions: number | null;
  weak_topics: string[]; // topic_codes
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export type StudySessionType = 'NEW_TOPIC' | 'REVISION' | 'PRACTICE' | 'MOCK_TEST' | 'DOUBT_CLEARING';
export type PlanStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'SKIPPED' | 'RESCHEDULED';

export interface DailyStudyPlan {
  id: string;
  user_id?: string;
  plan_date: string; // "YYYY-MM-DD"
  subject_code: string;
  topic_id: string | null;
  planned_hours: number;
  actual_hours: number;
  session_type: StudySessionType;
  priority: number; // 1=high, 2=med, 3=low
  status: PlanStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  user_id?: string;
  session_date: string; // "YYYY-MM-DD"
  start_time: string; // ISO timestamp
  end_time: string | null;
  subject_code: string;
  topic_id: string | null;
  session_type: StudySessionType;
  planned_duration_minutes: number | null;
  actual_duration_minutes: number | null;
  focus_rating: number | null; // 1-5
  coverage_status: CoverageStatus | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface PlannerConfig {
  id: string;
  user_id?: string;
  subject_code: string;
  target_exam_date: string; // "YYYY-MM-DD"
  buffer_days: number;
  revision_cycles: number;
  daily_study_hours: number;
  preferred_session_length_minutes: number;
  break_between_sessions_minutes: number;
  weak_topic_extra_time_multiplier: number;
  created_at: string;
  updated_at: string;
}

// Reverse countdown algorithm output
export interface ReverseCountdownPlan {
  subject_code: string;
  target_date: string;
  days_remaining: number;
  study_days_available: number;
  total_topics: number;
  covered_topics: number;
  remaining_topics: number;
  total_estimated_hours: number;
  hours_per_day_needed: number;
  daily_plan: DailyStudyPlan[];
  milestones: {
    date: string;
    label: string;
    topics_to_complete: string[];
  }[];
  warnings: string[];
}
-- Additive repair. Verified app-data backup saved before applying.
-- Existing attendance/tasks/work_sessions rows are retained.

-- ==============================================================================
-- MARKS & GRADE TRACKER SCHEMA
-- Semester Scorecard: weighted components, grade boundaries, what-if simulator
-- ==============================================================================

-- Component types per subject (midsem, endsem, quizzes, assignments, labs, etc.)
DO $$ BEGIN
CREATE TYPE public.mark_component_type AS ENUM (
  'MIDSEM', 'ENDSEM', 'QUIZ', 'ASSIGNMENT', 'LAB', 'VIVA', 'PROJECT', 'ATTENDANCE', 'OTHER'
);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Marks table: each assessment component for a subject
CREATE TABLE IF NOT EXISTS public.marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  component_type public.mark_component_type NOT NULL,
  component_name TEXT NOT NULL,           -- e.g., "Quiz 1", "Midsem", "Lab 3"
  weightage DECIMAL(5,2) NOT NULL,        -- percentage weight in final grade (e.g., 20.00)
  scored DECIMAL(6,2),                    -- marks obtained (NULL = not yet taken)
  max_marks DECIMAL(6,2) NOT NULL,        -- total marks for this component
  date DATE,                              -- when it was/will be conducted
  is_published BOOLEAN DEFAULT FALSE,     -- results released?
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT marks_weightage_positive CHECK (weightage > 0),
  CONSTRAINT marks_scored_not_exceed_max CHECK (scored IS NULL OR scored <= max_marks),
  CONSTRAINT marks_scored_non_negative CHECK (scored IS NULL OR scored >= 0)
);

-- Subject grade configuration (IIT BHU grading schema per subject)
CREATE TABLE IF NOT EXISTS public.subject_grade_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,

  -- Grade boundaries (minimum percentage for each grade)
  -- IIT BHU typical: AA>=80, AB>=70, BB>=60, BC>=50, CC>=40, CD>=35, DD>=30, F<30
  grade_aa_min DECIMAL(5,2) DEFAULT 80.00,
  grade_ab_min DECIMAL(5,2) DEFAULT 70.00,
  grade_bb_min DECIMAL(5,2) DEFAULT 60.00,
  grade_bc_min DECIMAL(5,2) DEFAULT 50.00,
  grade_cc_min DECIMAL(5,2) DEFAULT 40.00,
  grade_cd_min DECIMAL(5,2) DEFAULT 35.00,
  grade_dd_min DECIMAL(5,2) DEFAULT 30.00,

  -- Credits for CGPA calculation
  credits INTEGER NOT NULL DEFAULT 4,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- What-if scenarios for grade simulation
CREATE TABLE IF NOT EXISTS public.grade_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  name TEXT NOT NULL,                     -- e.g., "Target AA", "Conservative"
  -- For each pending component, what score % we assume
  assumptions JSONB NOT NULL,             -- { "component_id": assumed_percentage, ... }
  projected_final_percentage DECIMAL(5,2),
  projected_grade TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_marks_user_subject ON public.marks(user_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_marks_user_date ON public.marks(user_id, date);
CREATE INDEX IF NOT EXISTS idx_grade_config_user ON public.subject_grade_config(user_id);
CREATE INDEX IF NOT EXISTS idx_scenarios_user_subject ON public.grade_scenarios(user_id, subject_code);

-- RLS
ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subject_grade_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_scenarios ENABLE ROW LEVEL SECURITY;

-- Policies
DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'marks' AND policyname = 'Users manage their own marks') THEN
  CREATE POLICY "Users manage their own marks" ON public.marks
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subject_grade_config' AND policyname = 'Users manage their own grade config') THEN
  CREATE POLICY "Users manage their own grade config" ON public.subject_grade_config
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'grade_scenarios' AND policyname = 'Users manage their own scenarios') THEN
  CREATE POLICY "Users manage their own scenarios" ON public.grade_scenarios
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
END IF; END $policy$;

-- Grants
REVOKE ALL ON public.marks FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.marks TO authenticated;
REVOKE ALL ON public.subject_grade_config FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subject_grade_config TO authenticated;
REVOKE ALL ON public.grade_scenarios FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.grade_scenarios TO authenticated;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY INVOKER SET search_path = '';

DROP TRIGGER IF EXISTS update_marks_updated_at ON public.marks;
CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON public.marks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_grade_config_updated_at ON public.subject_grade_config;
CREATE TRIGGER update_grade_config_updated_at BEFORE UPDATE ON public.subject_grade_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_scenarios_updated_at ON public.grade_scenarios;
CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON public.grade_scenarios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================================================
-- EXAM PREPARATION PLANNER SCHEMA
-- Reverse Countdown: syllabus topics, daily targets, past paper scheduler
-- ==============================================================================

-- Syllabus topics per subject (from your syllabus PDFs)
CREATE TABLE IF NOT EXISTS public.syllabus_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  topic_code TEXT NOT NULL,               -- e.g., "EC201-U1", "MA201-Laplace"
  topic_name TEXT NOT NULL,               -- "PN Junction Diode", "Laplace Transform"
  unit_number INTEGER,                    -- syllabus unit/chapter number
  order_in_subject INTEGER NOT NULL,      -- study order
  estimated_hours DECIMAL(4,1) DEFAULT 2.0, -- estimated study time
  difficulty INTEGER DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5), -- 1=easy, 5=hard
  weightage_estimate DECIMAL(5,2),        -- estimated exam weightage %
  is_core BOOLEAN DEFAULT TRUE,           -- core vs optional
  prerequisites TEXT[],                   -- array of topic_codes that should be done first
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, subject_code, topic_code)
);

-- Syllabus coverage tracking
CREATE TABLE IF NOT EXISTS public.topic_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.syllabus_topics(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'NOT_STARTED'
    CHECK (status IN ('NOT_STARTED', 'IN_PROGRESS', 'COVERED', 'REVISING', 'MASTERED')),
  confidence INTEGER DEFAULT 0 CHECK (confidence BETWEEN 0 AND 100), -- self-assessed mastery
  hours_spent DECIMAL(4,1) DEFAULT 0,
  last_studied DATE,
  last_revised DATE,
  next_review DATE,                       -- spaced repetition
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, topic_id)
);

-- Exam schedule (midsem, endsem, quizzes)
CREATE TABLE IF NOT EXISTS public.exam_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  exam_type TEXT NOT NULL
    CHECK (exam_type IN ('MIDSEM', 'ENDSEM', 'QUIZ', 'LAB_EXAM', 'VIVA', 'ASSIGNMENT_DUE')),
  exam_name TEXT NOT NULL,                -- "Midsem", "Endsem", "Quiz 1"
  exam_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  venue TEXT,
  syllabus_coverage TEXT[],               -- array of topic_codes covered
  max_marks INTEGER,
  weightage DECIMAL(5,2),                 -- weight in final grade
  is_confirmed BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Past paper database
CREATE TABLE IF NOT EXISTS public.past_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  year INTEGER NOT NULL,
  exam_type TEXT NOT NULL
    CHECK (exam_type IN ('MIDSEM', 'ENDSEM', 'QUIZ')),
  semester TEXT,                          -- "Odd 2024-25", "Even 2023-24"
  file_path TEXT,                         -- local/path or supabase storage
  file_name TEXT,
  has_solutions BOOLEAN DEFAULT FALSE,
  solution_file_path TEXT,
  topics_covered TEXT[],                  -- array of topic_codes
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Past paper practice log
CREATE TABLE IF NOT EXISTS public.paper_practice (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  paper_id UUID NOT NULL REFERENCES public.past_papers(id) ON DELETE CASCADE,
  attempted_date DATE NOT NULL DEFAULT CURRENT_DATE,
  score_obtained DECIMAL(5,2),
  max_score DECIMAL(5,2),
  time_taken_minutes INTEGER,
  questions_attempted INTEGER,
  total_questions INTEGER,
  weak_topics TEXT[],                     -- topic_codes where mistakes made
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Daily study plan (generated by reverse countdown algorithm)
CREATE TABLE IF NOT EXISTS public.daily_study_plan (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date DATE NOT NULL,
  subject_code TEXT NOT NULL,
  topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  planned_hours DECIMAL(3,1) NOT NULL,
  actual_hours DECIMAL(3,1) DEFAULT 0,
  session_type TEXT NOT NULL
    CHECK (session_type IN ('NEW_TOPIC', 'REVISION', 'PRACTICE', 'MOCK_TEST', 'DOUBT_CLEARING')),
  priority INTEGER DEFAULT 2 CHECK (priority BETWEEN 1 AND 3), -- 1=high, 2=med, 3=low
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED', 'RESCHEDULED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, plan_date, subject_code, topic_id, session_type)
);

-- Study session log (actual sessions done)
CREATE TABLE IF NOT EXISTS public.study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  subject_code TEXT NOT NULL,
  topic_id UUID REFERENCES public.syllabus_topics(id) ON DELETE SET NULL,
  session_type TEXT NOT NULL
    CHECK (session_type IN ('NEW_TOPIC', 'REVISION', 'PRACTICE', 'MOCK_TEST', 'DOUBT_CLEARING')),
  planned_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  focus_rating INTEGER CHECK (focus_rating BETWEEN 1 AND 5),
  coverage_status TEXT CHECK (coverage_status IN ('NOT_STARTED', 'IN_PROGRESS', 'COVERED', 'REVISING', 'MASTERED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reverse countdown configuration
CREATE TABLE IF NOT EXISTS public.planner_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  target_exam_date DATE NOT NULL,         -- usually endsem date
  buffer_days INTEGER DEFAULT 7,          -- days before exam to stop new topics
  revision_cycles INTEGER DEFAULT 3,      -- number of full revision passes
  daily_study_hours DECIMAL(3,1) DEFAULT 4.0,
  preferred_session_length_minutes INTEGER DEFAULT 90,
  break_between_sessions_minutes INTEGER DEFAULT 15,
  weak_topic_extra_time_multiplier DECIMAL(3,2) DEFAULT 1.5,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_syllabus_user_subject ON public.syllabus_topics(user_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_coverage_user_topic ON public.topic_coverage(user_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_exam_schedule_user_date ON public.exam_schedule(user_id, exam_date);
CREATE INDEX IF NOT EXISTS idx_past_papers_user_subject ON public.past_papers(user_id, subject_code);
CREATE INDEX IF NOT EXISTS idx_practice_user_paper ON public.paper_practice(user_id, paper_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_user_date ON public.daily_study_plan(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_study_sessions_user_date ON public.study_sessions(user_id, session_date);

-- RLS
ALTER TABLE public.syllabus_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topic_coverage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.past_papers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.paper_practice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_study_plan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_config ENABLE ROW LEVEL SECURITY;

-- Policies
DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'syllabus_topics' AND policyname = 'Users manage their own syllabus') THEN
  CREATE POLICY "Users manage their own syllabus" ON public.syllabus_topics
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'topic_coverage' AND policyname = 'Users manage their own coverage') THEN
  CREATE POLICY "Users manage their own coverage" ON public.topic_coverage
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id AND EXISTS (SELECT 1 FROM public.syllabus_topics parent WHERE parent.id = topic_coverage.topic_id AND parent.user_id = (select auth.uid())));
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'exam_schedule' AND policyname = 'Users manage their own exams') THEN
  CREATE POLICY "Users manage their own exams" ON public.exam_schedule
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'past_papers' AND policyname = 'Users manage their own past papers') THEN
  CREATE POLICY "Users manage their own past papers" ON public.past_papers
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'paper_practice' AND policyname = 'Users manage their own practice') THEN
  CREATE POLICY "Users manage their own practice" ON public.paper_practice
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id AND EXISTS (SELECT 1 FROM public.past_papers parent WHERE parent.id = paper_practice.paper_id AND parent.user_id = (select auth.uid())));
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'daily_study_plan' AND policyname = 'Users manage their own daily plan') THEN
  CREATE POLICY "Users manage their own daily plan" ON public.daily_study_plan
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id AND (topic_id IS NULL OR EXISTS (SELECT 1 FROM public.syllabus_topics parent WHERE parent.id = daily_study_plan.topic_id AND parent.user_id = (select auth.uid()))));
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'study_sessions' AND policyname = 'Users manage their own sessions') THEN
  CREATE POLICY "Users manage their own sessions" ON public.study_sessions
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id AND (topic_id IS NULL OR EXISTS (SELECT 1 FROM public.syllabus_topics parent WHERE parent.id = study_sessions.topic_id AND parent.user_id = (select auth.uid()))));
END IF; END $policy$;

DO $policy$ BEGIN
IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'planner_config' AND policyname = 'Users manage their own planner config') THEN
  CREATE POLICY "Users manage their own planner config" ON public.planner_config
    FOR ALL TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
END IF; END $policy$;

-- Grants
REVOKE ALL ON public.syllabus_topics FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.syllabus_topics TO authenticated;
REVOKE ALL ON public.topic_coverage FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.topic_coverage TO authenticated;
REVOKE ALL ON public.exam_schedule FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_schedule TO authenticated;
REVOKE ALL ON public.past_papers FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.past_papers TO authenticated;
REVOKE ALL ON public.paper_practice FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.paper_practice TO authenticated;
REVOKE ALL ON public.daily_study_plan FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.daily_study_plan TO authenticated;
REVOKE ALL ON public.study_sessions FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.study_sessions TO authenticated;
REVOKE ALL ON public.planner_config FROM PUBLIC, anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.planner_config TO authenticated;

-- Triggers
DROP TRIGGER IF EXISTS update_syllabus_updated_at ON public.syllabus_topics;
CREATE TRIGGER update_syllabus_updated_at BEFORE UPDATE ON public.syllabus_topics
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_coverage_updated_at ON public.topic_coverage;
CREATE TRIGGER update_coverage_updated_at BEFORE UPDATE ON public.topic_coverage
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_exam_schedule_updated_at ON public.exam_schedule;
CREATE TRIGGER update_exam_schedule_updated_at BEFORE UPDATE ON public.exam_schedule
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_plan_updated_at ON public.daily_study_plan;
CREATE TRIGGER update_daily_plan_updated_at BEFORE UPDATE ON public.daily_study_plan
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_planner_config_updated_at ON public.planner_config;
CREATE TRIGGER update_planner_config_updated_at BEFORE UPDATE ON public.planner_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Timestamped soft deletion is retained for cross-device merge and recovery.
ALTER TABLE public.marks ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.subject_grade_config ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.grade_scenarios ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.syllabus_topics ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.topic_coverage ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.exam_schedule ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.past_papers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.paper_practice ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.daily_study_plan ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.planner_config ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.past_papers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS update_past_papers_updated_at ON public.past_papers;
CREATE TRIGGER update_past_papers_updated_at BEFORE UPDATE ON public.past_papers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.paper_practice ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS update_paper_practice_updated_at ON public.paper_practice;
CREATE TRIGGER update_paper_practice_updated_at BEFORE UPDATE ON public.paper_practice FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.study_sessions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
DROP TRIGGER IF EXISTS update_study_sessions_updated_at ON public.study_sessions;
CREATE TRIGGER update_study_sessions_updated_at BEFORE UPDATE ON public.study_sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE public.subject_grade_config DROP CONSTRAINT IF EXISTS subject_grade_config_subject_code_key;
ALTER TABLE public.planner_config DROP CONSTRAINT IF EXISTS planner_config_subject_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_grade_config_owner_subject ON public.subject_grade_config(user_id, subject_code);
CREATE UNIQUE INDEX IF NOT EXISTS idx_planner_config_owner_subject ON public.planner_config(user_id, subject_code);

-- Retain undo records instead of physically deleting attendance rows.
ALTER TABLE public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_status_check;
ALTER TABLE public.attendance_records ADD CONSTRAINT attendance_records_status_check CHECK (status IN ('UNMARKED', 'PRESENT', 'ABSENT', 'CANCELLED'));

-- The internal event trigger is not a client-callable API.
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;

-- ==============================================================================
-- MARKS & GRADE TRACKER SCHEMA
-- Semester Scorecard: weighted components, grade boundaries, what-if simulator
-- ==============================================================================

-- Component types per subject (midsem, endsem, quizzes, assignments, labs, etc.)
CREATE TYPE mark_component_type AS ENUM (
  'MIDSEM', 'ENDSEM', 'QUIZ', 'ASSIGNMENT', 'LAB', 'VIVA', 'PROJECT', 'ATTENDANCE', 'OTHER'
);

-- Marks table: each assessment component for a subject
CREATE TABLE marks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL,
  component_type mark_component_type NOT NULL,
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
CREATE TABLE subject_grade_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_code TEXT NOT NULL UNIQUE,
  
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
CREATE TABLE grade_scenarios (
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
CREATE INDEX idx_marks_user_subject ON marks(user_id, subject_code);
CREATE INDEX idx_marks_user_date ON marks(user_id, date);
CREATE INDEX idx_grade_config_user ON subject_grade_config(user_id);
CREATE INDEX idx_scenarios_user_subject ON grade_scenarios(user_id, subject_code);

-- RLS
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_grade_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE grade_scenarios ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users manage their own marks" ON marks
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own grade config" ON subject_grade_config
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage their own scenarios" ON grade_scenarios
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Grants
GRANT SELECT, INSERT, UPDATE, DELETE ON marks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON subject_grade_config TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON grade_scenarios TO authenticated;

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_marks_updated_at BEFORE UPDATE ON marks
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_grade_config_updated_at BEFORE UPDATE ON subject_grade_config
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_scenarios_updated_at BEFORE UPDATE ON grade_scenarios
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
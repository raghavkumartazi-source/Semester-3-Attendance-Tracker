CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('STUDY', 'ASSIGNMENT', 'PRACTICE', 'REVISION', 'PROJECT', 'QUIZ_PREP', 'OTHER')),
  due_at TIMESTAMPTZ,
  priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  
  -- Completion Consistency Constraint
  CONSTRAINT tasks_completion_consistency CHECK (
    (completed = FALSE AND completed_at IS NULL) OR 
    (completed = TRUE AND completed_at IS NOT NULL)
  )
);

-- Explicitly grant table permissions to the authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE public.tasks
TO authenticated;

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only access their own tasks
CREATE POLICY "Users can manage their own tasks"
ON tasks
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- User-scoped composite indexes
CREATE INDEX idx_tasks_user_due ON tasks(user_id, due_at);
CREATE INDEX idx_tasks_user_completed ON tasks(user_id, completed);

-- ==============================================================================
-- PHASE 2A MIGRATION
-- IDEMPOTENT SQL SCRIPT
-- Safe to run multiple times. Will preserve existing data and structures.
-- ==============================================================================

-- A. TASKS TABLE UPDATES
-- Ensure public.tasks contains estimated_minutes INTEGER
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'tasks' 
          AND column_name = 'estimated_minutes'
    ) THEN
        ALTER TABLE public.tasks ADD COLUMN estimated_minutes INTEGER;
    END IF;
END $$;

-- B. WORK_SESSIONS TABLE CREATION
-- Ensure public.work_sessions exists with correct columns, FKs, and constraints
CREATE TABLE IF NOT EXISTS public.work_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  planned_start TIMESTAMPTZ NOT NULL,
  planned_end TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'PLANNED' CHECK (status IN ('PLANNED', 'COMPLETED', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- C. SECURITY & RLS
-- Enable RLS
ALTER TABLE public.work_sessions ENABLE ROW LEVEL SECURITY;

-- Idempotently create RLS Policy
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_policies 
        WHERE schemaname = 'public' 
          AND tablename = 'work_sessions' 
          AND policyname = 'Users manage their own work sessions'
    ) THEN
        CREATE POLICY "Users manage their own work sessions" ON public.work_sessions
          FOR ALL TO authenticated 
          USING (auth.uid() = user_id) 
          WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Grant required permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.work_sessions TO authenticated;

-- D. INDEXES
-- Ensure performance index for querying schedules
CREATE INDEX IF NOT EXISTS idx_work_sessions_user_time ON public.work_sessions(user_id, planned_start);


-- ==============================================================================
-- E. VERIFICATION QUERIES
-- Run these individually in the SQL Editor to verify the migration succeeded.
-- ==============================================================================

/*
-- 1. Verify estimated_minutes exists on tasks (Should return 1 row with type integer)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'estimated_minutes';

-- 2 & 3. Verify work_sessions exists and check columns/types (Should list 9 columns)
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'work_sessions'
ORDER BY ordinal_position;

-- 4. Verify RLS is enabled on work_sessions (relrowsecurity should be 'true' or 't')
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE relname = 'work_sessions' AND relnamespace = 'public'::regnamespace;

-- 5. Verify policy exists (Should return 'Users manage their own work sessions' for ALL commands)
SELECT policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'work_sessions';

-- 6. Verify grants exist for authenticated role (Should list SELECT, INSERT, UPDATE, DELETE)
SELECT grantee, privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' AND table_name = 'work_sessions' AND grantee = 'authenticated';

-- 7. Verify index exists (Should return idx_work_sessions_user_time)
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public' AND tablename = 'work_sessions' AND indexname = 'idx_work_sessions_user_time';
*/

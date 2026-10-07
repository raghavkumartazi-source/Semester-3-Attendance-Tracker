-- Cover foreign-key lookups without changing stored records.
CREATE INDEX IF NOT EXISTS idx_coverage_topic_id ON public.topic_coverage(topic_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_topic_id ON public.daily_study_plan(topic_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_topic_id ON public.study_sessions(topic_id);
CREATE INDEX IF NOT EXISTS idx_practice_paper_id ON public.paper_practice(paper_id);
CREATE INDEX IF NOT EXISTS idx_work_sessions_task_id ON public.work_sessions(task_id);

-- Preserve the ownership rules while evaluating the user ID once per query.
ALTER POLICY "Users can manage their own attendance" ON public.attendance_records
  TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users can manage their own tasks" ON public.tasks
  TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);
ALTER POLICY "Users manage their own work sessions" ON public.work_sessions
  TO authenticated USING ((select auth.uid()) = user_id) WITH CHECK ((select auth.uid()) = user_id);

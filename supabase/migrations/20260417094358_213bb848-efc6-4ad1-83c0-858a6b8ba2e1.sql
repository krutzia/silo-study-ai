ALTER TABLE public.study_sessions REPLICA IDENTITY FULL;
ALTER TABLE public.study_tasks REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.study_tasks;
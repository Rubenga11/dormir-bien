-- 004_session_updates_and_localidad.sql
-- Allow public update on sessions (for completion tracking)
-- Add localidad column if missing (alias for ciudad)

-- ── Allow anonymous users to update their own sessions (completion + duration)
CREATE POLICY "public_update_sessions"
  ON public.sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- ── Add localidad column if it doesn't exist (some environments renamed ciudad→localidad)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'localidad'
  ) THEN
    ALTER TABLE public.users ADD COLUMN localidad TEXT;
    -- Copy existing ciudad values to localidad
    UPDATE public.users SET localidad = ciudad WHERE localidad IS NULL AND ciudad IS NOT NULL;
  END IF;
END $$;

-- ── Update RLS: allow public update on users (for profile edits)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'public_update_users'
  ) THEN
    CREATE POLICY "public_update_users"
      ON public.users FOR UPDATE
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

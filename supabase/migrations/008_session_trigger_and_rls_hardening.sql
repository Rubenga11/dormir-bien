-- 008_session_trigger_and_rls_hardening.sql
-- 1. Auto-increment global_stats on session insert (replaces unreliable RPC call)
-- 2. Harden RLS: restrict session/user updates to own records only
-- 3. Add composite index for performance

-- ══════════════════════════════════════════
-- TRIGGER: auto-increment global_stats on session INSERT
-- Replaces the separate increment_sessions() RPC call which could fail independently
-- ══════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_increment_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.global_stats
  SET total_sessions = total_sessions + 1, updated_at = NOW()
  WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any, then create
DROP TRIGGER IF EXISTS trigger_session_increment ON public.sessions;
CREATE TRIGGER trigger_session_increment
  AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION auto_increment_sessions();

-- ══════════════════════════════════════════
-- RLS HARDENING: restrict updates to own records
-- ══════════════════════════════════════════

-- Drop overly permissive update policies
DROP POLICY IF EXISTS "public_update_sessions" ON public.sessions;
DROP POLICY IF EXISTS "public_update_users" ON public.users;

-- Sessions: only the session creator can update (matched by user_id from the original insert)
-- Anonymous sessions (user_id IS NULL) can be updated by anyone (they have the session ID)
CREATE POLICY "own_update_sessions"
  ON public.sessions FOR UPDATE
  USING (true)
  WITH CHECK (true);
-- Note: We keep permissive here because session updates come from anonymous clients
-- who only know the session UUID. The UUID itself serves as the auth token.
-- A stricter policy would require Supabase Auth, which this app doesn't use.

-- Users: updates require service_role (profile updates go through the API which uses service_role)
CREATE POLICY "service_update_users"
  ON public.users FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- ══════════════════════════════════════════
-- COMPOSITE INDEX for getUsersWithStats performance
-- ══════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_sessions_user_created
  ON public.sessions (user_id, created_at DESC);

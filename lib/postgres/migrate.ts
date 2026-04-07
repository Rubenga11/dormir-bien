// lib/postgres/migrate.ts — Auto-migration on server boot
import { getPool } from './pool'

const SCHEMA_SQL = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  genero           TEXT NOT NULL,
  edad             TEXT NOT NULL,
  medicacion       TEXT NOT NULL,
  localidad        TEXT,
  cp               TEXT NOT NULL DEFAULT '',
  horas_sueno      TEXT NOT NULL,
  tecnica_favorita TEXT,
  ip_hash          TEXT,
  user_agent       TEXT,
  country          TEXT,
  email            TEXT,
  consiente_email  BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  patron            TEXT NOT NULL,
  duracion_segundos INTEGER,
  completada        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- Global stats (single row counter)
CREATE TABLE IF NOT EXISTS public.global_stats (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  total_sessions INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);
INSERT INTO public.global_stats (id, total_sessions) VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- Blog posts
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo      TEXT NOT NULL,
  slug        TEXT NOT NULL,
  extracto    TEXT DEFAULT '',
  contenido   TEXT DEFAULT '',
  imagen_url  TEXT DEFAULT '',
  publicado   BOOLEAN DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Retreats
CREATE TABLE IF NOT EXISTS public.retreats (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        TEXT NOT NULL,
  descripcion   TEXT DEFAULT '',
  ubicacion     TEXT DEFAULT '',
  fecha_inicio  DATE,
  fecha_fin     DATE,
  precio        NUMERIC(10,2) DEFAULT 0,
  plazas        INTEGER DEFAULT 0,
  imagen_url    TEXT DEFAULT '',
  activo        BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Retreat registrations
CREATE TABLE IF NOT EXISTS public.retreat_registrations (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID REFERENCES public.users(id) ON DELETE CASCADE,
  retreat_id  UUID REFERENCES public.retreats(id) ON DELETE CASCADE,
  nombre      TEXT NOT NULL DEFAULT '',
  apellidos   TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  telefono    TEXT NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, retreat_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_created    ON public.users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_patron  ON public.sessions (patron);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON public.sessions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_user_created ON public.sessions (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_slug        ON public.blog_posts (slug);
CREATE INDEX IF NOT EXISTS idx_blog_publicado   ON public.blog_posts (publicado);

-- Trigger: auto-increment global_stats on session INSERT
CREATE OR REPLACE FUNCTION auto_increment_sessions()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.global_stats SET total_sessions = total_sessions + 1, updated_at = NOW() WHERE id = 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_session_increment ON public.sessions;
CREATE TRIGGER trigger_session_increment
  AFTER INSERT ON public.sessions
  FOR EACH ROW EXECUTE FUNCTION auto_increment_sessions();

-- Trigger: auto-update updated_at on users
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_users_updated_at ON public.users;
CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
`

let migrated = false

export async function runMigrations(): Promise<void> {
  if (migrated) return
  try {
    console.log('[migrate] Running database migrations...')
    await getPool().query(SCHEMA_SQL)
    console.log('[migrate] Migrations complete')
    migrated = true
  } catch (err: any) {
    console.error('[migrate] Migration error:', err.message)
    throw err
  }
}

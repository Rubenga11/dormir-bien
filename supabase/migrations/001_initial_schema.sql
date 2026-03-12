-- ════════════════════════════════════════════════════════
--  BREATHE — SCHEMA COMPLETO SUPABASE
--  Ejecutar en: Supabase Dashboard → SQL Editor
--  O con CLI: npx supabase db push
-- ════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ──────────────────────────────────────────────────────
--  TABLA: users
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.users (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  genero           TEXT NOT NULL CHECK (genero IN ('Hombre','Mujer','Otro')),
  edad             TEXT NOT NULL CHECK (edad IN ('18–24','25–34','35–44','45–54','55–64','65+')),
  medicacion       TEXT NOT NULL CHECK (medicacion IN ('Sí, habitualmente','A veces','No')),
  localidad        TEXT NOT NULL,
  horas_sueno      TEXT NOT NULL CHECK (horas_sueno IN ('Menos de 5h','5–6h','6–7h','7–8h','Más de 8h')),
  tecnica_favorita TEXT CHECK (tecnica_favorita IN ('Sueño Delta','Sueño Profundo','Adormecimiento','Relajación')),
  ip_hash          TEXT,
  user_agent       TEXT,
  country          TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────
--  TABLA: sessions
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sessions (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id           UUID REFERENCES public.users(id) ON DELETE SET NULL,
  patron            TEXT NOT NULL CHECK (patron IN ('Sueño Delta','Sueño Profundo','Adormecimiento','Relajación')),
  duracion_segundos INTEGER,
  completada        BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ──────────────────────────────────────────────────────
--  TABLA: global_stats (fila única — contador global)
-- ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.global_stats (
  id             INTEGER PRIMARY KEY DEFAULT 1,
  total_sessions INTEGER DEFAULT 0,
  updated_at     TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO public.global_stats (id, total_sessions)
VALUES (1, 0) ON CONFLICT (id) DO NOTHING;

-- ──────────────────────────────────────────────────────
--  ÍNDICES
-- ──────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_genero     ON public.users (genero);
CREATE INDEX IF NOT EXISTS idx_users_localidad  ON public.users (localidad);
CREATE INDEX IF NOT EXISTS idx_users_edad       ON public.users (edad);
CREATE INDEX IF NOT EXISTS idx_users_medicacion ON public.users (medicacion);
CREATE INDEX IF NOT EXISTS idx_users_tecnica    ON public.users (tecnica_favorita);
CREATE INDEX IF NOT EXISTS idx_users_created    ON public.users (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sessions_patron  ON public.sessions (patron);
CREATE INDEX IF NOT EXISTS idx_sessions_user    ON public.sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created ON public.sessions (created_at DESC);

-- ──────────────────────────────────────────────────────
--  ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────
ALTER TABLE public.users        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.global_stats ENABLE ROW LEVEL SECURITY;

-- Cualquiera puede insertar usuario (registro público anónimo)
CREATE POLICY "public_insert_users"
  ON public.users FOR INSERT WITH CHECK (true);

-- Solo service_role lee usuarios (dashboard admin)
CREATE POLICY "service_read_users"
  ON public.users FOR SELECT
  USING (auth.role() = 'service_role');

-- Cualquiera puede insertar sesiones
CREATE POLICY "public_insert_sessions"
  ON public.sessions FOR INSERT WITH CHECK (true);

-- Solo service_role lee sesiones
CREATE POLICY "service_read_sessions"
  ON public.sessions FOR SELECT
  USING (auth.role() = 'service_role');

-- Cualquiera lee stats globales (para contador público)
CREATE POLICY "public_read_stats"
  ON public.global_stats FOR SELECT USING (true);

-- Service_role actualiza stats
CREATE POLICY "service_update_stats"
  ON public.global_stats FOR UPDATE
  USING (auth.role() = 'service_role');

-- ──────────────────────────────────────────────────────
--  FUNCIÓN: incrementar sesiones de forma atómica
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION increment_sessions()
RETURNS void AS $$
BEGIN
  UPDATE public.global_stats
  SET total_sessions = total_sessions + 1,
      updated_at = NOW()
  WHERE id = 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ──────────────────────────────────────────────────────
--  TRIGGER: updated_at automático
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ──────────────────────────────────────────────────────
--  VISTAS para el dashboard admin
-- ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW admin_dashboard_summary AS
  SELECT
    (SELECT COUNT(*) FROM public.users)::int                              AS total_usuarios,
    (SELECT total_sessions FROM public.global_stats WHERE id=1)::int      AS total_sesiones,
    (SELECT COUNT(DISTINCT LOWER(TRIM(localidad))) FROM public.users)::int AS total_localidades,
    ROUND(
      (SELECT COUNT(*) FROM public.users WHERE medicacion='Sí, habitualmente')
      * 100.0 / NULLIF((SELECT COUNT(*) FROM public.users),0), 1
    )                                                                      AS pct_medicacion,
    (SELECT COUNT(*) FROM public.users
     WHERE created_at > NOW() - INTERVAL '7 days')::int                   AS nuevos_7dias,
    (SELECT COUNT(*) FROM public.sessions
     WHERE created_at > NOW() - INTERVAL '7 days')::int                   AS sesiones_7dias;

CREATE OR REPLACE VIEW admin_by_genero AS
  SELECT genero,
    COUNT(*)::int AS total,
    ROUND(COUNT(*)*100.0/NULLIF(SUM(COUNT(*)) OVER(),0),1) AS porcentaje
  FROM public.users GROUP BY genero ORDER BY total DESC;

CREATE OR REPLACE VIEW admin_by_edad AS
  SELECT edad, COUNT(*)::int AS total
  FROM public.users GROUP BY edad
  ORDER BY CASE edad
    WHEN '18–24' THEN 1 WHEN '25–34' THEN 2 WHEN '35–44' THEN 3
    WHEN '45–54' THEN 4 WHEN '55–64' THEN 5 WHEN '65+' THEN 6 END;

CREATE OR REPLACE VIEW admin_by_medicacion AS
  SELECT medicacion, COUNT(*)::int AS total,
    ROUND(COUNT(*)*100.0/NULLIF(SUM(COUNT(*)) OVER(),0),1) AS porcentaje
  FROM public.users GROUP BY medicacion ORDER BY total DESC;

CREATE OR REPLACE VIEW admin_by_tecnica AS
  SELECT tecnica_favorita, COUNT(*)::int AS total
  FROM public.users WHERE tecnica_favorita IS NOT NULL
  GROUP BY tecnica_favorita ORDER BY total DESC;

CREATE OR REPLACE VIEW admin_by_horas AS
  SELECT horas_sueno, COUNT(*)::int AS total
  FROM public.users GROUP BY horas_sueno
  ORDER BY CASE horas_sueno
    WHEN 'Menos de 5h' THEN 1 WHEN '5–6h' THEN 2 WHEN '6–7h' THEN 3
    WHEN '7–8h' THEN 4 WHEN 'Más de 8h' THEN 5 END;

-- ──────────────────────────────────────────────────────
--  DATOS DEMO (14 usuarios + 52 sesiones para probar el dashboard)
--  Descomentar solo en desarrollo
-- ──────────────────────────────────────────────────────
/*
INSERT INTO public.users (genero,edad,medicacion,localidad,horas_sueno,tecnica_favorita,created_at) VALUES
  ('Mujer',  '25–34','No',               'Madrid',    '6–7h',       'Sueño Delta',    '2025-10-05'),
  ('Hombre', '35–44','Sí, habitualmente','Barcelona', '5–6h',       'Sueño Profundo', '2025-10-08'),
  ('Mujer',  '18–24','A veces',          'Valencia',  '7–8h',       'Adormecimiento', '2025-10-11'),
  ('Otro',   '45–54','No',               'Sevilla',   'Menos de 5h','Relajación',     '2025-10-15'),
  ('Mujer',  '25–34','No',               'Madrid',    '6–7h',       'Sueño Delta',    '2025-10-18'),
  ('Hombre', '55–64','Sí, habitualmente','Bilbao',    '7–8h',       'Sueño Delta',    '2025-10-22'),
  ('Mujer',  '35–44','A veces',          'Zaragoza',  '6–7h',       'Sueño Profundo', '2025-10-28'),
  ('Hombre', '18–24','No',               'Málaga',    '7–8h',       'Adormecimiento', '2025-11-01'),
  ('Mujer',  '25–34','No',               'Madrid',    'Más de 8h',  'Sueño Delta',    '2025-11-06'),
  ('Hombre', '45–54','Sí, habitualmente','Barcelona', '5–6h',       'Relajación',     '2025-11-10'),
  ('Mujer',  '65+',  'A veces',          'Valencia',  '6–7h',       'Sueño Profundo', '2025-11-14'),
  ('Otro',   '35–44','No',               'Murcia',    '7–8h',       'Sueño Delta',    '2025-11-20'),
  ('Hombre', '25–34','No',               'Alicante',  '6–7h',       'Adormecimiento', '2025-11-25'),
  ('Mujer',  '18–24','A veces',          'Valladolid','5–6h',       'Sueño Profundo', '2025-12-01');

UPDATE public.global_stats SET total_sessions = 52 WHERE id = 1;
*/

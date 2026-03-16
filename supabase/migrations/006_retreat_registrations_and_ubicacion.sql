-- 006: Add ubicacion to retreats + retreat_registrations table

-- Add ubicacion column to retreats
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='retreats' AND column_name='ubicacion')
  THEN ALTER TABLE public.retreats ADD COLUMN ubicacion TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Retreat registrations (inscripciones)
CREATE TABLE IF NOT EXISTS retreat_registrations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  retreat_id  UUID NOT NULL REFERENCES retreats(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, retreat_id)
);
CREATE INDEX IF NOT EXISTS idx_retreat_reg_retreat ON retreat_registrations(retreat_id);

ALTER TABLE retreat_registrations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_insert_retreat_reg') THEN
    CREATE POLICY "public_insert_retreat_reg" ON retreat_registrations FOR INSERT WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'public_select_retreat_reg') THEN
    CREATE POLICY "public_select_retreat_reg" ON retreat_registrations FOR SELECT USING (true);
  END IF;
END $$;

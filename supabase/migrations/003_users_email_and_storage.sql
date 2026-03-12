-- 003_users_email_and_storage.sql — Columnas email en users + bucket de storage

-- ── Añadir columnas email a users
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS consiente_email BOOLEAN DEFAULT false;

-- ── Crear bucket público para imágenes
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- ── Política: cualquiera puede ver imágenes (bucket público)
CREATE POLICY "Public read images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'images');

-- ── Política: service_role puede subir/borrar imágenes
CREATE POLICY "Admin upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'images');

CREATE POLICY "Admin delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'images');

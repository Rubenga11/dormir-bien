-- 002_blog_retreats.sql — Tablas para blog y retiros

-- ── Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  image_url   TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  body        TEXT NOT NULL DEFAULT '',
  published   BOOLEAN NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_published ON blog_posts(published);

-- ── Retreats
CREATE TABLE IF NOT EXISTS retreats (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title             TEXT NOT NULL,
  image_url         TEXT NOT NULL DEFAULT '',
  description       TEXT NOT NULL DEFAULT '',
  start_date        DATE NOT NULL,
  end_date          DATE NOT NULL,
  location          TEXT NOT NULL DEFAULT '',
  price             NUMERIC(10,2) NOT NULL DEFAULT 0,
  registration_url  TEXT NOT NULL DEFAULT '',
  published         BOOLEAN NOT NULL DEFAULT false,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_retreats_published ON retreats(published);

-- ── RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE retreats ENABLE ROW LEVEL SECURITY;

-- Public read for published posts
CREATE POLICY "Public can read published blog posts"
  ON blog_posts FOR SELECT
  USING (published = true);

-- Admin full access (service role bypasses RLS)
CREATE POLICY "Admin full access blog_posts"
  ON blog_posts FOR ALL
  USING (auth.role() = 'service_role');

-- Public read for published retreats
CREATE POLICY "Public can read published retreats"
  ON retreats FOR SELECT
  USING (published = true);

CREATE POLICY "Admin full access retreats"
  ON retreats FOR ALL
  USING (auth.role() = 'service_role');

-- ── Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER retreats_updated_at
  BEFORE UPDATE ON retreats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

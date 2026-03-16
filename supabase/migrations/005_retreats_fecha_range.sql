-- 005_retreats_fecha_range.sql
-- Split single fecha into fecha_inicio + fecha_fin for date ranges

ALTER TABLE retreats RENAME COLUMN fecha TO fecha_inicio;
ALTER TABLE retreats ADD COLUMN IF NOT EXISTS fecha_fin DATE;
UPDATE retreats SET fecha_fin = fecha_inicio WHERE fecha_fin IS NULL;

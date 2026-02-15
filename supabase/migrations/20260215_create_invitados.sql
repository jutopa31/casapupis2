-- =============================================
-- Table: invitados
-- Master guest list. Each guest logs in by
-- matching their name against this table.
-- =============================================

CREATE TABLE IF NOT EXISTS invitados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  grupo_familiar TEXT,
  mesa INTEGER,
  confirmado BOOLEAN NOT NULL DEFAULT false,
  cantidad_personas INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Allow public read so the login lookup works with anon key
ALTER TABLE invitados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read invitados"
  ON invitados FOR SELECT
  USING (true);

-- Only service role can insert/update/delete
CREATE POLICY "Service role manages invitados"
  ON invitados FOR ALL
  USING (auth.role() = 'service_role');

-- Index for fast name lookups (case-insensitive)
CREATE INDEX idx_invitados_nombre_lower ON invitados (lower(nombre));

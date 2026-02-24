-- =============================================
-- Migration: Create fotos_luna_de_miel table
-- Honeymoon photo gallery for Colonia de Sacramento, Uruguay
-- =============================================

CREATE TABLE IF NOT EXISTS fotos_luna_de_miel (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_invitado TEXT NOT NULL,
  foto_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fotos_luna_de_miel ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on fotos_luna_de_miel"
  ON fotos_luna_de_miel FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on fotos_luna_de_miel"
  ON fotos_luna_de_miel FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public delete access on fotos_luna_de_miel"
  ON fotos_luna_de_miel FOR DELETE
  USING (true);

-- =============================================
-- Storage bucket: fotos-luna-de-miel
-- Must be created manually via Supabase Dashboard
-- Storage > New Bucket > fotos-luna-de-miel (public: true)
-- =============================================

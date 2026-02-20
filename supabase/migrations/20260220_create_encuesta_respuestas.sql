-- =============================================
-- Migration: create encuesta_respuestas
-- Stores guest responses to wedding survey
-- questions. One response per guest per question
-- is enforced via a UNIQUE constraint.
-- =============================================

CREATE TABLE IF NOT EXISTS encuesta_respuestas (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_invitado TEXT        NOT NULL,
  pregunta_id     INTEGER     NOT NULL,
  respuesta       TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One answer per guest per question
ALTER TABLE encuesta_respuestas
  ADD CONSTRAINT unique_respuesta_por_invitado
  UNIQUE (nombre_invitado, pregunta_id);

ALTER TABLE encuesta_respuestas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on encuesta_respuestas"
  ON encuesta_respuestas FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on encuesta_respuestas"
  ON encuesta_respuestas FOR INSERT
  WITH CHECK (true);

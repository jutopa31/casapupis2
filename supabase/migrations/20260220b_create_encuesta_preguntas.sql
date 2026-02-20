-- =============================================
-- Migration: create encuesta_preguntas
-- Stores survey questions managed by admins.
-- Guests see active questions and answer them.
-- =============================================

CREATE TABLE IF NOT EXISTS encuesta_preguntas (
  id             SERIAL      PRIMARY KEY,
  pregunta       TEXT        NOT NULL,
  opciones       TEXT[]      NOT NULL,
  permitir_otra  BOOLEAN     NOT NULL DEFAULT false,
  activa         BOOLEAN     NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE encuesta_preguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on encuesta_preguntas"
  ON encuesta_preguntas FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on encuesta_preguntas"
  ON encuesta_preguntas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public update access on encuesta_preguntas"
  ON encuesta_preguntas FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Public delete access on encuesta_preguntas"
  ON encuesta_preguntas FOR DELETE
  USING (true);

-- =============================================
-- Seed: initial fun questions
-- =============================================

INSERT INTO encuesta_preguntas (pregunta, opciones, permitir_otra) VALUES
  (
    '¿Quién va a ser el/la primero/a en ir a la pista de baile?',
    ARRAY['Yo seguro', 'Alguien de mi mesa', 'El tío/a copado/a', 'Nadie, somos tímidos'],
    true
  ),
  (
    '¿Cuál fue tu momento favorito del día?',
    ARRAY['La ceremonia', 'El brindis', 'La cena', 'La fiesta'],
    true
  ),
  (
    '¿Cuántas horas durás en la pista de baile?',
    ARRAY['Toda la noche', 'Un par de horas', 'Solo los lentos', 'Soy más de la barra'],
    false
  ),
  (
    '¿Quién va a llorar primero en la ceremonia?',
    ARRAY['Yo', 'Alguien de mi familia', 'Los novios', 'Nadie, somos de piedra'],
    true
  ),
  (
    '¿Cuál es tu estrategia para la fiesta?',
    ARRAY['Bailar sin parar', 'Comer todo lo que pueda', 'Conocer gente nueva', 'Un poco de todo'],
    false
  );

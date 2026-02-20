-- =============================================
-- Migration: replace encuestas with trivia
-- Drops old survey tables and creates trivia
-- tables for "How well do you know the couple?"
-- =============================================

-- Drop old encuesta tables
DROP TABLE IF EXISTS encuesta_respuestas;
DROP TABLE IF EXISTS encuesta_preguntas;

-- =============================================
-- Table: trivia_preguntas
-- Stores trivia questions managed by admins.
-- Each question has a correct answer.
-- =============================================

CREATE TABLE IF NOT EXISTS trivia_preguntas (
  id                 SERIAL      PRIMARY KEY,
  pregunta           TEXT        NOT NULL,
  opciones           TEXT[]      NOT NULL,
  respuesta_correcta TEXT        NOT NULL,
  activa             BOOLEAN     NOT NULL DEFAULT true,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trivia_preguntas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on trivia_preguntas"
  ON trivia_preguntas FOR SELECT USING (true);

CREATE POLICY "Public insert access on trivia_preguntas"
  ON trivia_preguntas FOR INSERT WITH CHECK (true);

CREATE POLICY "Public update access on trivia_preguntas"
  ON trivia_preguntas FOR UPDATE USING (true) WITH CHECK (true);

CREATE POLICY "Public delete access on trivia_preguntas"
  ON trivia_preguntas FOR DELETE USING (true);

-- =============================================
-- Table: trivia_resultados
-- Stores each guest's trivia score and answers.
-- One attempt per guest (UNIQUE on nombre_invitado).
-- =============================================

CREATE TABLE IF NOT EXISTS trivia_resultados (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_invitado TEXT        NOT NULL UNIQUE,
  puntaje         INTEGER     NOT NULL DEFAULT 0,
  total_preguntas INTEGER     NOT NULL DEFAULT 0,
  respuestas      JSONB       NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE trivia_resultados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on trivia_resultados"
  ON trivia_resultados FOR SELECT USING (true);

CREATE POLICY "Public insert access on trivia_resultados"
  ON trivia_resultados FOR INSERT WITH CHECK (true);

-- =============================================
-- Seed: example trivia questions
-- (Admins should replace with real answers)
-- =============================================

INSERT INTO trivia_preguntas (pregunta, opciones, respuesta_correcta) VALUES
  (
    '¿Dónde fue la primera cita de los novios?',
    ARRAY['Un bar', 'Un parque', 'Un restaurante', 'Un cine'],
    'Un bar'
  ),
  (
    '¿Cuál es la comida favorita de Julian?',
    ARRAY['Pizza', 'Asado', 'Sushi', 'Milanesas'],
    'Asado'
  ),
  (
    '¿Cuál es la serie favorita de Jacqueline?',
    ARRAY['Friends', 'Grey''s Anatomy', 'The Office', 'Stranger Things'],
    'Grey''s Anatomy'
  ),
  (
    '¿A dónde viajaron juntos por primera vez?',
    ARRAY['Brasil', 'Uruguay', 'Mendoza', 'Bariloche'],
    'Bariloche'
  ),
  (
    '¿Cuántos años llevan juntos?',
    ARRAY['2', '3', '5', '7'],
    '5'
  );

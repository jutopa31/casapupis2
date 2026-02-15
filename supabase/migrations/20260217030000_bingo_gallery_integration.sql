-- =============================================
-- Bingo + Gallery Integration
-- Adds metadata to identify bingo-origin photos
-- in fotos_invitados and backfills existing data.
-- =============================================

ALTER TABLE fotos_invitados
ADD COLUMN IF NOT EXISTS bingo_challenge_id INTEGER;

-- Fast filter for "only bingo photos" queries
CREATE INDEX IF NOT EXISTS idx_fotos_invitados_bingo_challenge
ON fotos_invitados (bingo_challenge_id)
WHERE bingo_challenge_id IS NOT NULL;

-- Backfill metadata on existing gallery rows that already share the same bingo URL.
UPDATE fotos_invitados f
SET
  bingo_challenge_id = b.challenge_id,
  caption = COALESCE(
    f.caption,
    CASE b.challenge_id
      WHEN 1 THEN 'Bingo: Foto con los novios'
      WHEN 2 THEN 'Bingo: Alguien bailando'
      WHEN 3 THEN 'Bingo: El brindis'
      WHEN 4 THEN 'Bingo: Un abrazo grupal'
      WHEN 5 THEN 'Bingo: Los zapatos de la novia'
      WHEN 6 THEN 'Bingo: Foto con el DJ'
      WHEN 7 THEN 'Bingo: Un selfie en el espejo'
      WHEN 8 THEN 'Bingo: La torta'
      WHEN 9 THEN 'Bingo: Un invitado llorando de emocion'
      WHEN 10 THEN 'Bingo: El ramo de la novia'
      WHEN 11 THEN 'Bingo: Foto grupal de amigos'
      WHEN 12 THEN 'Bingo: Los anillos'
      WHEN 13 THEN 'Bingo: Alguien cantando'
      WHEN 14 THEN 'Bingo: Una foto divertida'
      WHEN 15 THEN 'Bingo: El primer baile'
      WHEN 16 THEN 'Bingo: La familia completa'
      ELSE 'Bingo: Desafio completado'
    END
  )
FROM bingo_entries b
WHERE f.foto_url = b.foto_url
  AND f.bingo_challenge_id IS NULL;

-- Backfill existing bingo entries into fotos_invitados if they are missing.
-- Uses challenge_id to build a stable caption for gallery display.
INSERT INTO fotos_invitados (nombre_invitado, foto_url, caption, created_at, bingo_challenge_id)
SELECT
  b.nombre_invitado,
  b.foto_url,
  CASE b.challenge_id
    WHEN 1 THEN 'Bingo: Foto con los novios'
    WHEN 2 THEN 'Bingo: Alguien bailando'
    WHEN 3 THEN 'Bingo: El brindis'
    WHEN 4 THEN 'Bingo: Un abrazo grupal'
    WHEN 5 THEN 'Bingo: Los zapatos de la novia'
    WHEN 6 THEN 'Bingo: Foto con el DJ'
    WHEN 7 THEN 'Bingo: Un selfie en el espejo'
    WHEN 8 THEN 'Bingo: La torta'
    WHEN 9 THEN 'Bingo: Un invitado llorando de emocion'
    WHEN 10 THEN 'Bingo: El ramo de la novia'
    WHEN 11 THEN 'Bingo: Foto grupal de amigos'
    WHEN 12 THEN 'Bingo: Los anillos'
    WHEN 13 THEN 'Bingo: Alguien cantando'
    WHEN 14 THEN 'Bingo: Una foto divertida'
    WHEN 15 THEN 'Bingo: El primer baile'
    WHEN 16 THEN 'Bingo: La familia completa'
    ELSE 'Bingo: Desafio completado'
  END AS caption,
  b.completed_at,
  b.challenge_id
FROM bingo_entries b
WHERE NOT EXISTS (
  SELECT 1
  FROM fotos_invitados f
  WHERE f.foto_url = b.foto_url
);

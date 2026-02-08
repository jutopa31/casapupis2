-- =============================================
-- Wedding App - Complete Database Schema
-- =============================================
-- This schema defines all tables for the wedding
-- application. No auth system is used; access is
-- controlled by a shared access code on the frontend.
-- =============================================


-- =============================================
-- Table: rsvp_entries
-- Stores guest RSVP confirmations including
-- companion info, children, dietary restrictions,
-- and optional messages to the couple.
-- =============================================
CREATE TABLE IF NOT EXISTS rsvp_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  asiste BOOLEAN NOT NULL DEFAULT true,
  acompanante BOOLEAN NOT NULL DEFAULT false,
  nombre_acompanante TEXT,
  ninos BOOLEAN NOT NULL DEFAULT false,
  cantidad_ninos INTEGER NOT NULL DEFAULT 0,
  restricciones TEXT,
  mensaje TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rsvp_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on rsvp_entries"
  ON rsvp_entries FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on rsvp_entries"
  ON rsvp_entries FOR INSERT
  WITH CHECK (true);


-- =============================================
-- Table: mensajes
-- Guest messages / well-wishes to the couple,
-- each with an emoji reaction.
-- =============================================
CREATE TABLE IF NOT EXISTS mensajes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  mensaje TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '❤️',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE mensajes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on mensajes"
  ON mensajes FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on mensajes"
  ON mensajes FOR INSERT
  WITH CHECK (true);


-- =============================================
-- Table: playlist_entries
-- Guest song requests for the wedding playlist.
-- Artist is optional in case guests only know
-- the song title.
-- =============================================
CREATE TABLE IF NOT EXISTS playlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_invitado TEXT NOT NULL,
  cancion TEXT NOT NULL,
  artista TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE playlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on playlist_entries"
  ON playlist_entries FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on playlist_entries"
  ON playlist_entries FOR INSERT
  WITH CHECK (true);


-- =============================================
-- Table: bingo_entries
-- Tracks completed bingo challenges. Each entry
-- links a guest to a specific challenge with a
-- photo as proof of completion.
-- =============================================
CREATE TABLE IF NOT EXISTS bingo_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_invitado TEXT NOT NULL,
  challenge_id INTEGER NOT NULL,
  foto_url TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE bingo_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on bingo_entries"
  ON bingo_entries FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on bingo_entries"
  ON bingo_entries FOR INSERT
  WITH CHECK (true);


-- =============================================
-- Table: fotos_invitados
-- Guest-uploaded photos from the event. Each
-- photo can have an optional caption.
-- =============================================
CREATE TABLE IF NOT EXISTS fotos_invitados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_invitado TEXT NOT NULL,
  foto_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE fotos_invitados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access on fotos_invitados"
  ON fotos_invitados FOR SELECT
  USING (true);

CREATE POLICY "Public insert access on fotos_invitados"
  ON fotos_invitados FOR INSERT
  WITH CHECK (true);


-- =============================================
-- Storage Buckets
-- These must be created via the Supabase Dashboard
-- (Storage > New Bucket) since SQL cannot create
-- storage buckets directly.
-- =============================================

-- Bucket: galeria-pareja
-- Purpose: Couple's curated photo gallery
-- Access: Public read (anyone can view)
-- Upload: Admin only (via dashboard)
--
-- CREATE STORAGE BUCKET galeria-pareja (public: true);

-- Bucket: fotos-invitados
-- Purpose: Guest-uploaded event photos
-- Access: Public read and write (guests upload freely)
--
-- CREATE STORAGE BUCKET fotos-invitados (public: true);

-- Bucket: bingo
-- Purpose: Bingo challenge proof photos
-- Access: Public read and write (guests upload challenge photos)
--
-- CREATE STORAGE BUCKET bingo (public: true);

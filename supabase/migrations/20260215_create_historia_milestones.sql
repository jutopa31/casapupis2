-- ============================================================================
-- Historia Milestones - Tabla para la galeria "Nuestra Historia"
-- Permite editar milestones desde la UI sin tocar codigo
-- ============================================================================

CREATE TABLE IF NOT EXISTS historia_milestones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  orden integer NOT NULL,
  date text,
  title text NOT NULL,
  description text,
  image_url text,
  spotify_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
-- Indice para ordenamiento
CREATE INDEX idx_historia_milestones_orden ON historia_milestones (orden);
-- RLS: lectura publica, escritura publica (sitio de boda sin auth real)
ALTER TABLE historia_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lectura publica de milestones"
  ON historia_milestones FOR SELECT
  USING (true);
CREATE POLICY "Insercion publica de milestones"
  ON historia_milestones FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Actualizacion publica de milestones"
  ON historia_milestones FOR UPDATE
  USING (true);
CREATE POLICY "Eliminacion publica de milestones"
  ON historia_milestones FOR DELETE
  USING (true);
-- Trigger para actualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_historia_milestones_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER historia_milestones_updated_at
  BEFORE UPDATE ON historia_milestones
  FOR EACH ROW
  EXECUTE FUNCTION update_historia_milestones_updated_at();
-- ============================================================================
-- Seed: insertar los 6 milestones iniciales del config
-- ============================================================================

INSERT INTO historia_milestones (orden, date, title, description, image_url) VALUES
  (1, NULL, 'Nos conocimos', 'El destino nos cruzo y desde ese momento supimos que algo especial estaba por comenzar.', NULL),
  (2, NULL, 'Primera cita', 'Nervios, risas y la certeza de que queriamos seguir conociéndonos.', NULL),
  (3, NULL, 'Primer viaje juntos', 'Descubrimos que viajar juntos era tan natural como respirar. La aventura recien empezaba.', NULL),
  (4, NULL, 'Nos mudamos juntos', 'Armamos nuestro hogar, un lugar lleno de amor, proyectos y suenos compartidos.', NULL),
  (5, NULL, 'La propuesta', 'Con el corazon latiendo a mil, llego la pregunta mas importante. Y la respuesta fue si!', NULL),
  (6, '2026-02-21', 'Nos casamos!', 'El gran dia llego. Rodeados de quienes mas queremos, celebramos nuestro amor para siempre.', NULL);

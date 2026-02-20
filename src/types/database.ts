// =============================================
// Database types for the wedding app tables
// =============================================

export interface RSVPEntry {
  id: string
  nombre: string
  asiste: boolean
  acompanante: boolean
  nombre_acompanante: string | null
  ninos: boolean
  cantidad_ninos: number
  restricciones: string | null
  mensaje: string | null
  created_at: string
  updated_at: string
}

export interface Mensaje {
  id: string
  nombre: string
  mensaje: string
  emoji: string
  created_at: string
}

export interface PlaylistEntry {
  id: string
  nombre_invitado: string
  cancion: string
  artista: string | null
  created_at: string
}

export interface BingoEntry {
  id: string
  nombre_invitado: string
  challenge_id: number
  foto_url: string
  completed_at: string
}

export interface FotoInvitado {
  id: string
  nombre_invitado: string
  foto_url: string
  caption: string | null
  bingo_challenge_id: number | null
  created_at: string
}

export interface Invitado {
  id: string
  nombre: string
  grupo_familiar: string | null
  mesa: number | null
  confirmado: boolean
  cantidad_personas: number
  created_at: string
}

export interface CombiEntry {
  id: string
  nombre: string
  ida: boolean
  vuelta: boolean
  cantidad_personas: number
  pago_confirmado: boolean
  mensaje: string | null
  created_at: string
  updated_at: string
}

export interface HistoriaMilestone {
  id: string
  orden: number
  date: string | null
  title: string
  description: string | null
  image_url: string | null
  spotify_url: string | null
  created_at: string
  updated_at: string
}

export interface EncuestaRespuesta {
  id: string
  nombre_invitado: string
  pregunta_id: number
  respuesta: string
  created_at: string
}

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
  created_at: string
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Music, Send, ListMusic } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'
import type { PlaylistEntry } from '@/types/database'

export default function PlaylistPage() {
  const { guestName } = useAuth()
  const [entries, setEntries] = useState<PlaylistEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [cancion, setCancion] = useState('')
  const [artista, setArtista] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadPlaylist = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setIsLoading(false)
      return
    }
    const { data } = await supabase
      .from('playlist_entries')
      .select('*')
      .order('created_at', { ascending: false })

    setEntries(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPlaylist()

    const supabase = getSupabase()
    if (!supabase) return

    const channel = supabase
      .channel('playlist_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'playlist_entries' },
        (payload) => {
          const entry = payload.new as PlaylistEntry
          setEntries((prev) => {
            if (prev.some((p) => p.id === entry.id)) return prev
            return [entry, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadPlaylist])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!cancion.trim()) return

    setSubmitting(true)
    const supabase = getSupabase()
    if (supabase) {
      await supabase.from('playlist_entries').insert({
        nombre_invitado: guestName ?? 'Anonimo',
        cancion: cancion.trim(),
        artista: artista.trim() || null,
      })
    }
    setCancion('')
    setArtista('')
    setSubmitting(false)
  }

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Playlist Colaborativa
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Sugeri canciones para que suenen en la fiesta!
        </motion.p>
      </header>

      {/* Formulario */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-auto mt-6 max-w-lg space-y-3 px-4"
      >
        <input
          type="text"
          placeholder="Nombre de la cancion"
          value={cancion}
          onChange={(e) => setCancion(e.target.value)}
          className="w-full rounded-xl border border-gold/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
        />
        <input
          type="text"
          placeholder="Artista (opcional)"
          value={artista}
          onChange={(e) => setArtista(e.target.value)}
          className="w-full rounded-xl border border-gold/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
        />
        <button
          type="submit"
          disabled={submitting || !cancion.trim()}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Agregando...' : 'Agregar cancion'}
        </button>
      </motion.form>

      {/* Lista */}
      <section className="mx-auto mt-10 max-w-2xl px-4">
        {isLoading && (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4 rounded-xl bg-white p-4">
                <div className="h-10 w-10 rounded-full bg-stone-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/2 rounded bg-stone-200" />
                  <div className="h-2 w-1/3 rounded bg-stone-200" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && entries.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="rounded-full bg-stone-100 p-5">
              <ListMusic className="h-10 w-10 text-stone-400" />
            </div>
            <p className="mt-4 text-base font-medium text-stone-600">
              La playlist esta vacia
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Sugeri la primera cancion!
            </p>
          </motion.div>
        )}

        <div className="space-y-3">
          {entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-4 rounded-xl border border-gold/10 bg-white p-4 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gold/10">
                <Music className="h-5 w-5 text-gold" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-text-primary">
                  {entry.cancion}
                </p>
                {entry.artista && (
                  <p className="truncate text-xs text-text-secondary">
                    {entry.artista}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-stone-400">
                {entry.nombre_invitado}
              </span>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}

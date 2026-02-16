'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, MessageSquare, Trash2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'
import type { Mensaje } from '@/types/database'

const EMOJIS = ['❤️', '🥂', '🎉', '💍', '✨', '🥰']
const ADMIN_NAMES = ['Julian', 'Jacqueline']

export default function MuroPage() {
  const { guestName } = useAuth()
  const isAdmin = ADMIN_NAMES.some(
    (name) => guestName?.toLowerCase() === name.toLowerCase()
  )
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [texto, setTexto] = useState('')
  const [emoji, setEmoji] = useState('❤️')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadMensajes = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setIsLoading(false)
      return
    }
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .order('created_at', { ascending: false })

    setMensajes(data ?? [])
    setIsLoading(false)
  }, [])

  useEffect(() => {
    loadMensajes()

    const supabase = getSupabase()
    if (!supabase) return

    const channel = supabase
      .channel('mensajes_realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mensajes' },
        (payload) => {
          const newMsg = payload.new as Mensaje
          setMensajes((prev) => {
            if (prev.some((m) => m.id === newMsg.id)) return prev
            return [newMsg, ...prev]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [loadMensajes])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!texto.trim()) return

    setSubmitting(true)
    const supabase = getSupabase()
    if (supabase) {
      await supabase.from('mensajes').insert({
        nombre: guestName ?? 'Anonimo',
        mensaje: texto.trim(),
        emoji,
      })
    }
    setTexto('')
    setSubmitting(false)
  }

  async function handleDeleteMsg(id: string) {
    const supabase = getSupabase()
    if (!supabase) return

    setDeletingId(id)
    try {
      const { error } = await supabase.from('mensajes').delete().eq('id', id)
      if (error) throw error
      setMensajes((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      console.error('Error eliminando mensaje:', err)
    } finally {
      setDeletingId(null)
      setConfirmDeleteId(null)
    }
  }

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Muro de Mensajes
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Dejanos un mensaje o deseo especial
        </motion.p>
      </header>

      {/* Formulario */}
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-auto mt-6 max-w-lg px-4"
      >
        <textarea
          placeholder="Escribi tu mensaje para los novios..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={3}
          className="w-full resize-none rounded-xl border border-gold/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
        />

        <div className="mt-3 flex items-center justify-between">
          <div className="flex gap-2">
            {EMOJIS.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`rounded-full p-1.5 text-lg transition-all ${
                  emoji === e
                    ? 'scale-125 bg-gold/10'
                    : 'opacity-50 hover:opacity-100'
                }`}
              >
                {e}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || !texto.trim()}
            className="flex items-center gap-2 rounded-xl bg-gold px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Enviar
          </button>
        </div>
      </motion.form>

      {/* Mensajes */}
      <section className="mx-auto mt-10 max-w-2xl px-4">
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-white p-5">
                <div className="h-3 w-1/3 rounded bg-stone-200" />
                <div className="mt-3 h-3 w-full rounded bg-stone-200" />
                <div className="mt-2 h-3 w-2/3 rounded bg-stone-200" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && mensajes.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="rounded-full bg-stone-100 p-5">
              <MessageSquare className="h-10 w-10 text-stone-400" />
            </div>
            <p className="mt-4 text-base font-medium text-stone-600">
              Todavia no hay mensajes
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Se el primero en dejar un mensaje!
            </p>
          </motion.div>
        )}

        <div className="space-y-4">
          {mensajes.map((msg, i) => {
            const canDelete =
              isAdmin || msg.nombre.toLowerCase() === guestName?.toLowerCase()

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="group relative overflow-hidden rounded-xl border border-gold/10 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-text-primary">
                    {msg.nombre}
                  </span>
                  <div className="flex items-center gap-2">
                    {canDelete && confirmDeleteId !== msg.id && (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(msg.id)}
                        className="rounded-full p-1.5 text-stone-300 opacity-100 transition-all md:opacity-0 md:group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 focus:opacity-100"
                        aria-label="Eliminar mensaje"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                    <span className="text-lg">{msg.emoji}</span>
                  </div>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {msg.mensaje}
                </p>
                <p className="mt-3 text-xs text-stone-400">
                  {new Date(msg.created_at).toLocaleDateString('es-AR', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {/* Delete confirmation overlay */}
                <AnimatePresence>
                  {confirmDeleteId === msg.id && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 px-4"
                    >
                      {deletingId === msg.id ? (
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      ) : (
                        <div className="flex items-center gap-3">
                          <p className="text-xs font-medium text-white">
                            Eliminar este mensaje?
                          </p>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30"
                          >
                            No
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMsg(msg.id)}
                            className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                          >
                            Si, eliminar
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      </section>
    </div>
  )
}

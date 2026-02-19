'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart,
  Music,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Pencil,
  Trash2,
  Plus,
  LogOut,
} from 'lucide-react'
import { weddingConfig } from '@/config/wedding'
import type { HistoriaMilestone } from '@/types/database'
import {
  fetchMilestones,
  upsertMilestone,
  deleteMilestone as deleteMilestoneService,
  reorderMilestones,
} from '@/services/historiaService'
import MilestoneEditModal from '@/components/historia/MilestoneEditModal'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSpotifyEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'open.spotify.com') {
      // Filter out locale segments like /intl-es/
      const pathParts = u.pathname.split('/').filter(
        (p) => p && !/^intl-/i.test(p)
      )
      if (pathParts.length >= 2) {
        return `https://open.spotify.com/embed/${pathParts[0]}/${pathParts[1]}?utm_source=generator&theme=0`
      }
    }
  } catch {
    // ignore
  }
  return url
}

/** Convert config HistoryMilestone to our HistoriaMilestone shape for fallback */
function configToMilestone(
  item: (typeof weddingConfig.history)[number],
  index: number
): HistoriaMilestone {
  const hasImage = item.imageUrl && !item.imageUrl.startsWith('[')
  const hasDate = item.date && !item.date.startsWith('[')
  return {
    id: `config-${index}`,
    orden: index + 1,
    date: hasDate ? item.date : null,
    title: item.title,
    description: item.description,
    image_url: hasImage ? item.imageUrl : null,
    spotify_url: item.spotifyUrl ?? null,
    created_at: '',
    updated_at: '',
  }
}

const ADMIN_PIN = process.env.NEXT_PUBLIC_ADMIN_PIN

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function NuestraHistoriaPage() {
  const [milestones, setMilestones] = useState<HistoriaMilestone[]>([])
  const [isFromSupabase, setIsFromSupabase] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<
    Partial<HistoriaMilestone> | null | 'new'
  >(null)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)

  // Triple-tap tracking
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // -----------------------------------------------------------------------
  // Load data
  // -----------------------------------------------------------------------

  const loadData = useCallback(async () => {
    const { data, error } = await fetchMilestones()
    if (!error && data && data.length > 0) {
      setMilestones(data)
      setIsFromSupabase(true)
    } else {
      // Fallback to config
      setMilestones(weddingConfig.history.map(configToMilestone))
      setIsFromSupabase(false)
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadData()
  }, [loadData])

  // -----------------------------------------------------------------------
  // Triple-tap to activate edit mode
  // -----------------------------------------------------------------------

  const handleTitleTap = () => {
    if (isEditMode || !ADMIN_PIN) return

    tapCountRef.current += 1

    if (tapTimerRef.current) clearTimeout(tapTimerRef.current)

    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0
      setPinInput('')
      setPinError(false)
      setShowPinModal(true)
      return
    }

    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0
    }, 600)
  }

  const handlePinSubmit = () => {
    if (pinInput === ADMIN_PIN) {
      setShowPinModal(false)
      setIsEditMode(true)
    } else {
      setPinError(true)
    }
  }

  // -----------------------------------------------------------------------
  // Lightbox
  // -----------------------------------------------------------------------

  const openLightbox = (index: number) => {
    if (isEditMode) return
    setLightboxIndex(index)
  }
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = () => {
    if (lightboxIndex !== null)
      setLightboxIndex((lightboxIndex + 1) % milestones.length)
  }
  const goPrev = () => {
    if (lightboxIndex !== null)
      setLightboxIndex(
        (lightboxIndex - 1 + milestones.length) % milestones.length
      )
  }

  const activeMilestone =
    lightboxIndex !== null ? milestones[lightboxIndex] : null

  // -----------------------------------------------------------------------
  // Edit operations
  // -----------------------------------------------------------------------

  const handleSave = async (
    data: Partial<HistoriaMilestone> & { title: string; orden: number }
  ) => {
    const { error } = await upsertMilestone(data)
    if (!error) {
      await loadData()
      setEditingMilestone(null)
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await deleteMilestoneService(id)
    if (!error) {
      await loadData()
      setDeleteConfirm(null)
    }
  }

  const handleMoveUp = async (index: number) => {
    if (index <= 0) return
    const newOrder = [...milestones]
    const [item] = newOrder.splice(index, 1)
    newOrder.splice(index - 1, 0, item)
    setMilestones(newOrder)
    await reorderMilestones(newOrder.map((m) => m.id))
  }

  const handleMoveDown = async (index: number) => {
    if (index >= milestones.length - 1) return
    const newOrder = [...milestones]
    const [item] = newOrder.splice(index, 1)
    newOrder.splice(index + 1, 0, item)
    setMilestones(newOrder)
    await reorderMilestones(newOrder.map((m) => m.id))
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const nextOrden =
    milestones.length > 0
      ? Math.max(...milestones.map((m) => m.orden)) + 1
      : 1

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      {/* Header */}
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl select-none"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={handleTitleTap}
        >
          Nuestra Historia
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          El camino que nos trajo hasta aca
        </motion.p>

        {/* Edit mode banner */}
        {isEditMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-4 flex max-w-md items-center justify-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2"
          >
            <Pencil className="h-4 w-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">
              Modo edicion
            </span>
            <button
              onClick={() => setIsEditMode(false)}
              className="ml-2 flex items-center gap-1 rounded-lg bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-200"
            >
              <LogOut className="h-3 w-3" />
              Salir
            </button>
          </motion.div>
        )}
      </header>

      {/* Photo Gallery Grid */}
      <section className="mx-auto mt-8 max-w-4xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {milestones.map((milestone, i) => {
            const hasImage = !!milestone.image_url
            const hasSpotify = !!milestone.spotify_url

            return (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className={`group relative overflow-hidden rounded-xl border border-gold/10 bg-white shadow-sm transition-shadow hover:shadow-md ${
                  isEditMode ? '' : 'cursor-pointer'
                }`}
                onClick={() => openLightbox(i)}
              >
                {/* Image */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush/30">
                  {hasImage ? (
                    <img
                      src={milestone.image_url!}
                      alt={milestone.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Heart className="h-10 w-10 text-gold/30" />
                    </div>
                  )}

                  {/* Spotify badge */}
                  {hasSpotify && (
                    <div className="absolute top-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/60 backdrop-blur-sm">
                      <Music className="h-3.5 w-3.5 text-green-400" />
                    </div>
                  )}

                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent p-3 pt-8">
                    {milestone.date && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold/80">
                        {milestone.date}
                      </span>
                    )}
                    <h3 className="font-serif text-sm leading-tight text-white sm:text-base">
                      {milestone.title}
                    </h3>
                  </div>

                  {/* Edit mode controls */}
                  {isEditMode && (
                    <div
                      className="absolute inset-x-0 top-0 flex items-center justify-between p-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Reorder arrows */}
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleMoveUp(i)}
                          disabled={i === 0}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-30"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleMoveDown(i)}
                          disabled={i === milestones.length - 1}
                          className="flex h-7 w-7 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/80 disabled:opacity-30"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Edit / Delete */}
                      <div className="flex gap-1">
                        <button
                          onClick={() => setEditingMilestone(milestone)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-blue-600"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(milestone.id)}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* Floating add button (edit mode) */}
      {isEditMode && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setEditingMilestone('new')}
          className="fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg transition-all hover:shadow-xl hover:brightness-110 md:bottom-8"
          style={{ backgroundColor: '#C9A84C' }}
        >
          <Plus className="h-6 w-6" />
        </motion.button>
      )}

      {/* PIN modal */}
      <AnimatePresence>
        {showPinModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setShowPinModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Pencil className="mx-auto h-8 w-8 text-amber-500" />
              <h3 className="mt-3 font-serif text-lg text-stone-800">
                Modo edicion
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Ingresa el PIN de administrador
              </p>
              <input
                type="password"
                inputMode="numeric"
                value={pinInput}
                onChange={(e) => { setPinInput(e.target.value); setPinError(false) }}
                onKeyDown={(e) => e.key === 'Enter' && handlePinSubmit()}
                placeholder="PIN"
                autoFocus
                className={`mt-4 w-full rounded-xl border px-4 py-3 text-center text-lg tracking-widest focus:outline-none focus:ring-2 ${
                  pinError
                    ? 'border-red-300 focus:border-red-400 focus:ring-red-200'
                    : 'border-stone-200 focus:border-amber-400 focus:ring-amber-200'
                }`}
              />
              {pinError && (
                <p className="mt-2 text-xs text-red-500">PIN incorrecto</p>
              )}
              <div className="mt-4 flex gap-3">
                <button
                  onClick={() => setShowPinModal(false)}
                  className="flex-1 rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handlePinSubmit}
                  className="flex-1 rounded-xl px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:brightness-110"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  Entrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete confirmation */}
      <AnimatePresence>
        {deleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setDeleteConfirm(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xs rounded-2xl bg-white p-6 text-center shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 className="mx-auto h-10 w-10 text-red-400" />
              <h3 className="mt-3 font-serif text-lg text-stone-800">
                Eliminar momento?
              </h3>
              <p className="mt-1 text-sm text-stone-500">
                Esta accion no se puede deshacer.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 rounded-xl bg-stone-100 px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 rounded-xl bg-red-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-600"
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit modal */}
      <AnimatePresence>
        {editingMilestone !== null && (
          <MilestoneEditModal
            milestone={editingMilestone === 'new' ? null : editingMilestone}
            nextOrden={nextOrden}
            onSave={handleSave}
            onClose={() => setEditingMilestone(null)}
          />
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {activeMilestone && lightboxIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative mx-4 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={closeLightbox}
                className="absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Navigation arrows */}
              {milestones.length > 1 && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      goPrev()
                    }}
                    className="absolute top-1/3 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      goNext()
                    }}
                    className="absolute top-1/3 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Image */}
              {activeMilestone.image_url ? (
                <img
                  src={activeMilestone.image_url}
                  alt={activeMilestone.title}
                  className="w-full rounded-t-2xl object-cover"
                  style={{ maxHeight: '50vh' }}
                />
              ) : (
                <div className="flex h-48 w-full items-center justify-center rounded-t-2xl bg-blush/30">
                  <Heart className="h-16 w-16 text-gold/30" />
                </div>
              )}

              {/* Content */}
              <div className="p-5">
                {activeMilestone.date && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {activeMilestone.date}
                  </span>
                )}
                <h3 className="mt-1 font-serif text-xl text-text-primary">
                  {activeMilestone.title}
                </h3>
                {activeMilestone.description && (
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {activeMilestone.description}
                  </p>
                )}

                {/* Spotify embed */}
                {activeMilestone.spotify_url && (
                  <div className="mt-4 rounded-lg border border-gold/10 bg-offwhite p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Music className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-text-secondary">
                        Nuestra cancion de este momento
                      </span>
                    </div>
                    <iframe
                      src={toSpotifyEmbedUrl(activeMilestone.spotify_url)}
                      width="100%"
                      height="80"
                      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      loading="lazy"
                      className="rounded-md border-0"
                      title={`Spotify - ${activeMilestone.title}`}
                    />
                  </div>
                )}
              </div>

              {/* Photo counter */}
              <div className="border-t border-gold/10 px-5 py-3 text-center text-xs text-text-secondary">
                {lightboxIndex + 1} / {milestones.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Check, Grid3X3, ImagePlus, X } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'
import { weddingConfig } from '@/config/wedding'
import type { BingoEntry } from '@/types/database'
import imageCompression from 'browser-image-compression'

export default function BingoPage() {
  const { guestName } = useAuth()
  const { bingoChallenges } = weddingConfig
  const [completed, setCompleted] = useState<Record<number, BingoEntry>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState<number | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [activeChallengeId, setActiveChallengeId] = useState<number | null>(null)
  const [showSourcePicker, setShowSourcePicker] = useState(false)

  const loadCompleted = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase || !guestName) {
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('bingo_entries')
      .select('*')
      .eq('nombre_invitado', guestName)

    if (data) {
      const map: Record<number, BingoEntry> = {}
      data.forEach((entry) => {
        map[entry.challenge_id] = entry
      })
      setCompleted(map)
    }
    setIsLoading(false)
  }, [guestName])

  useEffect(() => {
    loadCompleted()
  }, [loadCompleted])

  function handleChallengeClick(challengeId: number) {
    if (completed[challengeId]) return
    setActiveChallengeId(challengeId)
    setShowSourcePicker(true)
  }

  function handlePickCamera() {
    setShowSourcePicker(false)
    cameraInputRef.current?.click()
  }

  function handlePickGallery() {
    setShowSourcePicker(false)
    galleryInputRef.current?.click()
  }

  function handleCancelPicker() {
    setShowSourcePicker(false)
    setActiveChallengeId(null)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || activeChallengeId === null) return

    const supabase = getSupabase()
    if (!supabase) return

    setUploading(activeChallengeId)

    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1.5,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.85,
      })

      const fileName = `${guestName}_${activeChallengeId}_${Date.now()}.${compressed.type.split('/')[1] || 'jpg'}`

      const { error: uploadError } = await supabase.storage
        .from('bingo')
        .upload(fileName, compressed)

      if (uploadError) throw uploadError

      const { data: urlData } = supabase.storage
        .from('bingo')
        .getPublicUrl(fileName)

      await supabase.from('bingo_entries').insert({
        nombre_invitado: guestName ?? 'Anonimo',
        challenge_id: activeChallengeId,
        foto_url: urlData.publicUrl,
      })

      await loadCompleted()
    } catch (err) {
      console.error('Error subiendo foto de bingo:', err)
    } finally {
      setUploading(null)
      setActiveChallengeId(null)
      if (cameraInputRef.current) cameraInputRef.current.value = ''
      if (galleryInputRef.current) galleryInputRef.current.value = ''
    }
  }

  const completedCount = Object.keys(completed).length
  const totalChallenges = bingoChallenges.length

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Bingo Fotografico
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Completa los desafios sacando fotos!
        </motion.p>

        {/* Progress */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mx-auto mt-4 max-w-xs"
        >
          <div className="flex items-center justify-between text-xs text-text-secondary">
            <span>{completedCount} de {totalChallenges} completados</span>
            <span>{Math.round((completedCount / totalChallenges) * 100)}%</span>
          </div>
          <div className="mt-1 h-2 overflow-hidden rounded-full bg-gold/10">
            <motion.div
              className="h-full rounded-full bg-gold"
              initial={{ width: 0 }}
              animate={{
                width: `${(completedCount / totalChallenges) * 100}%`,
              }}
              transition={{ duration: 0.5, delay: 0.4 }}
            />
          </div>
        </motion.div>
      </header>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Source picker modal */}
      <AnimatePresence>
        {showSourcePicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-sm p-4 sm:items-center"
            onClick={handleCancelPicker}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-serif text-lg text-stone-800">Subir foto</h3>
                <button
                  type="button"
                  onClick={handleCancelPicker}
                  className="rounded-full p-1 text-stone-400 hover:bg-stone-100"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={handlePickCamera}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-stone-50"
                  style={{ border: '1.5px solid #C9A84C' }}
                >
                  <Camera size={22} className="text-gold" />
                  <div>
                    <span className="font-medium text-stone-800">Tomar foto</span>
                    <p className="text-xs text-stone-500">Usar la camara del dispositivo</p>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={handlePickGallery}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors hover:bg-stone-50"
                  style={{ border: '1.5px solid #C9A84C' }}
                >
                  <ImagePlus size={22} className="text-gold" />
                  <div>
                    <span className="font-medium text-stone-800">Elegir de galeria</span>
                    <p className="text-xs text-stone-500">Seleccionar una foto existente</p>
                  </div>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="mx-auto mt-8 max-w-2xl px-4">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl bg-stone-200 h-28" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {bingoChallenges.map((challenge, i) => {
              const isCompleted = !!completed[challenge.id]
              const isUploading = uploading === challenge.id

              return (
                <motion.button
                  key={challenge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  onClick={() => handleChallengeClick(challenge.id)}
                  disabled={isCompleted || isUploading}
                  className={`relative flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all ${
                    isCompleted
                      ? 'border-gold bg-gold/10'
                      : 'border-gold/15 bg-white hover:border-gold/40 hover:shadow-md'
                  } ${isUploading ? 'animate-pulse' : ''}`}
                  style={{ minHeight: '7rem' }}
                >
                  {isCompleted ? (
                    <Check className="h-6 w-6 text-gold" />
                  ) : isUploading ? (
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-gold border-t-transparent" />
                  ) : (
                    <Camera className="h-6 w-6 text-stone-400" />
                  )}
                  <span
                    className={`text-xs font-medium leading-tight ${
                      isCompleted ? 'text-gold' : 'text-text-secondary'
                    }`}
                  >
                    {challenge.challenge}
                  </span>
                </motion.button>
              )
            })}
          </div>
        )}

        {!isLoading && completedCount === totalChallenges && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 rounded-2xl border border-gold bg-gold/10 p-6 text-center"
          >
            <Grid3X3 className="mx-auto h-10 w-10 text-gold" />
            <h3 className="mt-3 font-serif text-xl text-gold">Bingo completo!</h3>
            <p className="mt-1 text-sm text-text-secondary">
              Felicitaciones! Completaste todos los desafios.
            </p>
          </motion.div>
        )}
      </section>
    </div>
  )
}

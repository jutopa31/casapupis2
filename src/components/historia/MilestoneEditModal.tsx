'use client'

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, Upload, Music, Image as ImageIcon, Loader2 } from 'lucide-react'
import imageCompression from 'browser-image-compression'
import type { HistoriaMilestone } from '@/types/database'
import { uploadMilestoneImage } from '@/services/historiaService'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MilestoneEditModalProps {
  milestone: Partial<HistoriaMilestone> | null // null = creating new
  nextOrden: number
  onSave: (milestone: Partial<HistoriaMilestone> & { title: string; orden: number }) => Promise<void>
  onClose: () => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toSpotifyEmbedUrl(url: string): string {
  try {
    const u = new URL(url)
    if (u.hostname === 'open.spotify.com') {
      const pathParts = u.pathname.split('/')
      if (pathParts.length >= 3) {
        return `https://open.spotify.com/embed/${pathParts[1]}/${pathParts[2]}?utm_source=generator&theme=0`
      }
    }
  } catch {
    // ignore
  }
  return url
}

function isValidSpotifyUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return u.hostname === 'open.spotify.com'
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MilestoneEditModal({
  milestone,
  nextOrden,
  onSave,
  onClose,
}: MilestoneEditModalProps) {
  const isNew = !milestone?.id
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(milestone?.title ?? '')
  const [description, setDescription] = useState(milestone?.description ?? '')
  const [date, setDate] = useState(milestone?.date ?? '')
  const [spotifyUrl, setSpotifyUrl] = useState(milestone?.spotify_url ?? '')
  const [imageUrl, setImageUrl] = useState(milestone?.image_url ?? '')
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // -----------------------------------------------------------------------
  // Image upload
  // -----------------------------------------------------------------------

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    setUploadError(null)

    try {
      // Compress
      const compressed = await imageCompression(file, {
        maxSizeMB: 2,
        maxWidthOrHeight: 2048,
        useWebWorker: true,
        initialQuality: 0.85,
      })

      // Upload
      const { url, error } = await uploadMilestoneImage(compressed)
      if (error || !url) throw new Error(error ?? 'Upload failed')

      setImageUrl(url)
    } catch (err) {
      console.error('Error uploading image:', err)
      setUploadError('Error al subir la imagen. Intenta de nuevo.')
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  // -----------------------------------------------------------------------
  // Save
  // -----------------------------------------------------------------------

  const handleSave = async () => {
    if (!title.trim()) return

    setIsSaving(true)
    try {
      await onSave({
        ...(milestone?.id ? { id: milestone.id } : {}),
        orden: milestone?.orden ?? nextOrden,
        title: title.trim(),
        description: description.trim() || null,
        date: date.trim() || null,
        spotify_url: spotifyUrl.trim() || null,
        image_url: imageUrl || null,
      })
    } finally {
      setIsSaving(false)
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  const showSpotifyPreview = spotifyUrl && isValidSpotifyUrl(spotifyUrl)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-stone-100 bg-white px-5 py-4 rounded-t-2xl">
          <h3 className="font-serif text-lg text-stone-800">
            {isNew ? 'Nuevo momento' : 'Editar momento'}
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Image section */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wider">
              Foto
            </label>
            {imageUrl ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-stone-100">
                <img
                  src={imageUrl}
                  alt="Preview"
                  className="h-full w-full object-cover"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm transition-colors hover:bg-black/80"
                >
                  {isUploading ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <ImageIcon className="h-3.5 w-3.5" />
                  )}
                  Cambiar
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-stone-200 bg-stone-50 py-8 text-stone-400 transition-colors hover:border-[#C9A84C]/40 hover:text-[#C9A84C]"
              >
                {isUploading ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <Upload className="h-8 w-8" />
                )}
                <span className="text-sm font-medium">
                  {isUploading ? 'Subiendo...' : 'Subir foto'}
                </span>
              </button>
            )}
            {uploadError && (
              <p className="mt-1.5 text-xs text-red-500">{uploadError}</p>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />
          </div>

          {/* Title */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wider">
              Titulo *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Nos conocimos"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wider">
              Descripcion
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cuenta la historia de este momento..."
              rows={3}
              className="w-full resize-none rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
            />
          </div>

          {/* Date */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wider">
              Fecha
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Ej: Marzo 2020 o 2020-03-15"
              className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
            />
          </div>

          {/* Spotify URL */}
          <div>
            <label className="mb-1.5 block text-xs font-medium text-stone-500 uppercase tracking-wider">
              Cancion de Spotify
            </label>
            <div className="relative">
              <Music className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <input
                type="url"
                value={spotifyUrl}
                onChange={(e) => setSpotifyUrl(e.target.value)}
                placeholder="https://open.spotify.com/track/..."
                className="w-full rounded-xl border border-stone-200 py-3 pl-10 pr-4 text-sm text-stone-800 placeholder:text-stone-400 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20"
              />
            </div>
            {/* Spotify preview */}
            {showSpotifyPreview && (
              <div className="mt-2 rounded-lg border border-stone-100 bg-stone-50 p-2">
                <iframe
                  src={toSpotifyEmbedUrl(spotifyUrl)}
                  width="100%"
                  height="80"
                  allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                  loading="lazy"
                  className="rounded-md border-0"
                  title="Spotify preview"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between gap-3 border-t border-stone-100 bg-white px-5 py-4 rounded-b-2xl">
          <button
            onClick={onClose}
            className="rounded-xl px-5 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || isSaving || isUploading}
            className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#C9A84C' }}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Guardando...
              </>
            ) : (
              isNew ? 'Crear' : 'Guardar'
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

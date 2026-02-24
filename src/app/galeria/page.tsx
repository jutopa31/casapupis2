'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Images, Download, Share2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

interface GalleryPhoto {
  name: string
  url: string
}

export default function GaleriaPage() {
  const [photos, setPhotos] = useState<GalleryPhoto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [canNativeShare, setCanNativeShare] = useState(false)

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share)
  }, [])

  const handleShare = useCallback(async (url: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const file = new File([blob], 'foto-casapupis.jpg', {
        type: blob.type || 'image/jpeg',
      })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'CasaPupis' })
      } else {
        await navigator.share({ title: 'CasaPupis', url })
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err)
      }
    }
  }, [])

  const handleDownload = useCallback(async (url: string) => {
    try {
      const res = await fetch(url)
      const blob = await res.blob()
      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = 'foto-casapupis.jpg'
      a.click()
      URL.revokeObjectURL(blobUrl)
    } catch {
      window.open(url, '_blank')
    }
  }, [])

  const loadPhotos = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const { data } = await supabase.storage
      .from('galeria-pareja')
      .list('', { limit: 100, sortBy: { column: 'name', order: 'asc' } })

    if (data && data.length > 0) {
      const urls = data
        .filter((f) => !f.name.startsWith('.'))
        .map((file) => {
          const { data: urlData } = supabase.storage
            .from('galeria-pareja')
            .getPublicUrl(file.name)
          return { name: file.name, url: urlData.publicUrl }
        })
      setPhotos(urls)
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadPhotos()
  }, [loadPhotos])

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Nuestra Galeria
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Algunos de nuestros momentos favoritos
        </motion.p>
      </header>

      <section className="mx-auto mt-8 max-w-6xl px-4">
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-xl bg-stone-200"
                style={{ aspectRatio: '1' }}
              />
            ))}
          </div>
        )}

        {!isLoading && photos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="rounded-full bg-stone-100 p-5">
              <Images className="h-10 w-10 text-stone-400" />
            </div>
            <p className="mt-4 text-base font-medium text-stone-600">
              Galeria en preparacion
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Pronto subiremos nuestras fotos favoritas
            </p>
          </motion.div>
        )}

        {!isLoading && photos.length > 0 && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {photos.map((photo, i) => (
              <motion.button
                key={photo.name}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setLightboxIndex(i)}
                className="group overflow-hidden rounded-xl border border-gold/10 shadow-sm"
                style={{ aspectRatio: '1' }}
              >
                <img
                  src={photo.url}
                  alt={photo.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </motion.button>
            ))}
          </div>
        )}
      </section>

      {/* Simple lightbox */}
      {lightboxIndex !== null && photos[lightboxIndex] && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            className="absolute top-4 right-4 z-10 text-2xl text-white/70 hover:text-white"
            onClick={() => setLightboxIndex(null)}
          >
            ✕
          </button>

          {lightboxIndex > 0 && (
            <button
              type="button"
              className="absolute left-4 z-10 text-3xl text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex - 1)
              }}
            >
              ‹
            </button>
          )}

          {lightboxIndex < photos.length - 1 && (
            <button
              type="button"
              className="absolute right-4 z-10 text-3xl text-white/70 hover:text-white"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex(lightboxIndex + 1)
              }}
            >
              ›
            </button>
          )}

          <div
            className="flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={photos[lightboxIndex].url}
              alt={photos[lightboxIndex].name}
              className="max-h-[80vh] max-w-full rounded-lg object-contain"
            />
            <div className="mt-4 flex items-center gap-3">
              {canNativeShare && (
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleShare(photos[lightboxIndex!].url) }}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 focus:outline-none"
                  aria-label="Compartir foto"
                >
                  <Share2 size={16} />
                  Compartir
                </button>
              )}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); handleDownload(photos[lightboxIndex!].url) }}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 focus:outline-none"
                aria-label="Descargar foto"
              >
                <Download size={16} />
                Descargar
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

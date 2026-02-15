'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Music, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { weddingConfig } from '@/config/wedding'

function toSpotifyEmbedUrl(url: string): string {
  // Convert open.spotify.com/track/ID to embed format
  try {
    const u = new URL(url)
    if (u.hostname === 'open.spotify.com') {
      const pathParts = u.pathname.split('/')
      // e.g. /track/ABC123 -> /embed/track/ABC123
      if (pathParts.length >= 3) {
        return `https://open.spotify.com/embed/${pathParts[1]}/${pathParts[2]}?utm_source=generator&theme=0`
      }
    }
  } catch {
    // If URL parsing fails, return as-is
  }
  return url
}

export default function NuestraHistoriaPage() {
  const { history } = weddingConfig
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const openLightbox = (index: number) => setLightboxIndex(index)
  const closeLightbox = () => setLightboxIndex(null)

  const goNext = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % history.length)
    }
  }
  const goPrev = () => {
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + history.length) % history.length)
    }
  }

  const activeMilestone = lightboxIndex !== null ? history[lightboxIndex] : null

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      {/* Header */}
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
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
      </header>

      {/* Photo Gallery Grid */}
      <section className="mx-auto mt-8 max-w-4xl px-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
          {history.map((milestone, i) => {
            const hasImage = milestone.imageUrl && !milestone.imageUrl.startsWith('[')
            const hasSpotify = !!milestone.spotifyUrl

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="group relative cursor-pointer overflow-hidden rounded-xl border border-gold/10 bg-white shadow-sm transition-shadow hover:shadow-md"
                onClick={() => openLightbox(i)}
              >
                {/* Image */}
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-blush/30">
                  {hasImage ? (
                    <img
                      src={milestone.imageUrl}
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
                    {milestone.date && !milestone.date.startsWith('[') && (
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-gold/80">
                        {milestone.date}
                      </span>
                    )}
                    <h3 className="font-serif text-sm leading-tight text-white sm:text-base">
                      {milestone.title}
                    </h3>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

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
              {history.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); goPrev() }}
                    className="absolute top-1/3 left-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); goNext() }}
                    className="absolute top-1/3 right-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-colors hover:bg-black/60"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}

              {/* Image */}
              {activeMilestone.imageUrl && !activeMilestone.imageUrl.startsWith('[') ? (
                <img
                  src={activeMilestone.imageUrl}
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
                {activeMilestone.date && !activeMilestone.date.startsWith('[') && (
                  <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                    {activeMilestone.date}
                  </span>
                )}
                <h3 className="mt-1 font-serif text-xl text-text-primary">
                  {activeMilestone.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {activeMilestone.description}
                </p>

                {/* Spotify embed */}
                {activeMilestone.spotifyUrl && (
                  <div className="mt-4 rounded-lg border border-gold/10 bg-offwhite p-3">
                    <div className="mb-2 flex items-center gap-1.5">
                      <Music className="h-3.5 w-3.5 text-green-600" />
                      <span className="text-xs font-medium text-text-secondary">
                        Nuestra cancion de este momento
                      </span>
                    </div>
                    <iframe
                      src={toSpotifyEmbedUrl(activeMilestone.spotifyUrl)}
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
                {lightboxIndex + 1} / {history.length}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

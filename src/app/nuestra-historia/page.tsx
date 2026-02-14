'use client'

import { motion } from 'framer-motion'
import { Heart, Music } from 'lucide-react'
import { weddingConfig } from '@/config/wedding'

/**
 * Extracts a Spotify embed URL from a standard Spotify link.
 * E.g. "https://open.spotify.com/track/ABC" → "https://open.spotify.com/embed/track/ABC"
 */
function toSpotifyEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url)
    if (parsed.hostname !== 'open.spotify.com') return url
    // Insert /embed after the hostname if not already present
    if (parsed.pathname.startsWith('/embed/')) return url
    return `https://open.spotify.com/embed${parsed.pathname}?utm_source=generator&theme=0`
  } catch {
    return url
  }
}

export default function NuestraHistoriaPage() {
  const { history } = weddingConfig

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
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

      <section className="mx-auto mt-10 max-w-xl px-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/20" />

          <div className="space-y-10">
            {history.map((milestone, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="relative flex gap-5 pl-2"
              >
                {/* Heart circle */}
                <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-offwhite">
                  <Heart className="h-4 w-4 text-gold" />
                </div>

                {/* Content */}
                <div className="flex-1 rounded-xl border border-gold/10 bg-white p-5 shadow-sm">
                  {milestone.date && !milestone.date.startsWith('[') && (
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                      {milestone.date}
                    </span>
                  )}
                  <h3 className="mt-1 font-serif text-lg text-text-primary">
                    {milestone.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                    {milestone.description}
                  </p>

                  {milestone.imageUrl && !milestone.imageUrl.startsWith('[') && (
                    <div className="mt-3 overflow-hidden rounded-lg">
                      <img
                        src={milestone.imageUrl}
                        alt={milestone.title}
                        className="w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}

                  {milestone.spotifyUrl && (
                    <div className="mt-3">
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
                        <Music className="h-3 w-3" />
                        <span>Nuestra cancion de este momento</span>
                      </div>
                      <div className="overflow-hidden rounded-lg">
                        <iframe
                          src={toSpotifyEmbedUrl(milestone.spotifyUrl)}
                          width="100%"
                          height="80"
                          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                          loading="lazy"
                          className="border-0"
                          title={`Spotify - ${milestone.title}`}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

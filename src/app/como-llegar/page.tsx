'use client'

import { motion } from 'framer-motion'
import { MapPin, Navigation, Car } from 'lucide-react'
import { weddingConfig } from '@/config/wedding'

const { location } = weddingConfig.couple

export default function ComoLlegarPage() {
  const embedUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Como Llegar
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Indicaciones para llegar al evento
        </motion.p>
      </header>

      <div className="mx-auto mt-8 max-w-2xl px-4">
        {/* Venue info card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-gold/10 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10">
              <MapPin className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-text-primary">{location.venue}</h2>
              <p className="mt-1 text-sm text-text-secondary">
                {location.neighborhood}, {location.city}, {location.province}
              </p>
            </div>
          </div>

          {/* Navigation buttons */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {location.mapUrl && !location.mapUrl.startsWith('[') && (
              <a
                href={location.mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90"
              >
                <Navigation className="h-4 w-4" />
                Google Maps
              </a>
            )}
            {location.wazeUrl && !location.wazeUrl.startsWith('[') && (
              <a
                href={location.wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gold/30 py-3 text-sm font-medium text-gold transition-colors hover:bg-gold/5"
              >
                <Car className="h-4 w-4" />
                Waze
              </a>
            )}
          </div>
        </motion.div>

        {/* Map embed */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 overflow-hidden rounded-2xl border border-gold/10 shadow-sm"
        >
          {embedUrl ? (
            <iframe
              src={embedUrl}
              width="100%"
              height="400"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicacion del evento"
            />
          ) : (
            <div className="flex h-[400px] flex-col items-center justify-center bg-stone-100 text-center">
              <MapPin className="h-12 w-12 text-stone-300" />
              <p className="mt-4 text-sm text-stone-500">
                Mapa no disponible
              </p>
              <p className="mt-1 text-xs text-stone-400">
                {location.venue} — {location.neighborhood}, {location.city}
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}

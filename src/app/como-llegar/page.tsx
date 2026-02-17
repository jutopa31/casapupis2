'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, Navigation, Car, Route, AlertTriangle, X } from 'lucide-react'
import { weddingConfig } from '@/config/wedding'

const { location } = weddingConfig.couple

export default function ComoLlegarPage() {
  const embedUrl = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_URL
  const [showRouteImage, setShowRouteImage] = useState(false)

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
              {location.address && (
                <p className="mt-0.5 text-sm font-medium text-text-primary">
                  {location.address}
                </p>
              )}
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

        {/* Suggested route card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6 rounded-2xl border border-gold/10 bg-white p-6 shadow-sm"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gold/10">
              <Route className="h-6 w-6 text-gold" />
            </div>
            <div>
              <h2 className="font-serif text-xl text-text-primary">Ruta sugerida</h2>
              <p className="mt-1 text-sm text-text-secondary">
                Desde la YPF de Mitre hasta la quinta
              </p>
            </div>
          </div>

          {/* Attention banner */}
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
            <p className="text-sm text-amber-800">
              <span className="font-semibold">Atencion:</span> una vez dentro de El Pato, aca se muestra el camino con la ruta asfaltada
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRouteImage(true)}
            className="mt-4 w-full overflow-hidden rounded-xl border border-gold/10 transition-opacity hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-gold/40"
          >
            <Image
              src="/ruta-sugerida.jpeg"
              alt="Mapa con la ruta sugerida desde la YPF de Mitre hasta la quinta"
              width={600}
              height={450}
              className="w-full cursor-pointer object-cover"
            />
          </button>

          <a
            href="https://maps.app.goo.gl/kVYA1fji6S7H4jm56"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90"
          >
            <Navigation className="h-4 w-4" />
            Ver ruta en Google Maps
          </a>
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

      {/* Route image lightbox */}
      <AnimatePresence>
        {showRouteImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setShowRouteImage(false)}
            onKeyDown={(e) => { if (e.key === 'Escape') setShowRouteImage(false) }}
            role="dialog"
            aria-modal="true"
            aria-label="Ruta sugerida ampliada"
          >
            <button
              type="button"
              onClick={() => setShowRouteImage(false)}
              className="absolute right-4 top-4 z-10 rounded-full bg-black/50 p-2 text-white transition-colors hover:bg-black/70"
              aria-label="Cerrar"
            >
              <X className="h-6 w-6" />
            </button>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="relative mx-4 max-h-[90vh] max-w-[90vw]"
            >
              <Image
                src="/ruta-sugerida.jpeg"
                alt="Mapa con la ruta sugerida desde la YPF de Mitre hasta la quinta"
                width={1200}
                height={900}
                className="max-h-[90vh] w-auto rounded-lg object-contain"
                priority
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

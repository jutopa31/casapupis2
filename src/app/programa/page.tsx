'use client'

import { motion } from 'framer-motion'
import {
  DoorOpen,
  Heart,
  Wine,
  UtensilsCrossed,
  Music,
  PartyPopper,
  Clock,
} from 'lucide-react'
import { weddingConfig } from '@/config/wedding'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  DoorOpen,
  Heart,
  Wine,
  UtensilsCrossed,
  Music,
  PartyPopper,
}

export default function ProgramaPage() {
  const { timeline } = weddingConfig

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Programa del Evento
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          Asi sera nuestra noche especial
        </motion.p>
      </header>

      <section className="mx-auto mt-10 max-w-xl px-4">
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-6 top-0 bottom-0 w-px bg-gold/20" />

          <div className="space-y-8">
            {timeline.map((event, i) => {
              const Icon = iconMap[event.icon] ?? Clock

              return (
                <motion.div
                  key={event.time}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  className="relative flex gap-5 pl-2"
                >
                  {/* Icon circle */}
                  <div className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-gold bg-offwhite">
                    <Icon className="h-4 w-4 text-gold" />
                  </div>

                  {/* Content */}
                  <div className="rounded-xl border border-gold/10 bg-white p-4 shadow-sm flex-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gold">
                      {event.time} hs
                    </span>
                    <h3 className="mt-1 font-serif text-lg text-text-primary">
                      {event.title}
                    </h3>
                    <p className="mt-1 text-sm leading-relaxed text-text-secondary">
                      {event.description}
                    </p>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

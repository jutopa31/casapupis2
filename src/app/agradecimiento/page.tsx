'use client'

import { motion } from 'framer-motion'
import { HeartHandshake } from 'lucide-react'
import { weddingConfig } from '@/config/wedding'

export default function AgradecimientoPage() {
  const { thankYouText, collaborationText } = weddingConfig

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Agradecimiento
        </motion.h1>
      </header>

      <div className="mx-auto mt-6 max-w-lg px-4 space-y-6">
        {/* Thank you message */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-gold/10 bg-white p-6 text-center shadow-sm"
        >
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
            <HeartHandshake className="h-7 w-7 text-gold" />
          </div>
          <p className="text-sm leading-relaxed text-text-secondary">
            {thankYouText}
          </p>
        </motion.div>

        {/* Collaboration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="rounded-2xl border border-gold/10 bg-white p-6 shadow-sm"
        >
          <h2 className="font-serif text-xl text-gold text-center">
            Colaboracion
          </h2>
          <p className="mt-3 text-center text-sm leading-relaxed text-text-secondary">
            {collaborationText}
          </p>
        </motion.div>
      </div>
    </div>
  )
}

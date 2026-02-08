'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Send } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'

export default function ConfirmarPage() {
  const { guestName } = useAuth()

  const [asiste, setAsiste] = useState<boolean | null>(null)
  const [acompanante, setAcompanante] = useState(false)
  const [nombreAcompanante, setNombreAcompanante] = useState('')
  const [ninos, setNinos] = useState(false)
  const [cantidadNinos, setCantidadNinos] = useState(1)
  const [restricciones, setRestricciones] = useState('')
  const [mensaje, setMensaje] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (asiste === null) {
      setError('Por favor indica si vas a asistir')
      return
    }

    setSubmitting(true)
    setError('')

    const supabase = getSupabase()
    if (!supabase) {
      setSubmitted(true)
      setSubmitting(false)
      return
    }

    const { error: dbError } = await supabase.from('rsvp_entries').insert({
      nombre: guestName ?? 'Anonimo',
      asiste,
      acompanante,
      nombre_acompanante: acompanante ? nombreAcompanante || null : null,
      ninos,
      cantidad_ninos: ninos ? cantidadNinos : 0,
      restricciones: restricciones || null,
      mensaje: mensaje || null,
    })

    if (dbError) {
      setError('Hubo un error al enviar. Intenta de nuevo.')
      console.error(dbError)
    } else {
      setSubmitted(true)
    }
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-offwhite px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gold/10">
            <CheckCircle className="h-8 w-8 text-gold" />
          </div>
          <h2 className="font-serif text-2xl text-gold">
            {asiste ? 'Nos vemos ahi!' : 'Gracias por avisarnos'}
          </h2>
          <p className="mt-2 text-sm text-text-secondary">
            {asiste
              ? 'Tu confirmacion fue registrada. Te esperamos!'
              : 'Lamentamos que no puedas venir. Te vamos a extranar!'}
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Confirmar Asistencia
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {guestName ? `Hola ${guestName}!` : ''} Contanos si vas a venir
        </motion.p>
      </header>

      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mx-auto mt-6 max-w-lg space-y-6 px-4"
      >
        {/* Asistencia */}
        <fieldset>
          <legend className="mb-3 text-sm font-medium text-text-primary">
            Vas a asistir al evento?
          </legend>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setAsiste(true)}
              className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                asiste === true
                  ? 'border-gold bg-gold text-white'
                  : 'border-gold/20 bg-white text-text-primary hover:border-gold/40'
              }`}
            >
              Si, voy!
            </button>
            <button
              type="button"
              onClick={() => setAsiste(false)}
              className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                asiste === false
                  ? 'border-gold bg-gold text-white'
                  : 'border-gold/20 bg-white text-text-primary hover:border-gold/40'
              }`}
            >
              No puedo ir
            </button>
          </div>
        </fieldset>

        {asiste && (
          <>
            {/* Acompanante */}
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-text-primary">
                Venis con acompanante?
              </legend>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setAcompanante(true)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                    acompanante
                      ? 'border-gold bg-gold text-white'
                      : 'border-gold/20 bg-white text-text-primary hover:border-gold/40'
                  }`}
                >
                  Si
                </button>
                <button
                  type="button"
                  onClick={() => setAcompanante(false)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                    !acompanante
                      ? 'border-gold bg-gold text-white'
                      : 'border-gold/20 bg-white text-text-primary hover:border-gold/40'
                  }`}
                >
                  No
                </button>
              </div>
              {acompanante && (
                <input
                  type="text"
                  placeholder="Nombre del acompanante"
                  value={nombreAcompanante}
                  onChange={(e) => setNombreAcompanante(e.target.value)}
                  className="mt-3 w-full rounded-xl border border-gold/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
                />
              )}
            </fieldset>

            {/* Ninos */}
            <fieldset>
              <legend className="mb-3 text-sm font-medium text-text-primary">
                Venis con ninos?
              </legend>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setNinos(true)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                    ninos
                      ? 'border-gold bg-gold text-white'
                      : 'border-gold/20 bg-white text-text-primary hover:border-gold/40'
                  }`}
                >
                  Si
                </button>
                <button
                  type="button"
                  onClick={() => setNinos(false)}
                  className={`flex-1 rounded-xl border py-3 text-sm font-medium transition-all ${
                    !ninos
                      ? 'border-gold bg-gold text-white'
                      : 'border-gold/20 bg-white text-text-primary hover:border-gold/40'
                  }`}
                >
                  No
                </button>
              </div>
              {ninos && (
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-text-secondary">Cantidad:</label>
                  <select
                    value={cantidadNinos}
                    onChange={(e) => setCantidadNinos(Number(e.target.value))}
                    className="rounded-lg border border-gold/20 bg-white px-3 py-2 text-sm outline-none focus:border-gold/50"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
            </fieldset>

            {/* Restricciones alimentarias */}
            <div>
              <label className="mb-2 block text-sm font-medium text-text-primary">
                Restricciones alimentarias (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: vegetariano, celiaco..."
                value={restricciones}
                onChange={(e) => setRestricciones(e.target.value)}
                className="w-full rounded-xl border border-gold/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
              />
            </div>
          </>
        )}

        {/* Mensaje */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-primary">
            Mensaje para los novios (opcional)
          </label>
          <textarea
            placeholder="Dejanos unas palabras..."
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-gold/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
          />
        </div>

        {error && <p className="text-center text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={submitting || asiste === null}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
        >
          <Send className="h-4 w-4" />
          {submitting ? 'Enviando...' : 'Confirmar'}
        </button>
      </motion.form>
    </div>
  )
}

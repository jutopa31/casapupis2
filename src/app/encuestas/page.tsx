'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { BarChart2, Send, CheckCircle2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'
import { weddingConfig } from '@/config/wedding'
import type { EncuestaRespuesta } from '@/types/database'
import Toast from '@/components/ui/Toast'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREGUNTAS = weddingConfig.encuestas
const ADMIN_NAMES = ['Julian', 'Jacqueline']

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Respuestas = Record<number, string>
type Resultados = Record<number, Record<string, number>>

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calcularResultados(respuestas: EncuestaRespuesta[]): Resultados {
  const resultados: Resultados = {}
  for (const r of respuestas) {
    if (!resultados[r.pregunta_id]) {
      resultados[r.pregunta_id] = {}
    }
    resultados[r.pregunta_id][r.respuesta] =
      (resultados[r.pregunta_id][r.respuesta] ?? 0) + 1
  }
  return resultados
}

function totalVotos(conteos: Record<string, number>): number {
  return Object.values(conteos).reduce((acc, n) => acc + n, 0)
}

// ---------------------------------------------------------------------------
// Result bar for a single option
// ---------------------------------------------------------------------------

function BarraResultado({
  opcion,
  votos,
  total,
  esMiRespuesta,
  delay,
}: {
  opcion: string
  votos: number
  total: number
  esMiRespuesta: boolean
  delay: number
}) {
  const porcentaje = total === 0 ? 0 : Math.round((votos / total) * 100)

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span
          className={`font-medium ${
            esMiRespuesta ? 'text-gold' : 'text-text-primary'
          }`}
        >
          {opcion}
          {esMiRespuesta && (
            <span className="ml-2 text-xs font-normal text-gold/70">
              (tu voto)
            </span>
          )}
        </span>
        <span className="text-xs text-text-secondary">
          {porcentaje}% · {votos}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-stone-100">
        <motion.div
          className={`h-full rounded-full ${
            esMiRespuesta ? 'bg-gold' : 'bg-gold/30'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${porcentaje}%` }}
          transition={{ duration: 0.7, delay, ease: 'easeOut' }}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Results view for a single question
// ---------------------------------------------------------------------------

function TarjetaResultado({
  preguntaId,
  pregunta,
  opciones,
  resultados,
  miRespuesta,
  index,
}: {
  preguntaId: number
  pregunta: string
  opciones: string[]
  resultados: Resultados
  miRespuesta: string | undefined
  index: number
}) {
  const conteos = resultados[preguntaId] ?? {}
  const total = totalVotos(conteos)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-gold/15 bg-white p-5 shadow-sm"
    >
      <p className="mb-4 font-serif text-base font-semibold text-text-primary">
        {pregunta}
      </p>
      <div className="space-y-3">
        {opciones.map((opcion, i) => (
          <BarraResultado
            key={opcion}
            opcion={opcion}
            votos={conteos[opcion] ?? 0}
            total={total}
            esMiRespuesta={miRespuesta === opcion}
            delay={index * 0.1 + i * 0.07}
          />
        ))}
      </div>
      <p className="mt-3 text-right text-xs text-text-secondary">
        {total} {total === 1 ? 'respuesta' : 'respuestas'}
      </p>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function EncuestasPage() {
  const { guestName } = useAuth()
  const isAdmin = ADMIN_NAMES.some(
    (n) => guestName?.toLowerCase() === n.toLowerCase(),
  )

  const [isLoading, setIsLoading] = useState(true)
  const [yaRespondio, setYaRespondio] = useState(false)
  const [misRespuestas, setMisRespuestas] = useState<Respuestas>({})
  const [seleccion, setSeleccion] = useState<Respuestas>({})
  const [todasLasRespuestas, setTodasLasRespuestas] = useState<
    EncuestaRespuesta[]
  >([])
  const [submitting, setSubmitting] = useState(false)
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    visible: boolean
  }>({ message: '', type: 'success', visible: false })

  const mostrarResultados = yaRespondio || isAdmin

  const cargarRespuestas = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const { data } = await supabase
      .from('encuesta_respuestas')
      .select('*')
      .order('created_at', { ascending: true })

    const todas = (data ?? []) as EncuestaRespuesta[]
    setTodasLasRespuestas(todas)

    // Check if current guest has already answered
    const propias = todas.filter(
      (r) => r.nombre_invitado.toLowerCase() === (guestName ?? '').toLowerCase(),
    )
    if (propias.length > 0) {
      setYaRespondio(true)
      const mapa: Respuestas = {}
      for (const r of propias) {
        mapa[r.pregunta_id] = r.respuesta
      }
      setMisRespuestas(mapa)
    }

    setIsLoading(false)
  }, [guestName])

  useEffect(() => {
    cargarRespuestas()
  }, [cargarRespuestas])

  async function handleEnviar() {
    if (Object.keys(seleccion).length < PREGUNTAS.length) return

    setSubmitting(true)
    const supabase = getSupabase()

    if (!supabase) {
      setToast({
        message: 'No se pudo conectar. Intenta de nuevo.',
        type: 'error',
        visible: true,
      })
      setSubmitting(false)
      return
    }

    const rows = PREGUNTAS.map((p) => ({
      nombre_invitado: guestName ?? 'Anonimo',
      pregunta_id: p.id,
      respuesta: seleccion[p.id],
    }))

    const { error } = await supabase.from('encuesta_respuestas').insert(rows)

    if (error) {
      setToast({
        message: 'Hubo un error al enviar. Intenta de nuevo.',
        type: 'error',
        visible: true,
      })
    } else {
      setMisRespuestas(seleccion)
      setYaRespondio(true)
      await cargarRespuestas()
      setToast({
        message: '¡Gracias por responder!',
        type: 'success',
        visible: true,
      })
    }

    setSubmitting(false)
  }

  const resultados = calcularResultados(todasLasRespuestas)
  const todasSeleccionadas = PREGUNTAS.every((p) => seleccion[p.id])

  return (
    <div className="min-h-screen bg-offwhite pb-24 md:pb-8">
      {/* Header */}
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-3 flex justify-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gold/10">
            <BarChart2 className="h-7 w-7 text-gold" />
          </div>
        </motion.div>
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Encuestas
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {mostrarResultados
            ? 'Resultados en tiempo real'
            : 'Contanos qué pensás sobre la boda'}
        </motion.p>
      </header>

      <section className="mx-auto mt-6 max-w-lg space-y-4 px-4">
        {/* Loading skeleton */}
        {isLoading && (
          <>
            {Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-2xl border border-gold/10 bg-white p-5"
              >
                <div className="mb-4 h-4 w-3/4 rounded bg-stone-200" />
                <div className="space-y-3">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="space-y-1">
                      <div className="flex justify-between">
                        <div className="h-3 w-1/3 rounded bg-stone-200" />
                        <div className="h-3 w-10 rounded bg-stone-200" />
                      </div>
                      <div className="h-2 w-full rounded-full bg-stone-100" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Results view */}
        {!isLoading && mostrarResultados && (
          <>
            {yaRespondio && !isAdmin && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
              >
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                Ya enviaste tus respuestas. Acá están los resultados!
              </motion.div>
            )}
            {PREGUNTAS.map((p, i) => (
              <TarjetaResultado
                key={p.id}
                preguntaId={p.id}
                pregunta={p.pregunta}
                opciones={p.opciones}
                resultados={resultados}
                miRespuesta={misRespuestas[p.id]}
                index={i}
              />
            ))}
          </>
        )}

        {/* Form view */}
        {!isLoading && !mostrarResultados && (
          <>
            {PREGUNTAS.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl border border-gold/15 bg-white p-5 shadow-sm"
              >
                <p className="mb-4 font-serif text-base font-semibold text-text-primary">
                  {p.pregunta}
                </p>
                <div className="flex flex-wrap gap-2">
                  {p.opciones.map((opcion) => {
                    const seleccionada = seleccion[p.id] === opcion
                    return (
                      <button
                        key={opcion}
                        type="button"
                        onClick={() =>
                          setSeleccion((prev) => ({ ...prev, [p.id]: opcion }))
                        }
                        className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                          seleccionada
                            ? 'border-gold bg-gold text-white shadow-sm'
                            : 'border-gold/20 bg-white text-text-secondary hover:border-gold/50 hover:text-text-primary'
                        }`}
                      >
                        {opcion}
                      </button>
                    )
                  })}
                </div>
              </motion.div>
            ))}

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: PREGUNTAS.length * 0.08 + 0.1 }}
              type="button"
              onClick={handleEnviar}
              disabled={submitting || !todasSeleccionadas}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gold py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Enviando...' : 'Enviar respuestas'}
            </motion.button>

            {!todasSeleccionadas && (
              <p className="text-center text-xs text-text-secondary">
                Respondé todas las preguntas para poder enviar
              </p>
            )}
          </>
        )}
      </section>

      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.visible}
        onClose={() => setToast((t) => ({ ...t, visible: false }))}
      />
    </div>
  )
}

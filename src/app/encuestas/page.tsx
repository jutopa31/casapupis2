'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart2,
  Send,
  CheckCircle2,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'
import type { EncuestaRespuesta, EncuestaPreguntaDB } from '@/types/database'
import Toast from '@/components/ui/Toast'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

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
  pregunta,
  resultados,
  miRespuesta,
  index,
}: {
  pregunta: EncuestaPreguntaDB
  resultados: Resultados
  miRespuesta: string | undefined
  index: number
}) {
  const conteos = resultados[pregunta.id] ?? {}
  // Combine config options + any custom responses from DB
  const opcionesConocidas = new Set(pregunta.opciones)
  const opcionesExtra = Object.keys(conteos).filter(
    (k) => !opcionesConocidas.has(k),
  )
  const todasOpciones = [...pregunta.opciones, ...opcionesExtra]
  const total = totalVotos(conteos)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="rounded-2xl border border-gold/15 bg-white p-5 shadow-sm"
    >
      <p className="mb-4 font-serif text-base font-semibold text-text-primary">
        {pregunta.pregunta}
      </p>
      <div className="space-y-3">
        {todasOpciones.map((opcion, i) => (
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
// Admin: Question form (create / edit)
// ---------------------------------------------------------------------------

function FormularioPregunta({
  initial,
  onSave,
  onCancel,
  saving,
}: {
  initial?: EncuestaPreguntaDB
  onSave: (data: {
    pregunta: string
    opciones: string[]
    permitir_otra: boolean
  }) => void
  onCancel: () => void
  saving: boolean
}) {
  const [pregunta, setPregunta] = useState(initial?.pregunta ?? '')
  const [opciones, setOpciones] = useState<string[]>(
    initial?.opciones.length ? [...initial.opciones] : ['', ''],
  )
  const [permitirOtra, setPermitirOtra] = useState(
    initial?.permitir_otra ?? false,
  )

  function updateOpcion(index: number, value: string) {
    setOpciones((prev) => prev.map((o, i) => (i === index ? value : o)))
  }

  function removeOpcion(index: number) {
    if (opciones.length <= 2) return
    setOpciones((prev) => prev.filter((_, i) => i !== index))
  }

  function addOpcion() {
    setOpciones((prev) => [...prev, ''])
  }

  const canSave =
    pregunta.trim() &&
    opciones.filter((o) => o.trim()).length >= 2 &&
    !saving

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden rounded-2xl border border-gold/30 bg-white p-5 shadow-sm"
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Pregunta
          </label>
          <input
            type="text"
            value={pregunta}
            onChange={(e) => setPregunta(e.target.value)}
            placeholder="Escribí tu pregunta..."
            className="w-full rounded-xl border border-gold/20 bg-white px-4 py-3 text-sm outline-none focus:border-gold/50"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-text-secondary">
            Opciones (mínimo 2)
          </label>
          <div className="space-y-2">
            {opciones.map((opcion, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opcion}
                  onChange={(e) => updateOpcion(i, e.target.value)}
                  placeholder={`Opción ${i + 1}`}
                  className="flex-1 rounded-lg border border-gold/20 bg-white px-3 py-2 text-sm outline-none focus:border-gold/50"
                />
                {opciones.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeOpcion(i)}
                    className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addOpcion}
            className="mt-2 flex items-center gap-1 text-xs font-medium text-gold transition-colors hover:text-gold/70"
          >
            <Plus className="h-3.5 w-3.5" />
            Agregar opción
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-text-primary">
          <input
            type="checkbox"
            checked={permitirOtra}
            onChange={(e) => setPermitirOtra(e.target.checked)}
            className="h-4 w-4 rounded border-gold/30 accent-gold"
          />
          Permitir respuesta personalizada (&quot;Otra...&quot;)
        </label>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              onSave({
                pregunta: pregunta.trim(),
                opciones: opciones.filter((o) => o.trim()),
                permitir_otra: permitirOtra,
              })
            }
            disabled={!canSave}
            className="flex items-center gap-2 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-text-secondary transition-colors hover:bg-stone-50"
          >
            Cancelar
          </button>
        </div>
      </div>
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

  // Data
  const [preguntas, setPreguntas] = useState<EncuestaPreguntaDB[]>([])
  const [todasLasRespuestas, setTodasLasRespuestas] = useState<
    EncuestaRespuesta[]
  >([])
  const [isLoading, setIsLoading] = useState(true)

  // Guest form state
  const [yaRespondio, setYaRespondio] = useState(false)
  const [misRespuestas, setMisRespuestas] = useState<Respuestas>({})
  const [seleccion, setSeleccion] = useState<Respuestas>({})
  const [otraAbierta, setOtraAbierta] = useState<Record<number, boolean>>({})
  const [otraTexto, setOtraTexto] = useState<Record<number, string>>({})
  const [submitting, setSubmitting] = useState(false)

  // Admin state
  const [creando, setCreando] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [eliminandoId, setEliminandoId] = useState<number | null>(null)
  const [adminSaving, setAdminSaving] = useState(false)

  // Toast
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'error'
    visible: boolean
  }>({ message: '', type: 'success', visible: false })

  const preguntasActivas = preguntas.filter((p) => p.activa)
  const mostrarResultados = yaRespondio || isAdmin

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------

  const cargarDatos = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const [preguntasRes, respuestasRes] = await Promise.all([
      supabase
        .from('encuesta_preguntas')
        .select('*')
        .order('id', { ascending: true }),
      supabase
        .from('encuesta_respuestas')
        .select('*')
        .order('created_at', { ascending: true }),
    ])

    const preg = (preguntasRes.data ?? []) as EncuestaPreguntaDB[]
    const resp = (respuestasRes.data ?? []) as EncuestaRespuesta[]

    setPreguntas(preg)
    setTodasLasRespuestas(resp)

    // Check if current guest already answered
    const propias = resp.filter(
      (r) =>
        r.nombre_invitado.toLowerCase() === (guestName ?? '').toLowerCase(),
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
    cargarDatos()
  }, [cargarDatos])

  // -------------------------------------------------------------------------
  // Guest: submit answers
  // -------------------------------------------------------------------------

  async function handleEnviar() {
    if (Object.keys(seleccion).length < preguntasActivas.length) return

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

    const rows = preguntasActivas.map((p) => ({
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
      await cargarDatos()
      setToast({
        message: '¡Gracias por responder!',
        type: 'success',
        visible: true,
      })
    }

    setSubmitting(false)
  }

  // -------------------------------------------------------------------------
  // Guest: select option (including "Otra")
  // -------------------------------------------------------------------------

  function seleccionarOpcion(preguntaId: number, opcion: string) {
    setSeleccion((prev) => ({ ...prev, [preguntaId]: opcion }))
    setOtraAbierta((prev) => ({ ...prev, [preguntaId]: false }))
    setOtraTexto((prev) => ({ ...prev, [preguntaId]: '' }))
  }

  function toggleOtra(preguntaId: number) {
    const abierta = !otraAbierta[preguntaId]
    setOtraAbierta((prev) => ({ ...prev, [preguntaId]: abierta }))
    if (!abierta) {
      // If closing, clear custom text and revert selection if it was custom
      const textoActual = otraTexto[preguntaId]
      if (seleccion[preguntaId] === textoActual) {
        setSeleccion((prev) => {
          const next = { ...prev }
          delete next[preguntaId]
          return next
        })
      }
    }
  }

  function confirmarOtra(preguntaId: number) {
    const texto = (otraTexto[preguntaId] ?? '').trim()
    if (texto) {
      setSeleccion((prev) => ({ ...prev, [preguntaId]: texto }))
    }
  }

  // -------------------------------------------------------------------------
  // Admin: create question
  // -------------------------------------------------------------------------

  async function handleCrear(data: {
    pregunta: string
    opciones: string[]
    permitir_otra: boolean
  }) {
    setAdminSaving(true)
    const supabase = getSupabase()
    if (!supabase) {
      setToast({
        message: 'No se pudo conectar.',
        type: 'error',
        visible: true,
      })
      setAdminSaving(false)
      return
    }

    const { error } = await supabase.from('encuesta_preguntas').insert({
      pregunta: data.pregunta,
      opciones: data.opciones,
      permitir_otra: data.permitir_otra,
    })

    if (error) {
      setToast({ message: 'Error al crear.', type: 'error', visible: true })
    } else {
      setCreando(false)
      await cargarDatos()
      setToast({
        message: 'Encuesta creada!',
        type: 'success',
        visible: true,
      })
    }
    setAdminSaving(false)
  }

  // -------------------------------------------------------------------------
  // Admin: edit question
  // -------------------------------------------------------------------------

  async function handleEditar(data: {
    pregunta: string
    opciones: string[]
    permitir_otra: boolean
  }) {
    if (editandoId === null) return
    setAdminSaving(true)
    const supabase = getSupabase()
    if (!supabase) {
      setToast({
        message: 'No se pudo conectar.',
        type: 'error',
        visible: true,
      })
      setAdminSaving(false)
      return
    }

    const { error } = await supabase
      .from('encuesta_preguntas')
      .update({
        pregunta: data.pregunta,
        opciones: data.opciones,
        permitir_otra: data.permitir_otra,
      })
      .eq('id', editandoId)

    if (error) {
      setToast({
        message: 'Error al actualizar.',
        type: 'error',
        visible: true,
      })
    } else {
      setEditandoId(null)
      await cargarDatos()
      setToast({
        message: 'Encuesta actualizada!',
        type: 'success',
        visible: true,
      })
    }
    setAdminSaving(false)
  }

  // -------------------------------------------------------------------------
  // Admin: delete question
  // -------------------------------------------------------------------------

  async function handleEliminar(id: number) {
    setAdminSaving(true)
    const supabase = getSupabase()
    if (!supabase) {
      setAdminSaving(false)
      return
    }

    const { error } = await supabase
      .from('encuesta_preguntas')
      .delete()
      .eq('id', id)

    if (error) {
      setToast({
        message: 'Error al eliminar.',
        type: 'error',
        visible: true,
      })
    } else {
      setEliminandoId(null)
      await cargarDatos()
      setToast({
        message: 'Encuesta eliminada.',
        type: 'success',
        visible: true,
      })
    }
    setAdminSaving(false)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const resultados = calcularResultados(todasLasRespuestas)
  const todasSeleccionadas = preguntasActivas.every((p) => seleccion[p.id])

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
        {/* ============================================================= */}
        {/* Admin panel                                                    */}
        {/* ============================================================= */}
        {isAdmin && !isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-text-primary">
                Administrar encuestas
              </h2>
              {!creando && editandoId === null && (
                <button
                  type="button"
                  onClick={() => setCreando(true)}
                  className="flex items-center gap-1 rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nueva encuesta
                </button>
              )}
            </div>

            {/* Create form */}
            <AnimatePresence>
              {creando && (
                <FormularioPregunta
                  onSave={handleCrear}
                  onCancel={() => setCreando(false)}
                  saving={adminSaving}
                />
              )}
            </AnimatePresence>

            {/* Existing questions list for admin */}
            {preguntas.map((p) => (
              <div key={p.id}>
                {editandoId === p.id ? (
                  <FormularioPregunta
                    initial={p}
                    onSave={handleEditar}
                    onCancel={() => setEditandoId(null)}
                    saving={adminSaving}
                  />
                ) : (
                  <div className="flex items-start justify-between gap-3 rounded-xl border border-gold/10 bg-white px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-text-primary">
                        {p.pregunta}
                      </p>
                      <p className="mt-0.5 text-xs text-text-secondary">
                        {p.opciones.join(' · ')}
                        {p.permitir_otra && ' · Otra...'}
                        {!p.activa && (
                          <span className="ml-2 text-orange-500">
                            (inactiva)
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditandoId(p.id)
                          setCreando(false)
                        }}
                        className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-50 hover:text-gold"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      {eliminandoId === p.id ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleEliminar(p.id)}
                            disabled={adminSaving}
                            className="rounded-lg px-2 py-1 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                          <button
                            type="button"
                            onClick={() => setEliminandoId(null)}
                            className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-50"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEliminandoId(p.id)}
                          className="rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Divider */}
            <div className="border-t border-gold/10 pt-2" />
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* Loading skeleton                                               */}
        {/* ============================================================= */}
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

        {/* ============================================================= */}
        {/* Empty state                                                    */}
        {/* ============================================================= */}
        {!isLoading && preguntasActivas.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="rounded-full bg-stone-100 p-5">
              <BarChart2 className="h-10 w-10 text-stone-400" />
            </div>
            <p className="mt-4 text-base font-medium text-stone-600">
              No hay encuestas todavía
            </p>
            <p className="mt-1 text-sm text-stone-400">
              {isAdmin
                ? 'Creá la primera encuesta desde el panel de arriba'
                : 'Pronto habrá encuestas para responder'}
            </p>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* Results view                                                   */}
        {/* ============================================================= */}
        {!isLoading && mostrarResultados && preguntasActivas.length > 0 && (
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
            {preguntasActivas.map((p, i) => (
              <TarjetaResultado
                key={p.id}
                pregunta={p}
                resultados={resultados}
                miRespuesta={misRespuestas[p.id]}
                index={i}
              />
            ))}
          </>
        )}

        {/* ============================================================= */}
        {/* Form view (guest hasn't answered yet)                          */}
        {/* ============================================================= */}
        {!isLoading && !mostrarResultados && preguntasActivas.length > 0 && (
          <>
            {preguntasActivas.map((p, i) => {
              const esOtraAbierta = otraAbierta[p.id] ?? false
              const otraConfirmada =
                seleccion[p.id] &&
                !p.opciones.includes(seleccion[p.id])

              return (
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
                          onClick={() => seleccionarOpcion(p.id, opcion)}
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

                    {/* "Otra..." toggle */}
                    {p.permitir_otra && (
                      <button
                        type="button"
                        onClick={() => toggleOtra(p.id)}
                        className={`rounded-full border px-4 py-2 text-sm transition-all duration-200 ${
                          esOtraAbierta || otraConfirmada
                            ? 'border-gold bg-gold text-white shadow-sm'
                            : 'border-dashed border-gold/30 bg-white text-text-secondary hover:border-gold/50 hover:text-text-primary'
                        }`}
                      >
                        {otraConfirmada ? seleccion[p.id] : 'Otra...'}
                      </button>
                    )}
                  </div>

                  {/* Custom answer input */}
                  {p.permitir_otra && esOtraAbierta && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-3 flex items-center gap-2"
                    >
                      <input
                        type="text"
                        value={otraTexto[p.id] ?? ''}
                        onChange={(e) =>
                          setOtraTexto((prev) => ({
                            ...prev,
                            [p.id]: e.target.value,
                          }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') confirmarOtra(p.id)
                        }}
                        placeholder="Tu respuesta..."
                        className="flex-1 rounded-lg border border-gold/20 bg-white px-3 py-2 text-sm outline-none focus:border-gold/50"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => confirmarOtra(p.id)}
                        disabled={!(otraTexto[p.id] ?? '').trim()}
                        className="rounded-lg bg-gold px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
                      >
                        OK
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              )
            })}

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: preguntasActivas.length * 0.08 + 0.1 }}
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

'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  HelpCircle,
  Trophy,
  Play,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Trash2,
  X,
  Save,
  Medal,
  ChevronDown,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { getSupabase } from '@/lib/supabase'
import type { TriviaPregunta, TriviaResultado } from '@/types/database'
import Toast from '@/components/ui/Toast'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ADMIN_NAMES = ['Julian', 'Jacqueline']
const FEEDBACK_DELAY = 1500 // ms before advancing to next question

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getMensajePuntaje(puntaje: number, total: number): { emoji: string; mensaje: string } {
  const ratio = total === 0 ? 0 : puntaje / total
  if (ratio === 1) return { emoji: '🏆', mensaje: '¡Perfecto! Conocés a los novios mejor que nadie!' }
  if (ratio >= 0.8) return { emoji: '🎉', mensaje: '¡Excelente! Sabés un montón de los novios!' }
  if (ratio >= 0.6) return { emoji: '😄', mensaje: '¡Muy bien! Sabés bastante de los novios.' }
  if (ratio >= 0.4) return { emoji: '🤔', mensaje: 'No está mal, pero te falta conocerlos más.' }
  return { emoji: '😅', mensaje: '¡Ups! Parece que hay mucho por descubrir de los novios.' }
}

function getMedalColor(pos: number): string {
  if (pos === 0) return 'text-yellow-500'
  if (pos === 1) return 'text-stone-400'
  if (pos === 2) return 'text-amber-700'
  return 'text-transparent'
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
  initial?: TriviaPregunta
  onSave: (data: {
    pregunta: string
    opciones: string[]
    respuesta_correcta: string
  }) => void
  onCancel: () => void
  saving: boolean
}) {
  const [pregunta, setPregunta] = useState(initial?.pregunta ?? '')
  const [opciones, setOpciones] = useState<string[]>(
    initial?.opciones.length ? [...initial.opciones] : ['', ''],
  )
  const [correcta, setCorrecta] = useState(initial?.respuesta_correcta ?? '')

  function updateOpcion(index: number, value: string) {
    setOpciones((prev) => {
      const next = prev.map((o, i) => (i === index ? value : o))
      // If the old value was the correct answer, update it
      if (prev[index] === correcta) setCorrecta(value)
      return next
    })
  }

  function removeOpcion(index: number) {
    if (opciones.length <= 2) return
    const removed = opciones[index]
    setOpciones((prev) => prev.filter((_, i) => i !== index))
    if (removed === correcta) setCorrecta('')
  }

  function addOpcion() {
    setOpciones((prev) => [...prev, ''])
  }

  const opcionesValidas = opciones.filter((o) => o.trim())
  const canSave =
    pregunta.trim() &&
    opcionesValidas.length >= 2 &&
    correcta.trim() &&
    opcionesValidas.includes(correcta) &&
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
            Opciones (mínimo 2) — hacé click en el circulito para marcar la correcta
          </label>
          <div className="space-y-2">
            {opciones.map((opcion, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => opcion.trim() && setCorrecta(opcion)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                    correcta === opcion && opcion.trim()
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-stone-300 hover:border-green-400'
                  }`}
                  title="Marcar como correcta"
                >
                  {correcta === opcion && opcion.trim() && (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                </button>
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

        {correcta && (
          <p className="text-xs text-green-600">
            Respuesta correcta: <span className="font-medium">{correcta}</span>
          </p>
        )}

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() =>
              onSave({
                pregunta: pregunta.trim(),
                opciones: opciones.filter((o) => o.trim()),
                respuesta_correcta: correcta,
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
// Ranking table
// ---------------------------------------------------------------------------

function Ranking({ resultados, preguntas }: { resultados: TriviaResultado[], preguntas: TriviaPregunta[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const sorted = [...resultados].sort((a, b) => {
    if (b.puntaje !== a.puntaje) return b.puntaje - a.puntaje
    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  })

  function getWrongAnswers(resultado: TriviaResultado) {
    return Object.entries(resultado.respuestas)
      .filter(([qId, ans]) => {
        const p = preguntas.find((q) => q.id === Number(qId))
        return p && ans !== p.respuesta_correcta
      })
      .map(([qId, ans]) => {
        const p = preguntas.find((q) => q.id === Number(qId))!
        return { text: p.pregunta, answered: ans, correct: p.respuesta_correcta }
      })
  }

  if (sorted.length === 0) {
    return (
      <div className="flex flex-col items-center py-8 text-center">
        <div className="rounded-full bg-stone-100 p-4">
          <Trophy className="h-8 w-8 text-stone-400" />
        </div>
        <p className="mt-3 text-sm text-stone-500">
          Todavía nadie jugó. Sé el primero!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h3 className="flex items-center gap-2 font-serif text-lg font-semibold text-text-primary">
        <Trophy className="h-5 w-5 text-gold" />
        Ranking
      </h3>
      <div className="space-y-1.5">
        {sorted.map((r, i) => {
          const wrongAnswers = getWrongAnswers(r)
          const hasWrong = wrongAnswers.length > 0
          const isExpanded = expandedId === r.id

          return (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-xl ${
                i < 3
                  ? 'border border-gold/20 bg-white shadow-sm'
                  : 'bg-white/50'
              }`}
            >
              <button
                type="button"
                onClick={() => hasWrong && setExpandedId(isExpanded ? null : r.id)}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left ${hasWrong ? 'cursor-pointer' : 'cursor-default'}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center">
                  {i < 3 ? (
                    <Medal className={`h-6 w-6 ${getMedalColor(i)}`} />
                  ) : (
                    <span className="text-sm font-medium text-stone-400">
                      {i + 1}
                    </span>
                  )}
                </span>
                <span className="flex-1 truncate text-sm font-medium text-text-primary">
                  {r.nombre_invitado}
                </span>
                <span className="shrink-0 text-sm font-semibold text-gold">
                  {r.puntaje}/{r.total_preguntas}
                </span>
                {hasWrong && (
                  <ChevronDown
                    className={`h-4 w-4 shrink-0 text-stone-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2 border-t border-stone-100 px-4 py-3">
                      <p className="text-xs font-medium text-stone-400">
                        Preguntas incorrectas
                      </p>
                      {wrongAnswers.map((w, wi) => (
                        <div key={wi} className="rounded-lg bg-stone-50 px-3 py-2 text-xs">
                          <p className="font-medium text-text-primary">{w.text}</p>
                          <p className="mt-1 text-red-500">
                            Respondió: <span className="font-medium">{w.answered}</span>
                          </p>
                          <p className="text-green-600">
                            Correcta: <span className="font-medium">{w.correct}</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function TriviaPage() {
  const { guestName } = useAuth()
  const isAdmin = ADMIN_NAMES.some(
    (n) => guestName?.toLowerCase() === n.toLowerCase(),
  )

  // Data
  const [preguntas, setPreguntas] = useState<TriviaPregunta[]>([])
  const [resultados, setResultados] = useState<TriviaResultado[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Quiz state
  type QuizPhase = 'intro' | 'playing' | 'result'
  const [phase, setPhase] = useState<QuizPhase>('intro')
  const [preguntaActual, setPreguntaActual] = useState(0)
  const [respuestas, setRespuestas] = useState<Record<number, string>>({})
  const [puntaje, setPuntaje] = useState(0)
  const [feedback, setFeedback] = useState<{
    elegida: string
    correcta: string
  } | null>(null)
  const [yaJugo, setYaJugo] = useState(false)
  const [miResultado, setMiResultado] = useState<TriviaResultado | null>(null)

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

  // -------------------------------------------------------------------------
  // Load data
  // -------------------------------------------------------------------------

  const cargarDatos = useCallback(async () => {
    const supabase = getSupabase()
    if (!supabase) {
      setIsLoading(false)
      return
    }

    const [pregRes, resRes] = await Promise.all([
      supabase
        .from('trivia_preguntas')
        .select('*')
        .order('id', { ascending: true }),
      supabase
        .from('trivia_resultados')
        .select('*')
        .order('puntaje', { ascending: false }),
    ])

    const preg = (pregRes.data ?? []) as TriviaPregunta[]
    const res = (resRes.data ?? []) as TriviaResultado[]

    setPreguntas(preg)
    setResultados(res)

    // Check if guest already played
    const mio = res.find(
      (r) =>
        r.nombre_invitado.toLowerCase() === (guestName ?? '').toLowerCase(),
    )
    if (mio) {
      setMiResultado(mio)
      const activasCount = preg.filter((p) => p.activa).length
      // Only block replaying if they already answered all current active questions
      if (mio.total_preguntas >= activasCount) {
        setYaJugo(true)
      }
    }

    setIsLoading(false)
  }, [guestName])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos()
  }, [cargarDatos])

  // -------------------------------------------------------------------------
  // Quiz: answer a question
  // -------------------------------------------------------------------------

  function handleRespuesta(opcion: string) {
    if (feedback) return // prevent double-click during feedback

    const pregunta = preguntasActivas[preguntaActual]
    const esCorrecta = opcion === pregunta.respuesta_correcta

    setRespuestas((prev) => ({ ...prev, [pregunta.id]: opcion }))
    if (esCorrecta) setPuntaje((p) => p + 1)
    setFeedback({ elegida: opcion, correcta: pregunta.respuesta_correcta })

    setTimeout(() => {
      setFeedback(null)
      if (preguntaActual < preguntasActivas.length - 1) {
        setPreguntaActual((p) => p + 1)
      } else {
        // Quiz finished — save result
        guardarResultado(
          esCorrecta ? puntaje + 1 : puntaje,
          preguntasActivas.length,
          {
            ...respuestas,
            [pregunta.id]: opcion,
          },
        )
        setPhase('result')
      }
    }, FEEDBACK_DELAY)
  }

  async function guardarResultado(
    pts: number,
    total: number,
    resp: Record<number, string>,
  ) {
    const supabase = getSupabase()
    if (!supabase) return

    await supabase.from('trivia_resultados').upsert(
      {
        nombre_invitado: guestName ?? 'Anonimo',
        puntaje: pts,
        total_preguntas: total,
        respuestas: resp,
      },
      { onConflict: 'nombre_invitado' },
    )

    await cargarDatos()
  }

  // -------------------------------------------------------------------------
  // Admin CRUD
  // -------------------------------------------------------------------------

  async function handleCrear(data: {
    pregunta: string
    opciones: string[]
    respuesta_correcta: string
  }) {
    setAdminSaving(true)
    const supabase = getSupabase()
    if (!supabase) {
      setToast({ message: 'No se pudo conectar.', type: 'error', visible: true })
      setAdminSaving(false)
      return
    }
    const { error } = await supabase.from('trivia_preguntas').insert(data)
    if (error) {
      setToast({ message: 'Error al crear.', type: 'error', visible: true })
    } else {
      setCreando(false)
      await cargarDatos()
      setToast({ message: 'Pregunta creada!', type: 'success', visible: true })
    }
    setAdminSaving(false)
  }

  async function handleEditar(data: {
    pregunta: string
    opciones: string[]
    respuesta_correcta: string
  }) {
    if (editandoId === null) return
    setAdminSaving(true)
    const supabase = getSupabase()
    if (!supabase) {
      setToast({ message: 'No se pudo conectar.', type: 'error', visible: true })
      setAdminSaving(false)
      return
    }
    const { error } = await supabase
      .from('trivia_preguntas')
      .update(data)
      .eq('id', editandoId)
    if (error) {
      setToast({ message: 'Error al actualizar.', type: 'error', visible: true })
    } else {
      setEditandoId(null)
      await cargarDatos()
      setToast({ message: 'Pregunta actualizada!', type: 'success', visible: true })
    }
    setAdminSaving(false)
  }

  async function handleEliminar(id: number) {
    setAdminSaving(true)
    const supabase = getSupabase()
    if (!supabase) { setAdminSaving(false); return }
    const { error } = await supabase.from('trivia_preguntas').delete().eq('id', id)
    if (error) {
      setToast({ message: 'Error al eliminar.', type: 'error', visible: true })
    } else {
      setEliminandoId(null)
      await cargarDatos()
      setToast({ message: 'Pregunta eliminada.', type: 'success', visible: true })
    }
    setAdminSaving(false)
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  const puntajeFinal = yaJugo ? miResultado?.puntaje ?? 0 : puntaje
  const totalFinal = yaJugo
    ? miResultado?.total_preguntas ?? 0
    : preguntasActivas.length
  const mensajeFinal = getMensajePuntaje(puntajeFinal, totalFinal)

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
            <HelpCircle className="h-7 w-7 text-gold" />
          </div>
        </motion.div>
        <motion.h1
          className="font-serif text-3xl text-gold sm:text-4xl"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          Trivia
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-text-secondary"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          ¿Cuánto sabés de los novios?
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
                Administrar preguntas
              </h2>
              {!creando && editandoId === null && (
                <button
                  type="button"
                  onClick={() => setCreando(true)}
                  className="flex items-center gap-1 rounded-lg bg-gold/10 px-3 py-1.5 text-xs font-medium text-gold transition-colors hover:bg-gold/20"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Nueva pregunta
                </button>
              )}
            </div>

            <AnimatePresence>
              {creando && (
                <FormularioPregunta
                  onSave={handleCrear}
                  onCancel={() => setCreando(false)}
                  saving={adminSaving}
                />
              )}
            </AnimatePresence>

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
                      </p>
                      <p className="mt-0.5 text-xs text-green-600">
                        Correcta: {p.respuesta_correcta}
                        {!p.activa && (
                          <span className="ml-2 text-orange-500">(inactiva)</span>
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditandoId(p.id); setCreando(false) }}
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

            <div className="border-t border-gold/10 pt-2" />

            {/* Admin always sees ranking */}
            <Ranking resultados={resultados} preguntas={preguntas} />
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* Loading                                                        */}
        {/* ============================================================= */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-gold/10 bg-white p-5">
                <div className="mb-4 h-4 w-3/4 rounded bg-stone-200" />
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="h-10 rounded-xl bg-stone-100" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ============================================================= */}
        {/* Empty state (no active questions)                              */}
        {/* ============================================================= */}
        {!isLoading && !isAdmin && preguntasActivas.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center py-16 text-center"
          >
            <div className="rounded-full bg-stone-100 p-5">
              <HelpCircle className="h-10 w-10 text-stone-400" />
            </div>
            <p className="mt-4 text-base font-medium text-stone-600">
              Todavía no hay preguntas
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Pronto habrá un trivia para jugar!
            </p>
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* Guest: already played → show result + ranking                  */}
        {/* ============================================================= */}
        {!isLoading && !isAdmin && yaJugo && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-gold/15 bg-white p-6 text-center shadow-sm">
              <span className="text-5xl">{mensajeFinal.emoji}</span>
              <p className="mt-3 font-serif text-2xl font-semibold text-gold">
                {puntajeFinal} de {totalFinal}
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {mensajeFinal.mensaje}
              </p>
            </div>
            <Ranking resultados={resultados} preguntas={preguntas} />
          </motion.div>
        )}

        {/* ============================================================= */}
        {/* Guest: intro screen                                            */}
        {/* ============================================================= */}
        {!isLoading &&
          !isAdmin &&
          !yaJugo &&
          phase === 'intro' &&
          preguntasActivas.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center py-10 text-center"
            >
              <div className="rounded-full bg-gold/10 p-6">
                <HelpCircle className="h-14 w-14 text-gold" />
              </div>
              <p className="mt-6 font-serif text-xl font-semibold text-text-primary">
                ¿Cuánto sabés de Julian y Jacqueline?
              </p>
              <p className="mt-2 text-sm text-text-secondary">
                {preguntasActivas.length} preguntas · Elegí la respuesta correcta
              </p>
              {miResultado && (
                <div className="mt-4 rounded-xl border border-gold/20 bg-gold/5 px-4 py-3 text-sm text-text-secondary">
                  Tu resultado anterior:{' '}
                  <span className="font-semibold text-gold">
                    {miResultado.puntaje}/{miResultado.total_preguntas}
                  </span>
                  {' '}— hay preguntas nuevas, ¡podés volver a jugar!
                </div>
              )}
              <button
                type="button"
                onClick={() => setPhase('playing')}
                className="mt-8 flex items-center gap-2 rounded-xl bg-gold px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90"
              >
                <Play className="h-4 w-4" />
                {miResultado ? 'Jugar de nuevo' : 'Empezar'}
              </button>
            </motion.div>
          )}

        {/* ============================================================= */}
        {/* Guest: playing (one question at a time)                        */}
        {/* ============================================================= */}
        {!isLoading &&
          !isAdmin &&
          !yaJugo &&
          phase === 'playing' &&
          preguntasActivas.length > 0 && (
            <div>
              {/* Progress bar */}
              <div className="mb-2 flex items-center justify-between text-xs text-text-secondary">
                <span>
                  Pregunta {preguntaActual + 1} de {preguntasActivas.length}
                </span>
                <span className="font-medium text-gold">
                  {puntaje} correcta{puntaje !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-stone-100">
                <motion.div
                  className="h-full rounded-full bg-gold"
                  animate={{
                    width: `${((preguntaActual + 1) / preguntasActivas.length) * 100}%`,
                  }}
                  transition={{ duration: 0.3 }}
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={preguntasActivas[preguntaActual].id}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.3 }}
                  className="rounded-2xl border border-gold/15 bg-white p-5 shadow-sm"
                >
                  <p className="mb-5 font-serif text-lg font-semibold text-text-primary">
                    {preguntasActivas[preguntaActual].pregunta}
                  </p>
                  <div className="space-y-2.5">
                    {preguntasActivas[preguntaActual].opciones.map((opcion) => {
                      let colorClass =
                        'border-gold/20 bg-white text-text-primary hover:border-gold/50'

                      if (feedback) {
                        if (opcion === feedback.correcta) {
                          colorClass =
                            'border-green-400 bg-green-50 text-green-700'
                        } else if (
                          opcion === feedback.elegida &&
                          opcion !== feedback.correcta
                        ) {
                          colorClass =
                            'border-red-400 bg-red-50 text-red-700'
                        } else {
                          colorClass =
                            'border-stone-200 bg-stone-50 text-stone-400'
                        }
                      }

                      return (
                        <button
                          key={opcion}
                          type="button"
                          onClick={() => handleRespuesta(opcion)}
                          disabled={!!feedback}
                          className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-200 ${colorClass} disabled:cursor-default`}
                        >
                          {feedback && opcion === feedback.correcta && (
                            <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                          )}
                          {feedback &&
                            opcion === feedback.elegida &&
                            opcion !== feedback.correcta && (
                              <XCircle className="h-5 w-5 shrink-0 text-red-500" />
                            )}
                          {opcion}
                        </button>
                      )
                    })}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          )}

        {/* ============================================================= */}
        {/* Guest: result screen (just finished)                           */}
        {/* ============================================================= */}
        {!isLoading && !isAdmin && !yaJugo && phase === 'result' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6"
          >
            <div className="rounded-2xl border border-gold/15 bg-white p-6 text-center shadow-sm">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                className="inline-block text-5xl"
              >
                {mensajeFinal.emoji}
              </motion.span>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-3 font-serif text-2xl font-semibold text-gold"
              >
                {puntaje} de {preguntasActivas.length}
              </motion.p>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-2 text-sm text-text-secondary"
              >
                {mensajeFinal.mensaje}
              </motion.p>
            </div>
            <Ranking resultados={resultados} preguntas={preguntas} />
          </motion.div>
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

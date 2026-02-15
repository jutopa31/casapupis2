'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import {
  ArrowLeft,
  Plus,
  Check,
  Trash2,
  ClipboardList,
  Sparkles,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TodoItem {
  id: string
  text: string
  completed: boolean
  createdAt: string
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'casapupis_pendientes_novios'

const SUGGESTED_TASKS: string[] = [
  'Confirmar catering / menu',
  'Probar vestido / traje',
  'Definir lista de invitados',
  'Encargar torta',
  'Reservar DJ / banda',
  'Comprar alianzas',
  'Confirmar fotografo/a',
  'Organizar traslados',
  'Definir decoracion',
  'Preparar votos',
  'Imprimir invitaciones',
  'Confirmar ceremonia civil',
]

// ---------------------------------------------------------------------------
// LocalStorage helpers
// ---------------------------------------------------------------------------

function loadTodos(): TodoItem[] {
  if (typeof window === 'undefined') return []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function saveTodos(todos: TodoItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function PendientesNovios() {
  const [todos, setTodos] = useState<TodoItem[]>([])
  const [newTask, setNewTask] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setTodos(loadTodos())
    setMounted(true)
  }, [])

  const persist = useCallback((updated: TodoItem[]) => {
    setTodos(updated)
    saveTodos(updated)
  }, [])

  function addTask(text: string) {
    if (!text.trim()) return
    const item: TodoItem = {
      id: crypto.randomUUID(),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    }
    persist([item, ...todos])
    setNewTask('')
  }

  function toggleTask(id: string) {
    persist(
      todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    )
  }

  function deleteTask(id: string) {
    persist(todos.filter((t) => t.id !== id))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    addTask(newTask)
  }

  const pending = todos.filter((t) => !t.completed)
  const completed = todos.filter((t) => t.completed)
  const progress =
    todos.length > 0 ? Math.round((completed.length / todos.length) * 100) : 0

  // Suggestions not already added
  const availableSuggestions = SUGGESTED_TASKS.filter(
    (s) => !todos.some((t) => t.text.toLowerCase() === s.toLowerCase())
  )

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gradient-to-b from-offwhite to-champagne/30 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="mb-4 inline-flex items-center gap-1 text-sm text-text-secondary transition-colors hover:text-gold"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al inicio
          </Link>

          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10">
              <ClipboardList className="h-5 w-5 text-gold" />
            </div>
            <div>
              <h1 className="font-serif text-2xl text-gold sm:text-3xl">
                Pendientes
              </h1>
              <p className="text-xs text-text-secondary">
                Lista privada de los novios
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {todos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="mb-1 flex items-center justify-between text-xs text-text-secondary">
              <span>
                {completed.length} de {todos.length} completadas
              </span>
              <span className="font-medium text-gold">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gold/10">
              <motion.div
                className="h-full rounded-full bg-gold"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </motion.div>
        )}

        {/* Add Task Form */}
        <form onSubmit={handleSubmit} className="mb-6 flex gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1 rounded-lg border border-gold/20 bg-white px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/50 focus:border-gold/50"
          />
          <button
            type="submit"
            disabled={!newTask.trim()}
            className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-lg bg-gold text-white transition-colors hover:bg-gold/90 disabled:opacity-40"
          >
            <Plus className="h-5 w-5" />
          </button>
        </form>

        {/* Suggestions Toggle */}
        {availableSuggestions.length > 0 && (
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            className="mb-4 flex items-center gap-1.5 text-xs font-medium text-gold/70 transition-colors hover:text-gold"
          >
            <Sparkles className="h-3.5 w-3.5" />
            {showSuggestions ? 'Ocultar sugerencias' : 'Ver sugerencias'}
          </button>
        )}

        {/* Suggestions */}
        <AnimatePresence>
          {showSuggestions && availableSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => addTask(suggestion)}
                    className="rounded-full border border-gold/20 bg-white/80 px-3 py-1.5 text-xs text-text-secondary transition-all hover:border-gold/40 hover:bg-gold/5 hover:text-text-primary"
                  >
                    + {suggestion}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Empty State */}
        {todos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center"
          >
            <ClipboardList className="mx-auto mb-3 h-12 w-12 text-gold/30" />
            <p className="text-sm text-text-secondary">
              No hay pendientes todavia
            </p>
            <p className="mt-1 text-xs text-text-secondary/60">
              Agrega tareas o usa las sugerencias
            </p>
          </motion.div>
        )}

        {/* Pending Tasks */}
        {pending.length > 0 && (
          <div className="mb-6">
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-secondary">
              Pendientes ({pending.length})
            </h2>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {pending.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    className="group flex items-center gap-3 rounded-xl border border-gold/10 bg-white/80 px-4 py-3 backdrop-blur-sm"
                  >
                    <button
                      onClick={() => toggleTask(todo.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-gold/30 transition-colors hover:border-gold hover:bg-gold/10"
                    />
                    <span className="flex-1 text-sm text-text-primary">
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTask(todo.id)}
                      className="shrink-0 text-text-secondary/30 transition-colors hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Completed Tasks */}
        {completed.length > 0 && (
          <div>
            <h2 className="mb-3 text-xs font-medium uppercase tracking-widest text-text-secondary">
              Completadas ({completed.length})
            </h2>
            <div className="flex flex-col gap-2">
              <AnimatePresence mode="popLayout">
                {completed.map((todo) => (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.9 }}
                    className="group flex items-center gap-3 rounded-xl border border-green-200/50 bg-green-50/30 px-4 py-3"
                  >
                    <button
                      onClick={() => toggleTask(todo.id)}
                      className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-green-400 bg-green-400 text-white transition-colors hover:bg-green-300"
                    >
                      <Check className="h-3 w-3" />
                    </button>
                    <span className="flex-1 text-sm text-text-secondary line-through">
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTask(todo.id)}
                      className="shrink-0 text-text-secondary/30 transition-colors hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Footer note */}
        <p className="mt-10 text-center text-[10px] text-text-secondary/40">
          Los datos se guardan localmente en este dispositivo
        </p>
      </div>
    </main>
  )
}

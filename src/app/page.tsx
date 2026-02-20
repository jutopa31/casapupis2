'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  Camera,
  CheckCircle,
  MessageCircle,
  MapPin,
  Music,
  Grid3X3,
  ChevronDown,
  ArrowRight,
  Lock,
  BookHeart,
  HeartHandshake,
  HelpCircle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import InstallAppButton from '@/components/InstallAppButton'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

interface QuickAccessCard {
  label: string
  description: string
  href: string
  icon: React.ReactNode
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const WEDDING_DATE = new Date('2026-02-21T16:00:00-03:00')

const quickAccessCards: QuickAccessCard[] = [
  {
    label: 'Nosotros',
    description: 'Conoce como empezo todo',
    href: '/nuestra-historia',
    icon: <BookHeart className="h-6 w-6" />,
  },
  {
    label: 'Fotos de Invitados',
    description: 'Comparti tus mejores fotos de la fiesta',
    href: '/fotos-invitados',
    icon: <Camera className="h-6 w-6" />,
  },
  // {
  //   label: 'Confirmar Asistencia',
  //   description: 'Confirma tu presencia al evento',
  //   href: '/confirmar',
  //   icon: <CheckCircle className="h-6 w-6" />,
  // },
  {
    label: 'Muro de Mensajes',
    description: 'Dejanos un mensaje o deseo especial',
    href: '/muro',
    icon: <MessageCircle className="h-6 w-6" />,
  },
  {
    label: 'Como Llegar',
    description: 'Indicaciones para llegar al evento',
    href: '/como-llegar',
    icon: <MapPin className="h-6 w-6" />,
  },
  {
    label: 'Playlist',
    description: 'Sugeri canciones para la fiesta',
    href: '/playlist',
    icon: <Music className="h-6 w-6" />,
  },
  {
    label: 'Bingo Fotografico',
    description: 'Completa los desafios con fotos',
    href: '/bingo',
    icon: <Grid3X3 className="h-6 w-6" />,
  },
  {
    label: 'Agradecimiento',
    description: 'Un mensaje especial para vos',
    href: '/agradecimiento',
    icon: <HeartHandshake className="h-6 w-6" />,
  },
  {
    label: 'Trivia',
    description: '¿Cuánto sabés de los novios?',
    href: '/encuestas',
    icon: <HelpCircle className="h-6 w-6" />,
  },
]

// ---------------------------------------------------------------------------
// Animation Variants
// ---------------------------------------------------------------------------

const fadeSlideUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: 'easeOut' as const },
  }),
}

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.08, duration: 0.5, ease: 'easeOut' as const },
  }),
}

// ---------------------------------------------------------------------------
// Countdown Hook
// ---------------------------------------------------------------------------

function useCountdown(targetDate: Date): TimeLeft | null {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(null)

  useEffect(() => {
    function calculate(): TimeLeft {
      const now = new Date().getTime()
      const distance = targetDate.getTime() - now

      if (distance <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000),
      }
    }

    // Set initial value immediately on client
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeLeft(calculate())

    const interval = setInterval(() => {
      setTimeLeft(calculate())
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return timeLeft
}

// ---------------------------------------------------------------------------
// Countdown Display Component
// ---------------------------------------------------------------------------

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative flex h-16 w-16 items-center justify-center rounded-lg border border-gold/30 bg-white/60 backdrop-blur-sm sm:h-20 sm:w-20 md:h-24 md:w-24">
        <motion.span
          key={value}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="font-serif text-2xl font-semibold text-gold sm:text-3xl md:text-4xl"
        >
          {String(value).padStart(2, '0')}
        </motion.span>
      </div>
      <span className="text-[10px] font-medium uppercase tracking-widest text-text-secondary sm:text-xs">
        {label}
      </span>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Access Code Modal Component
// ---------------------------------------------------------------------------

function AccessCodeModal({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const { login } = useAuth()
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!password.trim()) {
      setError('Por favor ingresa el código de acceso')
      return
    }
    if (!name.trim()) {
      setError('Por favor ingresa tu nombre')
      return
    }

    setIsSubmitting(true)
    const result = await login(password.trim(), name.trim())
    setIsSubmitting(false)

    if (result.success) {
      setIsOpen(false)
      onSuccess()
    } else {
      setError(result.error ?? 'No se pudo ingresar')
    }
  }

  if (!isOpen) {
    return (
      <motion.button
        custom={6}
        variants={fadeSlideUp}
        initial="hidden"
        animate="visible"
        onClick={() => setIsOpen(true)}
        className="group mt-4 flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-8 py-3 text-sm font-medium tracking-wide text-gold transition-all duration-300 hover:border-gold hover:bg-gold hover:text-white"
      >
        <Lock className="h-4 w-4" />
        Ingresar
        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </motion.button>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mx-4 w-full max-w-sm rounded-2xl border border-gold/20 bg-offwhite p-8 shadow-xl"
      >
        <h3 className="mb-1 text-center font-serif text-2xl text-gold">
          Bienvenido/a
        </h3>
        <p className="mb-6 text-center text-sm text-text-secondary">
          Ingresa el código de acceso y tu nombre
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Código de acceso"
            value={password}
            onChange={(e) => { setPassword(e.target.value); setError('') }}
            className="rounded-lg border border-gold/20 bg-white px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/50 focus:border-gold/50"
          />
          <input
            type="text"
            placeholder="Tu nombre"
            value={name}
            onChange={(e) => { setName(e.target.value); setError('') }}
            className="rounded-lg border border-gold/20 bg-white px-4 py-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-secondary/50 focus:border-gold/50"
          />

          {error && (
            <p className="text-center text-xs text-red-500">{error}</p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !password.trim() || !name.trim()}
            className="rounded-lg bg-gold px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-gold/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Entrando...' : 'Ingresar'}
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="text-xs text-text-secondary transition-colors hover:text-text-primary"
          >
            Cancelar
          </button>
        </form>
      </motion.div>
    </motion.div>
  )
}

// ---------------------------------------------------------------------------
// Quick Access Grid Component
// ---------------------------------------------------------------------------

function QuickAccessGrid({ guestName }: { guestName: string }) {
  return (
    <section className="w-full bg-gradient-to-b from-champagne/30 to-offwhite px-4 py-16 sm:px-6 md:py-24">
      <div className="mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mb-2 text-center font-serif text-3xl text-gold md:text-4xl"
        >
          Hola, {guestName}!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mb-10 text-center text-sm text-text-secondary md:text-base"
        >
          Mira lo que armamos
        </motion.p>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
          {quickAccessCards.map((card, i) => (
            <motion.div
              key={card.href}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              <Link
                href={card.href}
                className="group flex flex-col items-center gap-3 rounded-xl border border-gold/15 bg-white/70 p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-gold/40 hover:bg-white hover:shadow-lg hover:shadow-gold/5 sm:p-6"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-white">
                  {card.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-text-primary sm:text-base">
                    {card.label}
                  </h3>
                  <p className="mt-1 hidden text-xs text-text-secondary sm:block">
                    {card.description}
                  </p>
                </div>
              </Link>
            </motion.div>
          ))}

          {/* Install App — inside the grid as last card */}
          <motion.div
            custom={quickAccessCards.length}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <InstallAppButton variant="card" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// ---------------------------------------------------------------------------
// Main Page Component
// ---------------------------------------------------------------------------

export default function Home() {
  const { isAuthenticated, guestName } = useAuth()
  const timeLeft = useCountdown(WEDDING_DATE)

  // Force re-render key when auth state changes
  const [authTick, setAuthTick] = useState(0)

  return (
    <main className="flex min-h-screen flex-col">
      {/* ================================================================= */}
      {/* Hero Section                                                      */}
      {/* ================================================================= */}
      <section className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-offwhite via-offwhite to-champagne/40 px-4 pb-20">
        <div className="flex flex-col items-center gap-6 text-center">
          {/* "Nos casamos" */}
          <motion.p
            custom={0}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="text-xs font-medium uppercase tracking-[0.3em] text-gold sm:text-sm"
          >
            Nos casamos
          </motion.p>

          {/* Names */}
          <motion.h1
            custom={1}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="font-serif text-4xl font-semibold text-gold md:text-6xl lg:text-7xl"
          >
            Julian & Jacqueline
          </motion.h1>

          {/* Decorative Divider */}
          <motion.div
            custom={2}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="flex items-center gap-4"
          >
            <span className="block h-px w-12 bg-gold/40 sm:w-16" />
            <span className="text-sm text-gold/70">&#10022;</span>
            <span className="block h-px w-12 bg-gold/40 sm:w-16" />
          </motion.div>

          {/* Date */}
          <motion.p
            custom={3}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="font-serif text-lg tracking-wide text-text-primary/80 sm:text-xl md:text-2xl"
          >
            21 de febrero de 2026
          </motion.p>

          {/* Event Details */}
          <motion.div
            custom={4}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="flex flex-col items-center gap-2"
          >
            <p className="font-serif text-base tracking-wide text-text-primary/70 sm:text-lg">
              16 hs
            </p>
            <p className="text-sm tracking-wide text-text-secondary">
              Calle 617, n° 5176 — El Pato, Berazategui
            </p>
            <p className="mt-1 text-xs font-medium uppercase tracking-[0.2em] text-gold/70">
              Dress code: elegante sport
            </p>
          </motion.div>

          {/* ============================================================= */}
          {/* Countdown Timer                                                */}
          {/* ============================================================= */}
          <motion.div
            custom={5}
            variants={fadeSlideUp}
            initial="hidden"
            animate="visible"
            className="mt-6"
          >
            {timeLeft ? (
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                <CountdownUnit value={timeLeft.days} label="Dias" />
                <span className="mb-5 font-serif text-xl text-gold/50">:</span>
                <CountdownUnit value={timeLeft.hours} label="Horas" />
                <span className="mb-5 font-serif text-xl text-gold/50">:</span>
                <CountdownUnit value={timeLeft.minutes} label="Min" />
                <span className="mb-5 font-serif text-xl text-gold/50">:</span>
                <CountdownUnit value={timeLeft.seconds} label="Seg" />
              </div>
            ) : (
              /* SSR placeholder: invisible but same dimensions to prevent layout shift */
              <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                {['Dias', 'Horas', 'Min', 'Seg'].map((label, idx) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-gold/30 bg-white/60 sm:h-20 sm:w-20 md:h-24 md:w-24">
                      <span className="font-serif text-2xl font-semibold text-gold/30 sm:text-3xl md:text-4xl">
                        --
                      </span>
                    </div>
                    <span className="text-[10px] font-medium uppercase tracking-widest text-text-secondary sm:text-xs">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* ============================================================= */}
          {/* Auth Section                                                   */}
          {/* ============================================================= */}
          {!isAuthenticated && (
            <AccessCodeModal onSuccess={() => setAuthTick((t) => t + 1)} />
          )}
        </div>

        {/* Scroll Indicator */}
        {isAuthenticated && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            className="absolute bottom-8 flex flex-col items-center gap-1"
          >
            <span className="text-[10px] uppercase tracking-widest text-text-secondary/60">
              Descubri mas
            </span>
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            >
              <ChevronDown className="h-5 w-5 text-gold/50" />
            </motion.div>
          </motion.div>
        )}
      </section>

      {/* ================================================================= */}
      {/* Quick Access Grid (only when authenticated)                       */}
      {/* ================================================================= */}
      {isAuthenticated && guestName && (
        <QuickAccessGrid guestName={guestName} />
      )}
    </main>
  )
}

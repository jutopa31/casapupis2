'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  X,
  Home,
  BookHeart,
  Camera,
  CheckCircle,
  MapPin,
  MessageSquare,
  Grid3X3,
  ListMusic,
  Clock,
  HeartHandshake,
  HelpCircle,
  Heart,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import InstallAppButton from '@/components/InstallAppButton';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  /** Optional guest name shown at the top when authenticated */
  guestName?: string | null;
}

interface DrawerLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

// ---------------------------------------------------------------------------
// Navigation links (full list matching wedding config)
// ---------------------------------------------------------------------------

const drawerLinks: DrawerLink[] = [
  { label: 'Inicio', href: '/', icon: Home },
  { label: 'Nuestra Historia', href: '/nuestra-historia', icon: BookHeart },
  { label: 'Fotos de Invitados', href: '/fotos-invitados', icon: Camera },
  { label: 'Fotos del Civil', href: '/fotos-civil', icon: Heart },
  // { label: 'Confirmar Asistencia', href: '/confirmar', icon: CheckCircle },
  { label: 'Como Llegar', href: '/como-llegar', icon: MapPin },
  { label: 'Muro de Mensajes', href: '/muro', icon: MessageSquare },
  { label: 'Bingo Fotografico', href: '/bingo', icon: Grid3X3 },
  { label: 'Playlist', href: '/playlist', icon: ListMusic },
  // { label: 'Programa', href: '/programa', icon: Clock },
  { label: 'Agradecimiento', href: '/agradecimiento', icon: HeartHandshake },
  { label: 'Trivia', href: '/encuestas', icon: HelpCircle },
];

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
} as const;

const drawerVariants = {
  hidden: { x: '100%' },
  visible: {
    x: 0,
    transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
  },
  exit: {
    x: '100%',
    transition: { type: 'spring' as const, damping: 30, stiffness: 300 },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function MobileDrawer({
  isOpen,
  onClose,
  guestName,
}: MobileDrawerProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="drawer-backdrop"
            className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm md:hidden"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Drawer panel */}
          <motion.aside
            key="drawer-panel"
            className="fixed inset-y-0 right-0 z-[70] w-[85vw] max-w-sm bg-white shadow-2xl md:hidden flex flex-col"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label="Menu de navegacion"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-stone-100">
              <div>
                <p className="font-serif text-xl text-[#C9A84C] tracking-wide">
                  J & J
                </p>
                {guestName && (
                  <p className="mt-1 text-sm text-stone-500">
                    Hola, {guestName}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 -mr-2 text-stone-400 hover:text-stone-700 transition-colors focus:outline-none"
                aria-label="Cerrar menu"
              >
                <X size={24} />
              </button>
            </div>

            {/* Links */}
            <nav className="flex-1 overflow-y-auto py-4 px-4">
              <ul className="space-y-1">
                {drawerLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;

                  return (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        onClick={onClose}
                        className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                          isActive
                            ? 'bg-[#C9A84C]/10 text-[#C9A84C]'
                            : 'text-stone-700 hover:bg-stone-50 hover:text-[#C9A84C]'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <Icon
                          size={20}
                          strokeWidth={isActive ? 2 : 1.6}
                        />
                        <span
                          className={`text-sm ${
                            isActive ? 'font-semibold' : 'font-medium'
                          }`}
                        >
                          {link.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Install App */}
            <div className="px-4 pb-2">
              <InstallAppButton />
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-stone-100 text-center">
              <p className="text-xs text-stone-400">21 de febrero de 2026</p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

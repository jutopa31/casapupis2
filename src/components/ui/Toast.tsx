'use client';

import { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = 'success' | 'error' | 'info';

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  /** Auto-dismiss duration in ms. Defaults to 3000. Set to 0 to disable. */
  duration?: number;
}

// ---------------------------------------------------------------------------
// Style helpers
// ---------------------------------------------------------------------------

const iconMap: Record<ToastType, React.ComponentType<{ size?: number }>> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colorMap: Record<ToastType, { bg: string; border: string; text: string; icon: string }> = {
  success: {
    bg: 'bg-white',
    border: 'border-[#C9A84C]',
    text: 'text-stone-800',
    icon: 'text-[#C9A84C]',
  },
  error: {
    bg: 'bg-white',
    border: 'border-red-400',
    text: 'text-stone-800',
    icon: 'text-red-500',
  },
  info: {
    bg: 'bg-white',
    border: 'border-stone-300',
    text: 'text-stone-800',
    icon: 'text-stone-500',
  },
};

// ---------------------------------------------------------------------------
// Animation variants
// ---------------------------------------------------------------------------

const toastVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, damping: 25, stiffness: 300 },
  },
  exit: {
    opacity: 0,
    y: 24,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function Toast({
  message,
  type = 'info',
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  // Auto-dismiss
  useEffect(() => {
    if (!isVisible || duration === 0) return;

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  const colors = colorMap[type];
  const Icon = iconMap[type];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          key="toast"
          role="alert"
          aria-live="polite"
          className={`fixed z-[80] left-1/2 -translate-x-1/2 bottom-24 md:bottom-8 flex items-center gap-3 px-5 py-3 rounded-xl border ${colors.bg} ${colors.border} ${colors.text} shadow-lg max-w-[90vw]`}
          variants={toastVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <span className={colors.icon}>
            <Icon size={20} />
          </span>
          <span className="flex-1 text-sm font-medium">
            {message}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="p-1 -mr-1 text-stone-400 hover:text-stone-600 transition-colors focus:outline-none"
            aria-label="Cerrar notificacion"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

'use client';

import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

/**
 * Renders an install button that directly triggers the native PWA install
 * prompt on supported browsers (Chrome/Edge on Android & desktop).
 *
 * On iOS (where native prompt isn't available), it shows a brief guide
 * for the Safari "Add to Home Screen" flow — there's no way around it
 * on Apple devices.
 *
 * The variant prop controls the visual style:
 * - "inline" (default): compact button for nav menus
 * - "card": standalone highlighted card for the home page grid
 */
export default function InstallAppButton({
  variant = 'inline',
}: {
  variant?: 'inline' | 'card';
}) {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Already running as standalone PWA — nothing to show
  if (isInstalled) return null;

  async function handleClick() {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      // iOS doesn't support beforeinstallprompt — show manual guide
      setShowIOSGuide(true);
    } else {
      // Fallback: try triggering prompt anyway (some browsers queue it)
      // If not available, show a subtle toast-like message
      setShowIOSGuide(true);
    }
  }

  if (variant === 'card') {
    return (
      <>
        <button
          type="button"
          onClick={handleClick}
          className="group flex flex-col items-center gap-3 rounded-xl border border-dashed border-gold/30 bg-gold/5 p-5 text-center backdrop-blur-sm transition-all duration-300 hover:border-gold/40 hover:bg-gold/10 hover:shadow-lg hover:shadow-gold/5 sm:p-6"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold/15 text-gold transition-colors duration-300 group-hover:bg-gold group-hover:text-white">
            <Download className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-text-primary sm:text-base">
              Instalar App
            </h3>
            <p className="mt-1 hidden text-xs text-text-secondary sm:block">
              Accede mas facil desde tu celular
            </p>
          </div>
        </button>
        <IOSGuideModal open={showIOSGuide} isIOS={isIOS} onClose={() => setShowIOSGuide(false)} />
      </>
    );
  }

  // inline variant (for nav menus)
  return (
    <>
      <button
        type="button"
        onClick={handleClick}
        className="flex items-center gap-2 w-full px-3 py-3 rounded-lg text-stone-700 hover:bg-[#C9A84C]/10 hover:text-[#C9A84C] transition-colors"
      >
        <Download size={20} strokeWidth={1.6} />
        <span className="text-sm font-medium">Instalar App</span>
      </button>
      <IOSGuideModal open={showIOSGuide} isIOS={isIOS} onClose={() => setShowIOSGuide(false)} />
    </>
  );
}

// ---------------------------------------------------------------------------
// iOS / fallback guide modal (only shows when native prompt isn't available)
// ---------------------------------------------------------------------------

function IOSGuideModal({
  open,
  isIOS,
  onClose,
}: {
  open: boolean;
  isIOS: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-md rounded-t-2xl bg-white px-6 pb-8 pt-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-serif text-lg text-[#C9A84C]">
                {isIOS ? 'Instalar en iPhone' : 'Instalar App'}
              </h3>
              <button
                type="button"
                onClick={onClose}
                className="p-1 text-stone-400 hover:text-stone-600"
                aria-label="Cerrar"
              >
                <X size={20} />
              </button>
            </div>

            {isIOS ? (
              <ol className="space-y-4 text-sm text-stone-600">
                <li className="flex items-start gap-3">
                  <StepNumber n={1} />
                  <span>
                    Abri esta pagina en <strong>Safari</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={2} />
                  <span>
                    Toca{' '}
                    <Share size={16} className="inline text-[#007AFF]" />{' '}
                    <strong>Compartir</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={3} />
                  <span>
                    Selecciona <strong>&quot;Agregar a Inicio&quot;</strong>
                  </span>
                </li>
              </ol>
            ) : (
              <ol className="space-y-4 text-sm text-stone-600">
                <li className="flex items-start gap-3">
                  <StepNumber n={1} />
                  <span>
                    Abri esta pagina en <strong>Chrome</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={2} />
                  <span>
                    Toca el menu <strong>(tres puntos)</strong> arriba a la derecha
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <StepNumber n={3} />
                  <span>
                    Selecciona <strong>&quot;Instalar app&quot;</strong> o{' '}
                    <strong>&quot;Agregar a pantalla de inicio&quot;</strong>
                  </span>
                </li>
              </ol>
            )}

            <p className="mt-5 text-center text-xs text-stone-400">
              La app aparecera en tu pantalla de inicio
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepNumber({ n }: { n: number }) {
  return (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
      {n}
    </span>
  );
}

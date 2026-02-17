'use client';

import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export default function InstallAppButton() {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Already installed — hide button
  if (isInstalled) return null;

  // Not installable and not iOS — browser doesn't support it
  if (!canInstall && !isIOS) return null;

  async function handleClick() {
    if (canInstall) {
      await promptInstall();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  }

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

      {/* iOS instructions modal */}
      <AnimatePresence>
        {showIOSGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowIOSGuide(false)}
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
                  Instalar en iPhone
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              <ol className="space-y-4 text-sm text-stone-600">
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                    1
                  </span>
                  <span>
                    Toca el boton{' '}
                    <Share size={16} className="inline text-[#007AFF]" />{' '}
                    <strong>Compartir</strong> en la barra de Safari
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                    2
                  </span>
                  <span>
                    Desplaza y selecciona{' '}
                    <strong>&quot;Agregar a Inicio&quot;</strong>
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                    3
                  </span>
                  <span>
                    Toca <strong>&quot;Agregar&quot;</strong> y listo!
                  </span>
                </li>
              </ol>

              <p className="mt-5 text-center text-xs text-stone-400">
                La app aparecera en tu pantalla de inicio
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

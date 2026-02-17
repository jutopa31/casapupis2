'use client';

import { useState } from 'react';
import { Download, Share, X, MoreVertical } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useInstallPrompt } from '@/hooks/useInstallPrompt';

export default function InstallAppButton() {
  const { canInstall, isInstalled, isIOS, promptInstall } = useInstallPrompt();
  const [showGuide, setShowGuide] = useState(false);

  // Already running as standalone PWA — hide button
  if (isInstalled) return null;

  async function handleClick() {
    if (canInstall) {
      // Android / Chrome — trigger native prompt
      await promptInstall();
    } else {
      // iOS or any other browser — show manual instructions
      setShowGuide(true);
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

      {/* Installation instructions modal */}
      <AnimatePresence>
        {showGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setShowGuide(false)}
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
                  onClick={() => setShowGuide(false)}
                  className="p-1 text-stone-400 hover:text-stone-600"
                  aria-label="Cerrar"
                >
                  <X size={20} />
                </button>
              </div>

              {isIOS ? (
                /* ---- iOS / Safari instructions ---- */
                <ol className="space-y-4 text-sm text-stone-600">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                      1
                    </span>
                    <span>
                      Abri esta pagina en <strong>Safari</strong> (si estas en
                      otro navegador)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                      2
                    </span>
                    <span>
                      Toca el boton{' '}
                      <Share size={16} className="inline text-[#007AFF]" />{' '}
                      <strong>Compartir</strong> en la barra inferior
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                      3
                    </span>
                    <span>
                      Selecciona{' '}
                      <strong>&quot;Agregar a Inicio&quot;</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                      4
                    </span>
                    <span>
                      Toca <strong>&quot;Agregar&quot;</strong> y listo!
                    </span>
                  </li>
                </ol>
              ) : (
                /* ---- Android / Chrome / other browser instructions ---- */
                <ol className="space-y-4 text-sm text-stone-600">
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                      1
                    </span>
                    <span>
                      Abri esta pagina en <strong>Chrome</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                      2
                    </span>
                    <span>
                      Toca el menu{' '}
                      <MoreVertical
                        size={16}
                        className="inline text-stone-500"
                      />{' '}
                      (tres puntos arriba a la derecha)
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#C9A84C]/10 text-xs font-semibold text-[#C9A84C]">
                      3
                    </span>
                    <span>
                      Selecciona{' '}
                      <strong>
                        &quot;Agregar a pantalla de inicio&quot;
                      </strong>{' '}
                      o <strong>&quot;Instalar app&quot;</strong>
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
    </>
  );
}

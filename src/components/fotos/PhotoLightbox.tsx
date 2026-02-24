'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Share2, Download } from 'lucide-react';
import type { FotoInvitado } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoLightboxProps {
  photos: FotoInvitado[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoLightbox({
  photos,
  currentIndex,
  isOpen,
  onClose,
  onNavigate,
}: PhotoLightboxProps) {
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const [canNativeShare, setCanNativeShare] = useState(false);

  const currentPhoto = photos[currentIndex];

  // -----------------------------------------------------------------------
  // Navigation helpers
  // -----------------------------------------------------------------------

  const goNext = useCallback(() => {
    if (currentIndex < photos.length - 1) {
      onNavigate(currentIndex + 1);
    }
  }, [currentIndex, photos.length, onNavigate]);

  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  }, [currentIndex, onNavigate]);

  // -----------------------------------------------------------------------
  // Keyboard navigation
  // -----------------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    }

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose, goNext, goPrev]);

  // Detect native share support
  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // -----------------------------------------------------------------------
  // Share / download handler
  // -----------------------------------------------------------------------

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPhoto) return;

    const photoUrl = currentPhoto.foto_url;
    const optionalText = currentPhoto.caption ? { text: currentPhoto.caption } : {};

    try {
      const res = await fetch(photoUrl);
      const blob = await res.blob();
      const file = new File([blob], 'foto-casapupis.jpg', {
        type: blob.type || 'image/jpeg',
      });

      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'CasaPupis', ...optionalText });
      } else {
        await navigator.share({ title: 'CasaPupis', ...optionalText, url: photoUrl });
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    }
  }, [currentPhoto]);

  const handleDownload = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentPhoto) return;
    try {
      const res = await fetch(currentPhoto.foto_url);
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = 'foto-casapupis.jpg';
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(currentPhoto.foto_url, '_blank');
    }
  }, [currentPhoto]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // -----------------------------------------------------------------------
  // Swipe handlers (mobile)
  // -----------------------------------------------------------------------

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].clientX;
    touchEndX.current = null;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const diff = touchStartX.current - touchEndX.current;
    const minSwipe = 50;

    if (diff > minSwipe) {
      goNext();
    } else if (diff < -minSwipe) {
      goPrev();
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <AnimatePresence>
      {isOpen && currentPhoto && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onClick={onClose}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none"
            aria-label="Cerrar"
          >
            <X size={24} />
          </button>

          {/* Previous arrow (desktop) */}
          {currentIndex > 0 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none md:block"
              aria-label="Foto anterior"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Next arrow (desktop) */}
          {currentIndex < photos.length - 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-4 top-1/2 z-10 hidden -translate-y-1/2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20 focus:outline-none md:block"
              aria-label="Foto siguiente"
            >
              <ChevronRight size={28} />
            </button>
          )}

          {/* Image + caption area */}
          <motion.div
            key={currentPhoto.id}
            className="flex max-h-[90vh] max-w-[92vw] flex-col items-center md:max-w-[80vw]"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.25 }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
          >
            <img
              src={currentPhoto.foto_url}
              alt={currentPhoto.caption || `Foto de ${currentPhoto.nombre_invitado}`}
              className="max-h-[75vh] w-auto rounded-lg object-contain shadow-2xl"
              draggable={false}
            />

            {/* Caption area */}
            <div className="mt-4 text-center">
              <p className="text-base font-semibold text-white">
                {currentPhoto.nombre_invitado}
              </p>
              {currentPhoto.caption && (
                <p className="mt-1 text-sm text-white/70">
                  {currentPhoto.caption}
                </p>
              )}
              <p className="mt-1 text-xs text-white/40">
                {currentIndex + 1} / {photos.length}
              </p>
              <div className="mt-3 flex items-center gap-3">
                {canNativeShare && (
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 focus:outline-none"
                    aria-label="Compartir foto"
                  >
                    <Share2 size={16} />
                    Compartir
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleDownload}
                  className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm text-white transition-colors hover:bg-white/20 focus:outline-none"
                  aria-label="Descargar foto"
                >
                  <Download size={16} />
                  Descargar
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

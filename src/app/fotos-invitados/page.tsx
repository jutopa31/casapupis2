'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ImageIcon, Camera, Share2, Download } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { popSharedFiles } from '@/lib/shareTargetIDB';
import type { FotoInvitado } from '@/types/database';
import UploadSection from '@/components/fotos/UploadSection';
import PhotoCard from '@/components/fotos/PhotoCard';
import PhotoLightbox from '@/components/fotos/PhotoLightbox';

const ADMIN_NAMES = ['Julian', 'Jacqueline'];

// ---------------------------------------------------------------------------
// Skeleton card for loading state
// ---------------------------------------------------------------------------

function SkeletonCard() {
  return (
    <div
      className="animate-pulse overflow-hidden rounded-xl bg-stone-200"
      style={{ aspectRatio: '3 / 4' }}
    >
      <div className="flex h-full w-full items-end p-3">
        <div className="w-full space-y-2">
          <div className="h-3 w-2/3 rounded bg-stone-300" />
          <div className="h-2 w-1/2 rounded bg-stone-300" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page component
// ---------------------------------------------------------------------------

const PAGE_SIZE = 20;

export default function FotosInvitadosPage() {
  const { guestName } = useAuth();
  const isAdmin = ADMIN_NAMES.some(
    (name) => guestName?.toLowerCase() === name.toLowerCase()
  );

  const [photos, setPhotos] = useState<FotoInvitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Share Target: archivos recibidos desde el menú Compartir de Android
  const [shareFiles, setShareFiles] = useState<File[]>([]);
  const [fromShare, setFromShare] = useState(false);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Multi-selection state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSharing, setIsSharing] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // -----------------------------------------------------------------------
  // Load photos (paginated)
  // -----------------------------------------------------------------------

  const loadPhotos = useCallback(async (offset = 0, append = false) => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }
    try {
      setError(null);
      const { data, error: dbError } = await supabase
        .from('fotos_invitados')
        .select('*')
        .order('created_at', { ascending: false })
        .range(offset, offset + PAGE_SIZE - 1);

      if (dbError) throw dbError;

      const fetched = data ?? [];
      setHasMore(fetched.length === PAGE_SIZE);

      if (append) {
        setPhotos((prev) => [...prev, ...fetched]);
      } else {
        setPhotos(fetched);
      }
    } catch (err) {
      console.error('Error cargando fotos:', err);
      setError('No se pudieron cargar las fotos. Intenta recargar la pagina.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    loadPhotos(photos.length, true);
  }, [loadPhotos, photos.length]);

  // -----------------------------------------------------------------------
  // Initial load + realtime subscription
  // -----------------------------------------------------------------------

  useEffect(() => {
    loadPhotos(0, false);

    const supabase = getSupabase();
    if (!supabase) return;

    // Subscribe to new inserts via Supabase Realtime
    const channel = supabase
      .channel('fotos_invitados_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'fotos_invitados',
        },
        (payload) => {
          const newPhoto = payload.new as FotoInvitado;
          setPhotos((prev) => {
            if (prev.some((p) => p.id === newPhoto.id)) return prev;
            return [newPhoto, ...prev];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadPhotos]);

  // -----------------------------------------------------------------------
  // Share Target: detectar llegada desde el menú Compartir
  // -----------------------------------------------------------------------

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('fromShare') !== '1') return;

    setFromShare(true);
    popSharedFiles().then((files) => {
      if (files.length) setShareFiles(files);
    });

    // Limpiar el param de la URL sin recargar la página
    const url = new URL(window.location.href);
    url.searchParams.delete('fromShare');
    window.history.replaceState(null, '', url.toString());
  }, []);

  // -----------------------------------------------------------------------
  // Delete handler
  // -----------------------------------------------------------------------

  const handleDeletePhoto = useCallback((fotoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== fotoId));
  }, []);

  // -----------------------------------------------------------------------
  // Selection helpers
  // -----------------------------------------------------------------------

  const toggleSelectionMode = useCallback(() => {
    setSelectionMode((prev) => !prev);
    setSelectedIds(new Set());
  }, []);

  const togglePhotoSelection = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleShareSelected = useCallback(async () => {
    const selected = photos.filter((p) => selectedIds.has(p.id));
    if (!selected.length) return;

    setIsSharing(true);
    try {
      if (navigator.share) {
        const files = await Promise.all(
          selected.map(async (photo) => {
            const res = await fetch(photo.foto_url);
            const blob = await res.blob();
            return new File([blob], 'foto-casapupis.jpg', {
              type: blob.type || 'image/jpeg',
            });
          })
        );

        if (navigator.canShare?.({ files })) {
          await navigator.share({ files, title: 'CasaPupis' });
        } else {
          await navigator.share({ title: 'CasaPupis', url: selected[0].foto_url });
        }
      } else {
        // Desktop: trigger individual downloads with a small delay between each
        for (const photo of selected) {
          const a = document.createElement('a');
          a.href = photo.foto_url;
          a.download = 'foto-casapupis.jpg';
          a.click();
          await new Promise((r) => setTimeout(r, 350));
        }
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Share failed:', err);
      }
    } finally {
      setIsSharing(false);
    }
  }, [photos, selectedIds]);

  // -----------------------------------------------------------------------
  // Lightbox handlers
  // -----------------------------------------------------------------------

  const openLightbox = (index: number) => {
    if (selectionMode) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const navigateLightbox = (index: number) => {
    setLightboxIndex(index);
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-[var(--color-offwhite)] pb-24 md:pb-8">
      {/* Header */}
      <header className="px-4 pt-8 pb-2 text-center sm:pt-12">
        <motion.h1
          className="font-serif text-3xl sm:text-4xl"
          style={{ color: '#C9A84C' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Fotos de Invitados
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-stone-500 sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Comparti tus mejores momentos de la fiesta
        </motion.p>
        <motion.button
          type="button"
          onClick={toggleSelectionMode}
          className="mt-3 text-sm font-medium underline-offset-2 hover:underline"
          style={{ color: '#C9A84C' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.4 }}
        >
          {selectionMode ? 'Cancelar selección' : 'Seleccionar fotos'}
        </motion.button>
      </header>

      {/* Banner de llegada desde Share Target */}
      {fromShare && (
        <div className="mx-auto mt-4 max-w-2xl px-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-sm text-amber-800">
            {shareFiles.length > 1
              ? `${shareFiles.length} fotos recibidas desde el menu Compartir — procesando...`
              : 'Foto recibida desde el menu Compartir — procesando...'}
          </div>
        </div>
      )}

      {/* Upload section */}
      <section className="mx-auto mt-6 max-w-2xl px-4">
        <UploadSection
          onUploadComplete={() => {
            setFromShare(false);
            loadPhotos();
          }}
          sharedFiles={shareFiles}
          noLimit={isAdmin}
        />
      </section>

      {/* Gallery */}
      <section className="mx-auto mt-10 max-w-6xl px-4">
        {/* Loading state */}
        {isLoading && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!isLoading && error && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="rounded-full bg-red-50 p-4">
              <ImageIcon size={32} className="text-red-400" />
            </div>
            <p className="mt-4 text-sm text-red-600">{error}</p>
            <button
              type="button"
              onClick={() => {
                setIsLoading(true);
                loadPhotos();
              }}
              className="mt-4 rounded-xl px-6 py-2 text-sm font-medium text-white transition-colors hover:brightness-110"
              style={{ backgroundColor: '#C9A84C' }}
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !error && photos.length === 0 && (
          <motion.div
            className="flex flex-col items-center justify-center py-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="rounded-full bg-stone-100 p-5">
              <Camera size={40} className="text-stone-400" />
            </div>
            <p className="mt-4 text-base font-medium text-stone-600">
              Todavia no hay fotos
            </p>
            <p className="mt-1 text-sm text-stone-400">
              Se el primero en compartir un recuerdo de la fiesta
            </p>
          </motion.div>
        )}

        {/* Photo grid */}
        {!isLoading && !error && photos.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((foto, index) => (
                <PhotoCard
                  key={foto.id}
                  foto={foto}
                  onClick={() =>
                    selectionMode
                      ? togglePhotoSelection(foto.id)
                      : openLightbox(index)
                  }
                  canDelete={
                    !selectionMode &&
                    foto.bingo_challenge_id === null &&
                    (isAdmin || foto.nombre_invitado === guestName)
                  }
                  onDelete={handleDeletePhoto}
                  selectionMode={selectionMode}
                  isSelected={selectedIds.has(foto.id)}
                />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="rounded-xl px-8 py-3 text-sm font-semibold transition-all hover:brightness-110 disabled:opacity-50"
                  style={{ backgroundColor: '#C9A84C', color: '#fff' }}
                >
                  {isLoadingMore ? (
                    <span className="flex items-center gap-2">
                      <div
                        className="h-4 w-4 animate-spin rounded-full border-2"
                        style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                      />
                      Cargando...
                    </span>
                  ) : (
                    'Ver mas fotos'
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* Floating selection action bar */}
      <AnimatePresence>
        {selectionMode && (
          <motion.div
            initial={{ y: 96 }}
            animate={{ y: 0 }}
            exit={{ y: 96 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-20 left-0 right-0 z-50 flex justify-center px-4 md:bottom-6"
          >
            <div className="flex items-center gap-3 rounded-2xl bg-stone-900/90 px-4 py-3 shadow-2xl backdrop-blur-sm">
              <span className="text-sm text-white/80">
                {selectedIds.size > 0
                  ? `${selectedIds.size} foto${selectedIds.size !== 1 ? 's' : ''}`
                  : 'Seleccioná fotos'}
              </span>

              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={handleShareSelected}
                  disabled={isSharing}
                  className="flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  {isSharing ? (
                    <div
                      className="h-4 w-4 animate-spin rounded-full border-2"
                      style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }}
                    />
                  ) : canNativeShare ? (
                    <Share2 size={14} />
                  ) : (
                    <Download size={14} />
                  )}
                  {canNativeShare ? 'Compartir' : 'Descargar'}
                </button>
              )}

              <button
                type="button"
                onClick={toggleSelectionMode}
                className="rounded-xl bg-white/10 px-3 py-1.5 text-sm text-white transition-colors hover:bg-white/20"
              >
                Cancelar
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <PhotoLightbox
        photos={photos}
        currentIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={closeLightbox}
        onNavigate={navigateLightbox}
      />
    </div>
  );
}

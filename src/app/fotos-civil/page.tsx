'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Camera, Heart } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { FotoInvitado } from '@/types/database';
import UploadSection from '@/components/fotos/UploadSection';
import PhotoCard from '@/components/fotos/PhotoCard';
import PhotoLightbox from '@/components/fotos/PhotoLightbox';

const ADMIN_NAMES = ['Julian', 'Jacqueline'];
const TABLE = 'fotos_civil';
const BUCKET = 'fotos-civil';

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

export default function FotosCivilPage() {
  const { guestName } = useAuth();
  const isAdmin = ADMIN_NAMES.some(
    (name) => guestName?.toLowerCase() === name.toLowerCase()
  );

  const [photos, setPhotos] = useState<FotoInvitado[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
        .from(TABLE)
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
      console.error('Error cargando fotos del civil:', err);
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

    const channel = supabase
      .channel('fotos_civil_realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: TABLE,
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
  // Delete handler
  // -----------------------------------------------------------------------

  const handleDeletePhoto = useCallback((fotoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== fotoId));
  }, []);

  // -----------------------------------------------------------------------
  // Lightbox handlers
  // -----------------------------------------------------------------------

  const openLightbox = (index: number) => {
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
        <motion.div
          className="flex items-center justify-center gap-2 mb-1"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Heart size={20} style={{ color: '#C9A84C' }} />
          <span className="text-xs font-medium uppercase tracking-widest text-stone-400">
            18 de febrero de 2026
          </span>
          <Heart size={20} style={{ color: '#C9A84C' }} />
        </motion.div>
        <motion.h1
          className="font-serif text-3xl sm:text-4xl"
          style={{ color: '#C9A84C' }}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
        >
          Fotos del Civil
        </motion.h1>
        <motion.p
          className="mt-2 text-sm text-stone-500 sm:text-base"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Compartí tus fotos de la ceremonia civil
        </motion.p>
      </header>

      {/* Upload section */}
      <section className="mx-auto mt-6 max-w-2xl px-4">
        <UploadSection
          onUploadComplete={loadPhotos}
          tableName={TABLE}
          bucketName={BUCKET}
          photoLimit={100}
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
              Todavía no hay fotos del civil
            </p>
            <p className="mt-1 text-sm text-stone-400">
              ¡Sé el primero en compartir un recuerdo de ese día!
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
                  onClick={() => openLightbox(index)}
                  canDelete={isAdmin || foto.nombre_invitado === guestName}
                  onDelete={handleDeletePhoto}
                  tableName={TABLE}
                  bucketName={BUCKET}
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

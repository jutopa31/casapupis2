'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { getSupabase } from '@/lib/supabase';
import type { FotoInvitado } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoCardProps {
  foto: FotoInvitado;
  onClick: () => void;
  canDelete?: boolean;
  onDelete?: (fotoId: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTimestamp(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-AR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

/** Extract the storage file path from a full Supabase public URL */
function extractStoragePath(url: string): string | null {
  const marker = '/object/public/fotos-invitados/';
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.substring(idx + marker.length);
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoCard({ foto, onClick, canDelete, onDelete }: PhotoCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(true);
  };

  const handleCancelDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  };

  const handleConfirmDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const supabase = getSupabase();
    if (!supabase) return;

    setIsDeleting(true);
    try {
      // Delete from storage
      const filePath = extractStoragePath(foto.foto_url);
      if (filePath) {
        await supabase.storage.from('fotos-invitados').remove([filePath]);
      }

      // Delete from database
      const { error } = await supabase
        .from('fotos_invitados')
        .delete()
        .eq('id', foto.id);

      if (error) throw error;

      onDelete?.(foto.id);
    } catch (err) {
      console.error('Error eliminando foto:', err);
    } finally {
      setIsDeleting(false);
      setShowConfirm(false);
    }
  };

  const handleCardKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <motion.div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleCardKeyDown}
      className="group relative w-full overflow-hidden rounded-xl bg-stone-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/50"
      style={{ aspectRatio: '3 / 4' }}
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      whileHover={{ scale: 1.03, boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
    >
      {/* Photo */}
      <img
        src={foto.foto_url}
        alt={foto.caption || `Foto de ${foto.nombre_invitado}`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />

      {/* Bingo badge */}
      {foto.bingo_challenge_id !== null && (
        <span className="absolute left-2 top-2 z-10 rounded-full bg-[#C9A84C]/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-white shadow-sm">
          Bingo
        </span>
      )}

      {/* Delete button */}
      {canDelete && !showConfirm && (
        <button
          type="button"
          onClick={handleDeleteClick}
          className="absolute top-2 right-2 z-10 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100 hover:bg-red-600"
          aria-label="Eliminar foto"
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Delete confirmation overlay */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/70 px-3"
            onClick={(e) => e.stopPropagation()}
          >
            {isDeleting ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <p className="text-center text-xs font-medium text-white">
                  Eliminar esta foto?
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    type="button"
                    onClick={handleCancelDelete}
                    className="rounded-lg bg-white/20 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/30"
                  >
                    No
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDelete}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700"
                  >
                    Si, eliminar
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent px-3 pb-3 pt-10">
        <p className="text-left text-sm font-semibold text-white drop-shadow-sm">
          {foto.nombre_invitado}
        </p>
        {foto.caption && (
          <p className="mt-0.5 text-left text-xs text-white/80 line-clamp-2">
            {foto.caption}
          </p>
        )}
        <p className="mt-1 text-left text-[10px] text-white/60">
          {formatTimestamp(foto.created_at)}
        </p>
      </div>
    </motion.div>
  );
}

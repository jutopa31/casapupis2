'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { FotoInvitado } from '@/types/database';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PhotoCardProps {
  foto: FotoInvitado;
  onClick: () => void;
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function PhotoCard({ foto, onClick }: PhotoCardProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
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
    </motion.button>
  );
}

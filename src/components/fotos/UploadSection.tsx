'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, CheckCircle, AlertCircle, ImagePlus } from 'lucide-react';
import imageCompression from 'browser-image-compression';
import { getSupabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UploadSectionProps {
  onUploadComplete: () => void;
}

interface SelectedFile {
  file: File;
  previewUrl: string;
}

interface UploadProgress {
  fileName: string;
  progress: number; // 0-100
  status: 'compressing' | 'uploading' | 'done' | 'error';
  errorMsg?: string;
}

interface Toast {
  type: 'success' | 'error';
  message: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PHOTO_LIMIT_PER_GUEST = 50;

export default function UploadSection({ onUploadComplete }: UploadSectionProps) {
  const { guestName } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);

  // -----------------------------------------------------------------------
  // Load uploaded count for this guest
  // -----------------------------------------------------------------------

  const loadUploadedCount = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !guestName) return;
    const { count } = await supabase
      .from('fotos_invitados')
      .select('*', { count: 'exact', head: true })
      .eq('nombre_invitado', guestName)
      .is('bingo_challenge_id', null);
    setUploadedCount(count ?? 0);
  }, [guestName]);

  useEffect(() => {
    loadUploadedCount();
  }, [loadUploadedCount]);

  const remaining = uploadedCount !== null ? PHOTO_LIMIT_PER_GUEST - uploadedCount : PHOTO_LIMIT_PER_GUEST;

  // -----------------------------------------------------------------------
  // Toast helper
  // -----------------------------------------------------------------------

  const showToast = useCallback((type: Toast['type'], message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  }, []);

  // -----------------------------------------------------------------------
  // File selection
  // -----------------------------------------------------------------------

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    // Enforce photo limit per guest
    const availableSlots = remaining - selectedFiles.length;
    if (availableSlots <= 0) {
      showToast('error', `Ya alcanzaste el limite de ${PHOTO_LIMIT_PER_GUEST} fotos`);
      e.target.value = '';
      return;
    }

    const filesToAdd = Array.from(files).slice(0, availableSlots);
    if (filesToAdd.length < files.length) {
      showToast('error', `Solo podes agregar ${availableSlots} foto${availableSlots > 1 ? 's' : ''} mas (limite: ${PHOTO_LIMIT_PER_GUEST})`);
    }

    const newSelected: SelectedFile[] = filesToAdd.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));

    setSelectedFiles((prev) => [...prev, ...newSelected]);

    // Reset inputs so the same file can be selected again if needed
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].previewUrl);
      updated.splice(index, 1);
      return updated;
    });
  };

  const clearSelection = () => {
    selectedFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setSelectedFiles([]);
    setCaption('');
    setUploadProgress([]);
  };

  // -----------------------------------------------------------------------
  // Upload flow
  // -----------------------------------------------------------------------

  const handleUpload = async () => {
    const supabase = getSupabase();
    if (selectedFiles.length === 0 || !guestName || !supabase) return;

    setIsUploading(true);
    const progressList: UploadProgress[] = selectedFiles.map((f) => ({
      fileName: f.file.name,
      progress: 0,
      status: 'compressing' as const,
    }));
    setUploadProgress([...progressList]);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < selectedFiles.length; i++) {
      const { file } = selectedFiles[i];

      try {
        // --- Step 1: Compress ---
        progressList[i] = { ...progressList[i], status: 'compressing', progress: 10 };
        setUploadProgress([...progressList]);

        const compressed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          initialQuality: 0.85,
        });

        progressList[i] = { ...progressList[i], progress: 40, status: 'uploading' };
        setUploadProgress([...progressList]);

        // --- Step 2: Upload to storage ---
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filePath = `${timestamp}_${random}.jpg`;

        const { error: storageError } = await supabase.storage
          .from('fotos-invitados')
          .upload(filePath, compressed, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (storageError) throw storageError;

        progressList[i] = { ...progressList[i], progress: 70 };
        setUploadProgress([...progressList]);

        // --- Step 3: Get public URL ---
        const { data: publicUrlData } = supabase.storage
          .from('fotos-invitados')
          .getPublicUrl(filePath);

        const publicUrl = publicUrlData.publicUrl;

        // --- Step 4: Insert DB row ---
        const { error: dbError } = await supabase.from('fotos_invitados').insert({
          nombre_invitado: guestName,
          foto_url: publicUrl,
          caption: caption.trim() || null,
        });

        if (dbError) throw dbError;

        progressList[i] = { ...progressList[i], progress: 100, status: 'done' };
        setUploadProgress([...progressList]);
        successCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        progressList[i] = { ...progressList[i], status: 'error', errorMsg };
        setUploadProgress([...progressList]);
        errorCount++;
        console.error(`Error subiendo ${file.name}:`, err);
      }
    }

    setIsUploading(false);

    // Refresh count after upload
    if (successCount > 0) {
      setUploadedCount((prev) => (prev ?? 0) + successCount);
    }

    if (errorCount === 0) {
      showToast('success', `${successCount} foto${successCount > 1 ? 's' : ''} subida${successCount > 1 ? 's' : ''} correctamente`);
      clearSelection();
      onUploadComplete();
    } else if (successCount > 0) {
      showToast('error', `${successCount} subida${successCount > 1 ? 's' : ''}, ${errorCount} con error`);
      onUploadComplete();
    } else {
      showToast('error', 'No se pudieron subir las fotos. Intenta de nuevo.');
    }
  };

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="relative">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed left-1/2 top-4 z-[110] flex -translate-x-1/2 items-center gap-2 rounded-xl px-5 py-3 shadow-lg ${
              toast.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 ring-1 ring-emerald-200'
                : 'bg-red-50 text-red-800 ring-1 ring-red-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo limit indicator */}
      {uploadedCount !== null && (
        <div className="mb-3 text-center">
          <span className={`text-xs font-medium ${remaining <= 5 ? 'text-amber-600' : 'text-stone-400'}`}>
            {remaining > 0
              ? `${remaining} foto${remaining !== 1 ? 's' : ''} disponible${remaining !== 1 ? 's' : ''} de ${PHOTO_LIMIT_PER_GUEST}`
              : `Alcanzaste el limite de ${PHOTO_LIMIT_PER_GUEST} fotos`}
          </span>
        </div>
      )}

      {/* Upload trigger buttons */}
      <div className="flex justify-center gap-3">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          disabled={isUploading || remaining <= 0}
          className="group flex items-center gap-2 rounded-2xl px-6 py-4 text-white shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: '#C9A84C' }}
        >
          <Camera size={20} strokeWidth={2} />
          <span className="text-base font-semibold">Tomar Foto</span>
        </button>
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={isUploading || remaining <= 0}
          className="group flex items-center gap-2 rounded-2xl border-2 px-6 py-4 shadow-lg transition-all duration-200 hover:shadow-xl hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ borderColor: '#C9A84C', color: '#C9A84C' }}
        >
          <ImagePlus size={20} strokeWidth={2} />
          <span className="text-base font-semibold">Galeria</span>
        </button>
      </div>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileSelect}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleFileSelect}
      />

      {/* Preview + upload area */}
      <AnimatePresence>
        {selectedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-6 overflow-hidden"
          >
            <div className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm">
              {/* Preview grid */}
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                {selectedFiles.map((sf, idx) => (
                  <div key={idx} className="group relative aspect-square overflow-hidden rounded-lg bg-stone-100">
                    <img
                      src={sf.previewUrl}
                      alt={`Preview ${idx + 1}`}
                      className="h-full w-full object-cover"
                    />
                    {/* Remove button */}
                    {!isUploading && (
                      <button
                        type="button"
                        onClick={() => removeFile(idx)}
                        className="absolute right-1 top-1 rounded-full bg-black/50 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                        aria-label="Eliminar"
                      >
                        <X size={14} />
                      </button>
                    )}
                    {/* Upload progress overlay */}
                    {uploadProgress[idx] && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        {uploadProgress[idx].status === 'done' ? (
                          <CheckCircle size={24} className="text-emerald-400" />
                        ) : uploadProgress[idx].status === 'error' ? (
                          <AlertCircle size={24} className="text-red-400" />
                        ) : (
                          <div className="w-3/4">
                            <div className="h-1.5 overflow-hidden rounded-full bg-white/30">
                              <motion.div
                                className="h-full rounded-full"
                                style={{ backgroundColor: '#C9A84C' }}
                                initial={{ width: '0%' }}
                                animate={{ width: `${uploadProgress[idx].progress}%` }}
                                transition={{ duration: 0.3 }}
                              />
                            </div>
                            <p className="mt-1 text-center text-[10px] text-white">
                              {uploadProgress[idx].status === 'compressing'
                                ? 'Comprimiendo...'
                                : 'Subiendo...'}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Caption input */}
              <div className="mt-4">
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="Agrega una descripcion (opcional)"
                  disabled={isUploading}
                  maxLength={200}
                  className="w-full rounded-xl border border-stone-200 px-4 py-3 text-sm placeholder:text-stone-400 focus:border-[#C9A84C] focus:outline-none focus:ring-2 focus:ring-[#C9A84C]/20 disabled:opacity-50"
                />
              </div>

              {/* Actions */}
              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={clearSelection}
                  disabled={isUploading}
                  className="rounded-xl px-5 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#C9A84C' }}
                >
                  {isUploading ? (
                    <>
                      <div
                        className="h-4 w-4 animate-spin rounded-full border-2"
                        style={{
                          borderColor: 'rgba(255,255,255,0.3)',
                          borderTopColor: '#fff',
                        }}
                      />
                      Subiendo...
                    </>
                  ) : (
                    <>
                      <Upload size={16} />
                      Subir {selectedFiles.length} foto{selectedFiles.length > 1 ? 's' : ''}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

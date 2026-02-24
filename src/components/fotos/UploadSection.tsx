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
  tableName?: string;
  bucketName?: string;
  photoLimit?: number;
  /** Archivos recibidos desde el Share Target de Android. Si se proveen, se suben automáticamente. */
  sharedFiles?: File[];
  /** Cuando es true, no se aplica el límite de fotos por invitado (para admins). */
  noLimit?: boolean;
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
// Concurrency-limited Promise.allSettled
// Processes up to `concurrency` tasks simultaneously; as each finishes the
// next one starts immediately, preserving original result order.
// ---------------------------------------------------------------------------

async function runWithConcurrency<T>(
  tasks: Array<() => Promise<T>>,
  concurrency: number
): Promise<PromiseSettledResult<T>[]> {
  const results: PromiseSettledResult<T>[] = new Array(tasks.length);
  let nextIdx = 0;

  const worker = async () => {
    while (nextIdx < tasks.length) {
      const i = nextIdx++;
      try {
        results[i] = { status: 'fulfilled', value: await tasks[i]() };
      } catch (reason) {
        results[i] = { status: 'rejected', reason };
      }
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(concurrency, tasks.length) }, worker)
  );
  return results;
}

// Máximo de uploads simultáneos — evita saturar la red y el motor de compresión
const UPLOAD_CONCURRENCY = 5;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PHOTO_LIMIT_PER_GUEST = 50;

export default function UploadSection({
  onUploadComplete,
  tableName = 'fotos_invitados',
  bucketName = 'fotos-invitados',
  photoLimit = PHOTO_LIMIT_PER_GUEST,
  sharedFiles,
  noLimit = false,
}: UploadSectionProps) {
  const { guestName } = useAuth();
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);

  // Ref sincronizado inline para que handleUpload siempre lea el estado actual,
  // sin importar desde qué render o efecto se lo llame.
  const selectedFilesRef = useRef<SelectedFile[]>([]);
  selectedFilesRef.current = selectedFiles;

  // Ref usado para disparar auto-upload cuando llega un sharedFile
  const autoUploadRef = useRef(false);

  // -----------------------------------------------------------------------
  // Load uploaded count for this guest
  // -----------------------------------------------------------------------

  const loadUploadedCount = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !guestName) return;
    const { count } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true })
      .eq('nombre_invitado', guestName)
      .is('bingo_challenge_id', null);
    setUploadedCount(count ?? 0);
  }, [guestName]);

  useEffect(() => {
    if (noLimit) return; // admins no necesitan contar
    loadUploadedCount();
  }, [loadUploadedCount, noLimit]);

  // -----------------------------------------------------------------------
  // Share Target: auto-populate + auto-upload when sharedFile is provided
  // -----------------------------------------------------------------------

  // Effect 1: cuando llegan los archivos compartidos y hay nombre de invitado, los agrega todos
  useEffect(() => {
    if (!sharedFiles?.length || autoUploadRef.current || !guestName) return;
    autoUploadRef.current = true;
    const newSelected: SelectedFile[] = sharedFiles.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setSelectedFiles(newSelected);
  }, [sharedFiles, guestName]);

  // Effect 2: cuando selectedFiles se actualiza con el archivo compartido, dispara el upload
  useEffect(() => {
    if (!autoUploadRef.current || selectedFiles.length === 0 || isUploading) return;
    autoUploadRef.current = false;
    void handleUpload(); // eslint-disable-line react-hooks/exhaustive-deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedFiles.length]);

  // Para admins (noLimit) el remaining es ilimitado; Infinity hace que los checks
  // `availableSlots <= 0` y `slice(0, Infinity)` funcionen correctamente sin cambios.
  const remaining = noLimit ? Infinity : (uploadedCount !== null ? photoLimit - uploadedCount : photoLimit);

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
      showToast('error', `Ya alcanzaste el limite de ${photoLimit} fotos`);
      e.target.value = '';
      return;
    }

    const filesToAdd = Array.from(files).slice(0, availableSlots);
    if (filesToAdd.length < files.length) {
      showToast('error', `Solo podes agregar ${availableSlots} foto${availableSlots > 1 ? 's' : ''} mas (limite: ${photoLimit})`);
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
    // Leer desde el ref para garantizar el valor más reciente,
    // independientemente del render en que se creó esta función.
    const filesToUpload = selectedFilesRef.current;
    if (filesToUpload.length === 0 || !guestName || !supabase) return;

    setIsUploading(true);

    const progressList: UploadProgress[] = filesToUpload.map((f) => ({
      fileName: f.file.name,
      progress: 0,
      status: 'compressing' as const,
    }));
    setUploadProgress([...progressList]);

    // Subir archivos con concurrencia limitada (máx. UPLOAD_CONCURRENCY a la vez)
    // para evitar saturar la red, los web workers de compresión y los límites de Supabase.
    const results = await runWithConcurrency(
      filesToUpload.map(({ file }, i) => async () => {
        // --- Step 1: Compress ---
        progressList[i] = { ...progressList[i], status: 'compressing', progress: 10 };
        setUploadProgress([...progressList]);

        const compressed = await imageCompression(file, {
          maxSizeMB: 2,
          maxWidthOrHeight: 2048,
          useWebWorker: true,
          initialQuality: 0.85,
        });

        progressList[i] = { ...progressList[i], status: 'uploading', progress: 40 };
        setUploadProgress([...progressList]);

        // --- Step 2: Upload to storage ---
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 8);
        const filePath = `${timestamp}_${random}_${i}.jpg`;

        const { error: storageError } = await supabase.storage
          .from(bucketName)
          .upload(filePath, compressed, {
            contentType: 'image/jpeg',
            upsert: false,
          });

        if (storageError) throw storageError;

        progressList[i] = { ...progressList[i], progress: 70 };
        setUploadProgress([...progressList]);

        // --- Step 3: Get public URL ---
        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        // --- Step 4: Insert DB row ---
        const { error: dbError } = await supabase.from(tableName).insert({
          nombre_invitado: guestName,
          foto_url: publicUrlData.publicUrl,
          caption: caption.trim() || null,
        });

        if (dbError) throw dbError;

        progressList[i] = { ...progressList[i], progress: 100, status: 'done' };
        setUploadProgress([...progressList]);
      }),
      UPLOAD_CONCURRENCY
    );

    // Marcar los errores individuales en el progreso
    results.forEach((result, i) => {
      if (result.status === 'rejected') {
        const err = result.reason;
        const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
        progressList[i] = { ...progressList[i], status: 'error', errorMsg };
        console.error(`Error subiendo ${filesToUpload[i].file.name}:`, err);
      }
    });
    if (results.some((r) => r.status === 'rejected')) {
      setUploadProgress([...progressList]);
    }

    setIsUploading(false);

    const successCount = results.filter((r) => r.status === 'fulfilled').length;
    const errorCount = results.filter((r) => r.status === 'rejected').length;

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

      {/* Photo limit indicator (oculto para admins) */}
      {!noLimit && uploadedCount !== null && (
        <div className="mb-3 text-center">
          <span className={`text-xs font-medium ${remaining <= 5 ? 'text-amber-600' : 'text-stone-400'}`}>
            {remaining > 0
              ? `${remaining} foto${remaining !== 1 ? 's' : ''} disponible${remaining !== 1 ? 's' : ''} de ${photoLimit}`
              : `Alcanzaste el limite de ${photoLimit} fotos`}
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
              {/* Preview grid — scrollable cuando hay muchas fotos */}
              <div className={`grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5${selectedFiles.length > 12 ? ' max-h-80 overflow-y-auto rounded-lg pr-1' : ''}`}>
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

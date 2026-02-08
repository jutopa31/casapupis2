'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function AccessCodeModal() {
  const { isAuthenticated, login } = useAuth();

  const [step, setStep] = useState<1 | 2>(1);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Store the validated code so we can pass it to login() in step 2
  const [validatedCode, setValidatedCode] = useState('');

  if (isAuthenticated) return null;

  const handleCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    const correctCode = process.env.NEXT_PUBLIC_ACCESS_CODE;

    // Si no hay código configurado, cualquier código es válido (modo preview)
    if (!correctCode || code.trim().toLowerCase() === correctCode.toLowerCase()) {
      setValidatedCode(code.trim());
      setStep(2);
    } else {
      setError('Codigo incorrecto. Intenta de nuevo.');
    }

    setIsSubmitting(false);
  };

  const handleNameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre.');
      return;
    }

    const success = login(name.trim(), validatedCode);
    if (!success) {
      setError('Hubo un error al ingresar. Intenta de nuevo.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div
            key="step-code"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md mx-4"
          >
            <form
              onSubmit={handleCodeSubmit}
              className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-center"
            >
              <h1
                className="text-3xl sm:text-4xl font-serif mb-2"
                style={{ color: '#C9A84C' }}
              >
                Bienvenido
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Ingresa el codigo de acceso para continuar
              </p>

              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError('');
                }}
                placeholder="Codigo de acceso"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-lg
                  focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent
                  transition-shadow placeholder:text-gray-400"
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-3"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={isSubmitting || !code.trim()}
                className="mt-6 w-full py-3 rounded-xl text-white font-medium text-lg
                  transition-all duration-200 hover:brightness-110 hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#C9A84C' }}
              >
                Ingresar
              </button>
            </form>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div
            key="step-name"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="w-full max-w-md mx-4"
          >
            <form
              onSubmit={handleNameSubmit}
              className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-center"
            >
              <h1
                className="text-3xl sm:text-4xl font-serif mb-2"
                style={{ color: '#C9A84C' }}
              >
                {'\u00BF'}Como te llamas?
              </h1>
              <p className="text-gray-500 text-sm mb-8">
                Asi sabemos quien confirma la asistencia
              </p>

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError('');
                }}
                placeholder="Tu nombre completo"
                autoFocus
                className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-lg
                  focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent
                  transition-shadow placeholder:text-gray-400"
              />

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-500 text-sm mt-3"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={!name.trim()}
                className="mt-6 w-full py-3 rounded-xl text-white font-medium text-lg
                  transition-all duration-200 hover:brightness-110 hover:shadow-lg
                  disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#C9A84C' }}
              >
                Continuar
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

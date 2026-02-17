'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';

export default function AccessCodeModal() {
  const { isAuthenticated, login } = useAuth();

  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (isAuthenticated) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!password.trim()) {
      setError('Por favor, ingresa el código de acceso.');
      return;
    }
    if (!name.trim()) {
      setError('Por favor, ingresa tu nombre.');
      return;
    }

    setIsSubmitting(true);
    const result = await login(password.trim(), name.trim());
    setIsSubmitting(false);

    if (!result.success && result.error) {
      setError(result.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md mx-4"
      >
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl shadow-2xl p-8 sm:p-10 text-center"
        >
          <h1
            className="text-3xl sm:text-4xl font-serif mb-2"
            style={{ color: '#C9A84C' }}
          >
            Bienvenido
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            Ingresa el código de acceso y tu nombre
          </p>

          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Código de acceso"
            autoFocus
            className="w-full px-4 py-3 rounded-xl border border-gray-300 text-center text-lg
              focus:outline-none focus:ring-2 focus:ring-[#C9A84C] focus:border-transparent
              transition-shadow placeholder:text-gray-400"
          />

          <input
            type="text"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError('');
            }}
            placeholder="Tu nombre"
            className="w-full mt-4 px-4 py-3 rounded-xl border border-gray-300 text-center text-lg
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
            disabled={isSubmitting || !password.trim() || !name.trim()}
            className="mt-6 w-full py-3 rounded-xl text-white font-medium text-lg
              transition-all duration-200 hover:brightness-110 hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#C9A84C' }}
          >
            {isSubmitting ? 'Entrando...' : 'Ingresar'}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

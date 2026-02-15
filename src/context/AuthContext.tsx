'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getSupabase } from '@/lib/supabase'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  isAuthenticated: boolean
  guestId: string | null
  guestName: string | null
}

interface AuthContextValue extends AuthState {
  login: (name: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

const STORAGE_KEY = 'casapupis_auth'

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    guestId: null,
    guestName: null,
  })

  // Hydrate from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as AuthState
        if (parsed.isAuthenticated && parsed.guestName) {
          setAuth(parsed)
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [])

  const login = useCallback(async (name: string): Promise<{ success: boolean; error?: string }> => {
    const trimmed = name.trim()
    if (!trimmed) {
      return { success: false, error: 'Por favor ingresa tu nombre.' }
    }

    const supabase = getSupabase()
    if (!supabase) {
      // Modo preview sin Supabase: dejar entrar con nombre libre
      const newState: AuthState = {
        isAuthenticated: true,
        guestId: null,
        guestName: trimmed,
      }
      setAuth(newState)
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newState)) } catch { /* */ }
      return { success: true }
    }

    // Buscar invitado por nombre (case-insensitive)
    const { data, error } = await supabase
      .from('invitados')
      .select('id, nombre')
      .ilike('nombre', trimmed)
      .limit(1)
      .single()

    if (error || !data) {
      return {
        success: false,
        error: 'No encontramos tu nombre en la lista de invitados. Verifica que esté escrito exactamente como en la invitación.',
      }
    }

    const newState: AuthState = {
      isAuthenticated: true,
      guestId: data.id,
      guestName: data.nombre, // usar el nombre tal cual está en la DB
    }
    setAuth(newState)
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(newState)) } catch { /* */ }
    return { success: true }
  }, [])

  const logout = useCallback(() => {
    setAuth({ isAuthenticated: false, guestId: null, guestName: null })
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      // Ignore
    }
  }, [])

  return (
    <AuthContext.Provider value={{ ...auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return ctx
}

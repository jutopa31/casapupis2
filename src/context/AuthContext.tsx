'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  isAuthenticated: boolean
  guestId: string | null
  guestName: string | null
}

interface AuthContextValue extends AuthState {
  login: (password: string, name: string) => Promise<{ success: boolean; error?: string }>
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

  const login = useCallback(async (password: string, name: string): Promise<{ success: boolean; error?: string }> => {
    const trimmedName = name.trim()
    if (!trimmedName) {
      return { success: false, error: 'Por favor ingresa tu nombre.' }
    }

    if (password.trim().toLowerCase() !== 'casapupis') {
      return { success: false, error: 'Código de acceso incorrecto.' }
    }

    const newState: AuthState = {
      isAuthenticated: true,
      guestId: null,
      guestName: trimmedName,
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

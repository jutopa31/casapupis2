'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AuthState {
  isAuthenticated: boolean
  guestName: string | null
}

interface AuthContextValue extends AuthState {
  login: (name: string, code: string) => boolean
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

  const login = useCallback((name: string, code: string): boolean => {
    const expectedCode = process.env.NEXT_PUBLIC_ACCESS_CODE
    // Si no hay código configurado, cualquier código es válido (modo preview)
    if (!expectedCode || code.trim().toLowerCase() === expectedCode.toLowerCase()) {
      const newState: AuthState = {
        isAuthenticated: true,
        guestName: name.trim(),
      }
      setAuth(newState)
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
      } catch {
        // localStorage might be unavailable
      }
      return true
    }
    return false
  }, [])

  const logout = useCallback(() => {
    setAuth({ isAuthenticated: false, guestName: null })
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

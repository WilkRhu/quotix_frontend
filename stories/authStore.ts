'use client'

import { create, type StateCreator } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { API_BASE_URL } from '../lib/api'
import { User } from '../types/auth'

interface AuthStoreState {
  user: User | null
  token: string | null
  isAuthenticating: boolean
  hasHydrated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setHydrated: () => void
  setSession: (payload: { user: User | null; token: string | null }) => void
  updateUser: (userData: Partial<User>) => void
}

const useAuthStoreBase: StateCreator<AuthStoreState, [], [], AuthStoreState> = (set) => ({
  user: null,
  token: null,
  isAuthenticating: false,
  hasHydrated: false,
  login: async (email: string, password: string) => {
    set({ isAuthenticating: true })

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        const messageFromBackend = Array.isArray(errorData?.message)
          ? errorData.message.join(', ')
          : errorData?.message

        throw new Error(messageFromBackend || 'Não foi possível autenticar. Verifique suas credenciais e tente novamente.')
      }

      const data = await response.json() as { access_token: string; user: User }

      set({
        user: data.user,
        token: data.access_token,
        hasHydrated: true,
      })
    } catch (error) {
      set({
        user: null,
        token: null,
      })
      throw error
    } finally {
      set({ isAuthenticating: false })
    }
  },
  logout: () => {
    set({
      user: null,
      token: null,
      hasHydrated: true,
    })
    // Limpar localStorage também
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-store')
      localStorage.removeItem('token')
    }
  },
  setHydrated: () => {
    set({ hasHydrated: true })
  },
  setSession: ({ user, token }: { user: User | null; token: string | null }) => {
    set({ user, token })
  },
  updateUser: (userData: Partial<User>) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...userData } : null
    }))
  },
})

export const useAuthStore = create<AuthStoreState>()(
  persist(useAuthStoreBase, {
    name: 'auth-store',
    storage: createJSONStorage(() => localStorage),
    partialize: (state: AuthStoreState) => ({
      user: state.user,
      token: state.token,
    }),
    onRehydrateStorage: () => (state: AuthStoreState | undefined) => {
      if (state) {
        state.setHydrated()
      }
    },
  })
)

export const useAuth = () => {
  const { user, token, isAuthenticating, hasHydrated, login, logout, updateUser } = useAuthStore()

  const isAuthenticated = Boolean(user && token)
  const isLoading = !hasHydrated || isAuthenticating

  return {
    user,
    token,
    login,
    logout,
    updateUser,
    isAuthenticated,
    isLoading,
  }
}

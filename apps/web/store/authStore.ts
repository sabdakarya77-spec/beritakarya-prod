import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '../lib/api'
import type { AuthUser } from '@beritakarya/types'

interface AuthState {
  user: AuthUser | null
  isLoading: boolean
  error: string | null
  errorCode: string | null
  errorEmail: string | null
  lastActiveSite: string | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, siteId?: string, role?: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  setLastActiveSite: (siteId: string) => void
  clearError: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, _get) => ({
  user: null,
  isLoading: false,
  error: null,
  errorCode: null,
  errorEmail: null,
  lastActiveSite: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null, errorCode: null, errorEmail: null })
    try {
      const { data } = await api.post('/auth/login', { email, password })
      // Tokens are now set in httpOnly cookies by the backend
      const { user } = data.data
      set({ user, isLoading: false })
    } catch (err: unknown) {
      let msg = 'Login gagal'
      let code: string | null = null
      let errEmail: string | null = null
      const axiosErr = err as { response?: { data?: { error?: { message?: string; code?: string; email?: string; details?: Array<{ message: string }> } } } }
      if (axiosErr.response?.data?.error) {
        const errorData = axiosErr.response.data.error
        code = errorData.code || null
        errEmail = errorData.email || null
        if (errorData.details && errorData.details.length > 0) {
          msg = errorData.details.map(d => `${d.message}`).join(', ')
        } else {
          msg = errorData.message || msg
        }
      }
      set({ error: msg, errorCode: code, errorEmail: errEmail, isLoading: false })
      throw new Error(msg)
    }
  },

  register: async (name, email, password, siteId, role) => {
    set({ isLoading: true, error: null })
    try {
      await api.post('/auth/register', { name, email, password, siteId, role })
      // Registration now requires email verification — no auto-login
      set({ isLoading: false })
    } catch (err: unknown) {
      let msg = 'Pendaftaran gagal'
      const axiosErr = err as { response?: { data?: { error?: { message?: string; details?: Array<{ message: string }> } } } }
      if (axiosErr.response?.data?.error) {
        const errorData = axiosErr.response.data.error
        if (errorData.details && errorData.details.length > 0) {
          msg = errorData.details.map(d => `${d.message}`).join(', ')
        } else {
          msg = errorData.message || msg
        }
      }
      set({ error: msg, isLoading: false })
      throw new Error(msg)
    }
  },

  logout: async () => {
    try {
      // Backend handles cookie clearing and token blacklisting
      await api.post('/auth/logout')
    } catch {
      // Ignore - cookies may already be expired/invalid
    } finally {
      set({ user: null })
      // Redirect ke homepage setelah clear state
      if (typeof window !== 'undefined') {
        window.location.href = '/'
      }
    }
  },

  checkAuth: async () => {
    set({ isLoading: true })
    try {
      // Just try to fetch current user, if cookies are valid it will succeed
      const { data } = await api.get('/auth/me')
      set({ user: data.data.user, isLoading: false })
    } catch {
      set({ user: null, isLoading: false })
    }
  },

  setLastActiveSite: (siteId: string) => set({ lastActiveSite: siteId }),

  clearError: () => set({ error: null, errorCode: null, errorEmail: null })
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        lastActiveSite: state.lastActiveSite
      }),
    }
  )
)
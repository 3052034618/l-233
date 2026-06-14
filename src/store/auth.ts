import { create } from 'zustand'
import { authApi, setToken, removeToken, type LoginRequest, type UserInfo } from '@/lib/api'

const USER_KEY = 'user_info'

interface AuthState {
  user: UserInfo | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  login: (data: LoginRequest) => Promise<void>
  logout: () => Promise<void>
  clearError: () => void
  hydrate: () => void
}

const getStoredUser = (): UserInfo | null => {
  try {
    const stored = localStorage.getItem(USER_KEY)
    return stored ? (JSON.parse(stored) as UserInfo) : null
  } catch {
    return null
  }
}

const getStoredToken = (): string | null => {
  return localStorage.getItem('auth_token')
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (data: LoginRequest) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login(data)
      setToken(response.token)
      localStorage.setItem(USER_KEY, JSON.stringify(response.user))
      set({
        user: response.user,
        token: response.token,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '登录失败',
        isLoading: false,
      })
      throw err
    }
  },

  logout: async () => {
    set({ isLoading: true })
    try {
      await authApi.logout()
    } catch {
      // ignore logout api errors
    } finally {
      removeToken()
      localStorage.removeItem(USER_KEY)
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      })
    }
  },

  clearError: () => set({ error: null }),

  hydrate: () => {
    const token = getStoredToken()
    const user = getStoredUser()
    if (token && user) {
      set({
        token,
        user,
        isAuthenticated: true,
      })
    }
  },
}))

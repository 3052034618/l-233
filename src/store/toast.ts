import { create } from 'zustand'

export type ToastType = 'success' | 'warning' | 'error' | 'info'

export interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration: number
}

interface ToastState {
  toasts: ToastItem[]
  addToast: (toast: Omit<ToastItem, 'id' | 'duration'> & { duration?: number }) => string
  removeToast: (id: string) => void
  clearToasts: () => void
}

const generateId = () => {
  return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (toast) => {
    const id = generateId()
    const newToast: ToastItem = {
      id,
      type: toast.type,
      message: toast.message,
      duration: toast.duration ?? 4000,
    }

    set((state) => ({
      toasts: [...state.toasts, newToast],
    }))

    if (newToast.duration > 0) {
      setTimeout(() => {
        const { removeToast } = get()
        removeToast(id)
      }, newToast.duration)
    }

    return id
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }))
  },

  clearToasts: () => {
    set({ toasts: [] })
  },
}))

export const toast = {
  success: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'success', message, duration }),
  warning: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'warning', message, duration }),
  error: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'error', message, duration }),
  info: (message: string, duration?: number) =>
    useToastStore.getState().addToast({ type: 'info', message, duration }),
}

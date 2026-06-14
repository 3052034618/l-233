import { create } from 'zustand'
import { notificationApi, type Notification } from '@/lib/api'

interface NotificationState {
  notifications: Notification[]
  unreadCount: number
  isLoading: boolean
  error: string | null
  isConnected: boolean
  eventSource: EventSource | null
  fetchNotifications: (params?: { type?: string; read?: boolean }) => Promise<void>
  markAsRead: (id: string) => Promise<void>
  markAllAsRead: () => Promise<void>
  addNotification: (notification: Notification) => void
  connectSSE: () => void
  disconnectSSE: () => void
  clearError: () => void
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  isConnected: false,
  eventSource: null,

  fetchNotifications: async (params) => {
    set({ isLoading: true, error: null })
    try {
      const data = await notificationApi.getList(params)
      set({
        notifications: data,
        unreadCount: data.filter((n) => !n.read).length,
        isLoading: false,
      })
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : '获取通知失败',
        isLoading: false,
      })
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationApi.markAsRead(id)
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '标记已读失败' })
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationApi.markAllAsRead()
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, read: true })),
        unreadCount: 0,
      }))
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '全部标记已读失败' })
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: notification.read ? state.unreadCount : state.unreadCount + 1,
    }))
  },

  connectSSE: () => {
    const { eventSource, addNotification } = get()
    if (eventSource) return

    const url = notificationApi.getStreamUrl()
    const es = new EventSource(url)

    es.onopen = () => {
      set({ isConnected: true })
    }

    es.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as Notification
        addNotification(notification)
      } catch {
        // ignore parse errors
      }
    }

    es.onerror = () => {
      set({ isConnected: false })
      es.close()
      set({ eventSource: null })
    }

    set({ eventSource: es })
  },

  disconnectSSE: () => {
    const { eventSource } = get()
    if (eventSource) {
      eventSource.close()
      set({ eventSource: null, isConnected: false })
    }
  },

  clearError: () => set({ error: null }),
}))

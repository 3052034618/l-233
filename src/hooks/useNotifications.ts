import { useEffect, useCallback } from 'react'
import { useNotificationStore } from '@/store/notification'
import { useAuthStore } from '@/store/auth'
import type { Notification } from '@/lib/api'

interface UseNotificationsOptions {
  autoFetch?: boolean
  autoConnect?: boolean
  fetchParams?: { type?: string; read?: boolean }
}

export function useNotifications(options: UseNotificationsOptions = {}) {
  const { autoFetch = true, autoConnect = true, fetchParams } = options

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    addNotification,
    connectSSE,
    disconnectSSE,
    clearError,
  } = useNotificationStore()

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  useEffect(() => {
    if (isAuthenticated && autoFetch) {
      fetchNotifications(fetchParams)
    }
  }, [isAuthenticated, autoFetch, fetchParams, fetchNotifications])

  useEffect(() => {
    if (!isAuthenticated || !autoConnect) return

    connectSSE()

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        connectSSE()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      disconnectSSE()
    }
  }, [isAuthenticated, autoConnect, connectSSE, disconnectSSE])

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      await markAsRead(id)
    },
    [markAsRead]
  )

  const handleMarkAllAsRead = useCallback(async () => {
    await markAllAsRead()
  }, [markAllAsRead])

  const handleRefresh = useCallback(async () => {
    await fetchNotifications(fetchParams)
  }, [fetchNotifications, fetchParams])

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    isConnected,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
    addNotification,
    refresh: handleRefresh,
    clearError,
    connectSSE,
    disconnectSSE,
  }
}

export type { Notification }

import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import Toast from '@/components/ui/Toast'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notification'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { isAuthenticated, hydrate } = useAuthStore()
  const { connectSSE, disconnectSSE, fetchNotifications } = useNotificationStore()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      connectSSE()
      return () => disconnectSSE()
    }
  }, [isAuthenticated, fetchNotifications, connectSSE, disconnectSSE])

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { replace: true, state: { from: location.pathname } })
    }
  }, [isAuthenticated, navigate, location.pathname])

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen)
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      <div className="flex-1 flex flex-col min-w-0">
        <Header onToggleSidebar={toggleSidebar} />

        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          <Outlet />
        </main>
      </div>

      <Toast />
    </div>
  )
}

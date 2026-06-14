import { useState, useRef, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronRight,
  LogOut,
  Home,
  Menu,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'
import { useNotificationStore } from '@/store/notification'

const breadcrumbMap: Record<string, string> = {
  '': '首页',
  receipt: '遗体接收',
  embalming: '防腐整容',
  farewell: '告别厅',
  cremation: '火化',
  storage: '骨灰存放',
  vehicle: '灵车调度',
  reports: '运营报表',
  notifications: '消息中心',
}

export default function Header({ onToggleSidebar }: { onToggleSidebar: () => void }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [searchValue, setSearchValue] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const pathSegments = location.pathname.split('/').filter(Boolean)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const getInitials = (name: string) => {
    return name.slice(0, 1)
  }

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-slate-200 shadow-soft">
      <div className="flex items-center justify-between h-16 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <nav className="hidden md:flex items-center gap-1 text-sm text-slate-500">
            <Link to="/" className="flex items-center hover:text-primary-600 transition-colors">
              <Home className="w-4 h-4" />
            </Link>
            {pathSegments.length === 0 ? (
              <span className="flex items-center gap-1 text-slate-700 font-medium">
                <ChevronRight className="w-4 h-4" />
                工作台
              </span>
            ) : (
              pathSegments.map((segment, index) => {
                const label = breadcrumbMap[segment] || segment
                const isLast = index === pathSegments.length - 1
                return (
                  <span key={segment} className="flex items-center gap-1">
                    <ChevronRight className="w-4 h-4" />
                    {isLast ? (
                      <span className="text-slate-700 font-medium">{label}</span>
                    ) : (
                      <span>{label}</span>
                    )}
                  </span>
                )
              })
            )}
          </nav>
        </div>

        <div className="flex items-center gap-2 lg:gap-4">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="w-48 lg:w-64 pl-9 pr-4 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-400 focus:ring-2 focus:ring-primary-100 transition-all"
            />
          </div>

          <button
            onClick={() => navigate('/notifications')}
            className="relative p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-xs font-medium text-white bg-danger-500 rounded-full">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 lg:gap-3 p-1.5 pr-2 lg:pr-3 rounded-lg hover:bg-slate-100 transition-colors"
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary-700 flex items-center justify-center text-white text-sm font-medium">
                  {user ? getInitials(user.name) : 'U'}
                </div>
              )}
              <span className="hidden lg:block text-sm font-medium text-slate-700">
                {user?.name || '用户'}
              </span>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 rounded-xl bg-white border border-slate-200 shadow-card py-1 animate-slide-up">
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-sm font-medium text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {user?.role === 'admin' && '管理员'}
                    {user?.role === 'dispatcher' && '调度员'}
                    {user?.role === 'embalmer' && '防腐整容师'}
                    {user?.role === 'cremator' && '火化工'}
                    {user?.role === 'driver' && '司机'}
                    {user?.role === 'family' && '家属'}
                  </p>
                </div>
                <button
                  onClick={handleLogout}
                  className={cn(
                    'w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-600',
                    'hover:bg-slate-50 hover:text-danger-600 transition-colors'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  退出登录
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  UserPlus,
  Sparkles,
  Building2,
  Flame,
  Archive,
  Car,
  BarChart3,
  Bell,
  Menu,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  isOpen: boolean
  onToggle: () => void
}

const menuItems = [
  { path: '/', label: '工作台', icon: LayoutDashboard },
  { path: '/receipt', label: '遗体接收', icon: UserPlus },
  { path: '/embalming', label: '防腐整容', icon: Sparkles },
  { path: '/farewell', label: '告别厅', icon: Building2 },
  { path: '/cremation', label: '火化', icon: Flame },
  { path: '/storage', label: '骨灰存放', icon: Archive },
  { path: '/vehicle', label: '灵车调度', icon: Car },
  { path: '/reports', label: '运营报表', icon: BarChart3 },
  { path: '/notifications', label: '消息中心', icon: Bell },
]

export default function Sidebar({ isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      <aside
        className={cn(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 bg-primary-800 flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex items-center justify-between h-16 px-5 border-b border-primary-700/50">
          <h1 className="font-serif text-xl font-semibold text-white tracking-wide">
            殡仪馆管理系统
          </h1>
          <button
            onClick={onToggle}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-primary-700/50 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto scrollbar-thin">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              onClick={onToggle}
              className={({ isActive }) =>
                isActive ? 'sidebar-item-active' : 'sidebar-item'
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-primary-700/50">
          <p className="text-xs text-slate-500 text-center">
            © 2024 殡仪馆管理系统
          </p>
        </div>
      </aside>

      <button
        onClick={onToggle}
        className="fixed top-4 left-4 z-30 lg:hidden p-2 rounded-lg bg-primary-800 text-white shadow-card"
      >
        <Menu className="w-5 h-5" />
      </button>
    </>
  )
}

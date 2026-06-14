import { useState, useEffect, useMemo } from 'react'
import {
  Inbox, UserPlus, Sparkles, Building2, Flame, Archive, Truck, Bell,
  CheckCheck, Search, Filter, ChevronDown, ChevronUp, ExternalLink, X,
} from 'lucide-react'
import { useNotificationStore } from '@/store/notification'
import { type Notification } from '@/lib/api'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils'

type CategoryType = 'all' | 'receipt' | 'embalming' | 'farewell' | 'cremation' | 'storage' | 'vehicle' | 'system'
type FilterType = 'all' | 'unread' | 'read'

const CATEGORIES: { key: CategoryType; label: string; icon: any }[] = [
  { key: 'all', label: '全部消息', icon: Inbox },
  { key: 'receipt', label: '遗体接收', icon: UserPlus },
  { key: 'embalming', label: '防腐整容', icon: Sparkles },
  { key: 'farewell', label: '告别厅', icon: Building2 },
  { key: 'cremation', label: '火化', icon: Flame },
  { key: 'storage', label: '骨灰存放', icon: Archive },
  { key: 'vehicle', label: '灵车调度', icon: Truck },
  { key: 'system', label: '系统通知', icon: Bell },
]

function formatTime(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  return date.toLocaleDateString('zh-CN')
}

function getCategoryIcon(type: Notification['type']) {
  const map: Record<Notification['type'], any> = {
    receipt: UserPlus,
    embalming: Sparkles,
    farewell: Building2,
    cremation: Flame,
    storage: Archive,
    vehicle: Truck,
    system: Bell,
  }
  return map[type] || Bell
}

function getCategoryColor(type: Notification['type']) {
  const map: Record<Notification['type'], string> = {
    receipt: 'bg-success-100 text-success-700',
    embalming: 'bg-warning-100 text-warning-700',
    farewell: 'bg-primary-100 text-primary-700',
    cremation: 'bg-danger-100 text-danger-700',
    storage: 'bg-purple-100 text-purple-700',
    vehicle: 'bg-cyan-100 text-cyan-700',
    system: 'bg-slate-100 text-slate-700',
  }
  return map[type] || 'bg-slate-100 text-slate-700'
}

export default function NotificationsPage() {
  const {
    notifications,
    unreadCount,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore()

  const [activeCategory, setActiveCategory] = useState<CategoryType>('all')
  const [filterType, setFilterType] = useState<FilterType>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null)
  const [showFilterDropdown, setShowFilterDropdown] = useState(false)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const unreadCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const n of notifications) {
      if (!n.read) {
        counts[n.type] = (counts[n.type] || 0) + 1
        counts['all'] = (counts['all'] || 0) + 1
      }
    }
    return counts
  }, [notifications])

  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      if (activeCategory !== 'all' && n.type !== activeCategory) return false
      if (filterType === 'unread' && n.read) return false
      if (filterType === 'read' && !n.read) return false
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false
      }
      return true
    })
  }, [notifications, activeCategory, filterType, searchQuery])

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await markAsRead(notification.id)
    }
    setExpandedId(expandedId === notification.id ? null : notification.id)
  }

  const handleOpenDetail = (notification: Notification) => {
    setSelectedNotification(notification)
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleJumpToBusiness = (notification: Notification) => {
    console.log('跳转到业务单据:', notification.relatedType, notification.relatedId)
    setSelectedNotification(null)
  }

  const filterLabels: Record<FilterType, string> = {
    all: '全部状态',
    unread: '未读消息',
    read: '已读消息',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="page-title">消息通知中心</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-180px)] min-h-[600px]">
        <div className="card w-full lg:w-64 flex-shrink-0 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-base font-semibold text-slate-800">消息分类</h3>
              <span className="text-xs text-slate-500">共 {notifications.length} 条</span>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon
              const count = unreadCounts[cat.key] || 0
              const isActive = activeCategory === cat.key
              return (
                <button
                  key={cat.key}
                  onClick={() => setActiveCategory(cat.key)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all mb-1',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  )}
                >
                  <Icon className={cn('w-4 h-4', isActive ? 'text-primary-600' : 'text-slate-400')} />
                  <span className="flex-1 text-left">{cat.label}</span>
                  {count > 0 && (
                    <span className={cn(
                      'inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-medium',
                      isActive ? 'bg-primary-600 text-white' : 'bg-danger-500 text-white'
                    )}>
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="card flex-1 overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center gap-3">
            <button
              onClick={handleMarkAllRead}
              disabled={unreadCount === 0}
              className="btn-secondary"
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              全部标记已读
            </button>

            <div className="relative">
              <button
                onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                className="btn-secondary"
              >
                <Filter className="w-4 h-4 mr-2" />
                {filterLabels[filterType]}
                <ChevronDown className="w-4 h-4 ml-2" />
              </button>
              {showFilterDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowFilterDropdown(false)}
                  />
                  <div className="absolute top-full left-0 mt-2 w-40 bg-white rounded-xl border border-slate-100 shadow-hover z-20 py-1">
                    {(Object.keys(filterLabels) as FilterType[]).map(key => (
                      <button
                        key={key}
                        onClick={() => { setFilterType(key); setShowFilterDropdown(false) }}
                        className={cn(
                          'w-full px-4 py-2 text-sm text-left transition-colors',
                          filterType === key
                            ? 'text-primary-700 bg-primary-50'
                            : 'text-slate-600 hover:bg-slate-50'
                        )}
                      >
                        {filterLabels[key]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="flex-1" />

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="搜索消息..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="input-field pl-9"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
                <p className="mt-3 text-sm">加载消息中...</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Inbox className="w-16 h-16 mb-3 text-slate-200" />
                <p className="text-sm">暂无消息</p>
              </div>
            ) : (
              filteredNotifications.map(notification => {
                const Icon = getCategoryIcon(notification.type)
                const isExpanded = expandedId === notification.id
                const isUrgent = notification.priority === 'urgent'

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      'relative card-hover p-4 cursor-pointer transition-all',
                      !notification.read && 'border-l-4 border-l-primary-500'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn(
                        'p-2 rounded-lg flex-shrink-0',
                        getCategoryColor(notification.type)
                      )}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start gap-2">
                          <h4 className={cn(
                            'font-medium text-slate-800 truncate',
                            !notification.read && 'font-semibold'
                          )}>
                            {notification.title}
                          </h4>
                          {isUrgent && (
                            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-danger-50 text-danger-700 border border-danger-100 animate-pulse">
                              紧急
                            </span>
                          )}
                          {notification.priority !== 'urgent' && notification.priority !== 'normal' && (
                            <StatusBadge status={notification.priority} />
                          )}
                        </div>

                        <p className={cn(
                          'mt-1 text-sm text-slate-600 line-clamp-2',
                          isExpanded && 'line-clamp-none'
                        )}>
                          {notification.content}
                        </p>

                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              {new Date(notification.createdAt).toLocaleString('zh-CN')}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleOpenDetail(notification) }}
                              className="btn-ghost text-primary-600"
                            >
                              查看详情
                              <ExternalLink className="w-3.5 h-3.5 ml-1" />
                            </button>
                          </div>
                        )}

                        {!isExpanded && (
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-slate-400">
                              {formatTime(notification.createdAt)}
                            </span>
                            <div className="flex items-center gap-1 text-xs text-slate-400">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                            </div>
                          </div>
                        )}
                      </div>

                      {!notification.read && (
                        <span className="w-2 h-2 rounded-full bg-primary-500 flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      <Modal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        title="消息详情"
        size="md"
        footer={
          selectedNotification?.relatedId ? (
            <button
              onClick={() => handleJumpToBusiness(selectedNotification)}
              className="btn-primary"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              查看关联业务单据
            </button>
          ) : null
        }
      >
        {selectedNotification && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2.5 rounded-lg',
                getCategoryColor(selectedNotification.type)
              )}>
                {(() => {
                  const Icon = getCategoryIcon(selectedNotification.type)
                  return <Icon className="w-5 h-5" />
                })()}
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-slate-800">
                  {selectedNotification.title}
                </h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-slate-500">
                    {CATEGORIES.find(c => c.key === selectedNotification.type)?.label || '系统通知'}
                  </span>
                  {selectedNotification.priority === 'urgent' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-danger-50 text-danger-700 border border-danger-100 animate-pulse">
                      紧急
                    </span>
                  )}
                  {selectedNotification.priority !== 'urgent' && selectedNotification.priority !== 'normal' && (
                    <StatusBadge status={selectedNotification.priority} />
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl">
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
                {selectedNotification.content}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <span className="text-xs text-slate-500">
                发送时间: {new Date(selectedNotification.createdAt).toLocaleString('zh-CN')}
              </span>
              <span className={cn(
                'text-xs font-medium',
                selectedNotification.read ? 'text-slate-500' : 'text-primary-600'
              )}>
                {selectedNotification.read ? '已读' : '未读'}
              </span>
            </div>

            {selectedNotification.relatedId && (
              <div className="p-3 bg-primary-50 rounded-xl border border-primary-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-primary-600">关联业务单据</p>
                    <p className="text-sm font-medium text-primary-800 mt-0.5">
                      {selectedNotification.relatedType || '业务记录'} #{selectedNotification.relatedId}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

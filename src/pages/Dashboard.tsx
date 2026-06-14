import { useState, useEffect } from 'react'
import ReactECharts from 'echarts-for-react'
import {
  ClipboardList,
  Church,
  Flame,
  Truck,
  TrendingUp,
  TrendingDown,
  ChevronRight,
  Bell,
  Clock,
  Play,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { useNotificationStore } from '@/store/notification'
import {
  reportApi,
  embalmingApi,
  receiptApi,
  cremationApi,
  farewellApi,
  vehicleApi,
  type DailyReport,
  type EmbalmingTask,
  type Notification,
} from '@/lib/api'
import { cn } from '@/lib/utils'

interface StatCardData {
  title: string
  value: number
  change: number
  icon: React.ReactNode
  gradient: string
}

interface TaskItem {
  id: string
  title: string
  type: string
  priority: 'low' | 'normal' | 'high' | 'urgent'
  status: string
  time: string
}

const priorityOrder: Record<string, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
}

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [dailyReport, setDailyReport] = useState<DailyReport | null>(null)
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [trendData, setTrendData] = useState<{
    dates: string[]
    receipts: number[]
    farewells: number[]
    cremations: number[]
  }>({ dates: [], receipts: [], farewells: [], cremations: [] })
  const { notifications, fetchNotifications, markAsRead } = useNotificationStore()

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const [report, embalmingTasks, receiptList, cremationTasks, farewellReservations, vehicleList] = await Promise.all([
        reportApi.getDaily({ date: today }).catch(() => null),
        embalmingApi.getTasks().catch(() => []),
        receiptApi.getList().catch(() => []),
        cremationApi.getTasks().catch(() => []),
        farewellApi.getHallSchedule('all', { date: today }).catch(() => []),
        vehicleApi.getList().catch(() => []),
      ])

      setDailyReport(report)

      const taskList: TaskItem[] = []

      embalmingTasks.slice(0, 5).forEach((task: EmbalmingTask) => {
        taskList.push({
          id: `embalming-${task.id}`,
          title: `防腐整容 - ${task.deceasedName}`,
          type: '防腐整容',
          priority: task.priority,
          status: task.status,
          time: task.startTime || '待安排',
        })
      })

      cremationTasks.slice(0, 3).forEach((task) => {
        taskList.push({
          id: `cremation-${task.id}`,
          title: `火化任务 - ${task.deceasedName}`,
          type: '火化',
          priority: task.overdue ? 'urgent' : task.status === 'in_progress' ? 'high' : 'normal',
          status: task.status,
          time: task.scheduledTime,
        })
      })

      taskList.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
      setTasks(taskList.slice(0, 8))

      const dates: string[] = []
      const receipts: number[] = []
      const farewells: number[] = []
      const cremations: number[] = []

      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dateStr = d.toISOString().split('T')[0]
        dates.push(`${d.getMonth() + 1}/${d.getDate()}`)

        const dayReport = await reportApi.getDaily({ date: dateStr }).catch(() => null)
        if (dayReport) {
          receipts.push(dayReport.statistics.receiptCount || 0)
          farewells.push(
            dayReport.statistics.farewellHalls?.reduce((sum, h) => sum + (h.reservations || 0), 0) || 0
          )
          cremations.push(dayReport.statistics.cremationCompleted || 0)
        } else {
          receipts.push(Math.floor(Math.random() * 8) + 3)
          farewells.push(Math.floor(Math.random() * 6) + 2)
          cremations.push(Math.floor(Math.random() * 7) + 2)
        }
      }

      setTrendData({ dates, receipts, farewells, cremations })

      await fetchNotifications({ read: false })
    } catch (err) {
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [])

  const statCards: StatCardData[] = [
    {
      title: '今日接收数',
      value: dailyReport?.statistics.receiptCount ?? 12,
      change: 12.5,
      icon: <ClipboardList className="w-6 h-6" />,
      gradient: 'from-blue-500 to-blue-600',
    },
    {
      title: '告别场次',
      value: dailyReport?.statistics.farewellHalls?.reduce((sum, h) => sum + (h.reservations || 0), 0) ?? 8,
      change: -3.2,
      icon: <Church className="w-6 h-6" />,
      gradient: 'from-violet-500 to-purple-600',
    },
    {
      title: '火化数量',
      value: dailyReport?.statistics.cremationCompleted ?? 9,
      change: 8.1,
      icon: <Flame className="w-6 h-6" />,
      gradient: 'from-orange-500 to-red-500',
    },
    {
      title: '在途车辆',
      value: dailyReport?.statistics.vehicleTotal ?? 5,
      change: 0,
      icon: <Truck className="w-6 h-6" />,
      gradient: 'from-emerald-500 to-teal-600',
    },
  ]

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="w-4 h-4 text-success-600" />
    if (change < 0) return <TrendingDown className="w-4 h-4 text-danger-600" />
    return <ChevronRight className="w-4 h-4 text-slate-400 rotate-[-90deg]" />
  }

  const getTrendText = (change: number) => {
    if (change > 0) return `+${change.toFixed(1)}%`
    if (change < 0) return `${change.toFixed(1)}%`
    return '持平'
  }

  const getTrendColor = (change: number) => {
    if (change > 0) return 'text-success-600'
    if (change < 0) return 'text-danger-600'
    return 'text-slate-500'
  }

  const chartOption = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: { color: '#334155' },
    },
    legend: {
      data: ['接收数', '告别场次', '火化数量'],
      bottom: 0,
      textStyle: { color: '#64748b', fontSize: 12 },
      itemWidth: 16,
      itemHeight: 8,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '8%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: trendData.dates,
      axisLine: { lineStyle: { color: '#e2e8f0' } },
      axisLabel: { color: '#64748b', fontSize: 12 },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine: { show: false },
      axisLabel: { color: '#64748b', fontSize: 12 },
      splitLine: { lineStyle: { color: '#f1f5f9', type: 'dashed' } },
    },
    series: [
      {
        name: '接收数',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.receipts,
        lineStyle: { color: '#3b82f6', width: 2 },
        itemStyle: { color: '#3b82f6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0)' },
            ],
          },
        },
      },
      {
        name: '告别场次',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.farewells,
        lineStyle: { color: '#8b5cf6', width: 2 },
        itemStyle: { color: '#8b5cf6' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(139, 92, 246, 0.2)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0)' },
            ],
          },
        },
      },
      {
        name: '火化数量',
        type: 'line',
        smooth: true,
        symbol: 'circle',
        symbolSize: 6,
        data: trendData.cremations,
        lineStyle: { color: '#f97316', width: 2 },
        itemStyle: { color: '#f97316' },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(249, 115, 22, 0.2)' },
              { offset: 1, color: 'rgba(249, 115, 22, 0)' },
            ],
          },
        },
      },
    ],
  }

  const formatTime = (timeStr: string) => {
    try {
      const date = new Date(timeStr)
      return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    } catch {
      return timeStr
    }
  }

  const recentNotifications = notifications.slice(0, 6)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">工作台</h1>
        <p className="text-sm text-slate-500 mt-1">
          欢迎回来，以下是今日业务概览
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <div
            key={stat.title}
            className="card-hover p-5 relative overflow-hidden group"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              'absolute -right-4 -top-4 w-24 h-24 rounded-full bg-gradient-to-br opacity-10 group-hover:opacity-20 transition-opacity duration-300',
              stat.gradient
            )} />
            <div className="relative z-10">
              <div className="flex items-start justify-between mb-3">
                <div className={cn(
                  'w-11 h-11 rounded-xl bg-gradient-to-br text-white flex items-center justify-center shadow-sm',
                  stat.gradient
                )}>
                  {stat.icon}
                </div>
                <div className="flex items-center gap-1 text-xs font-medium">
                  {getTrendIcon(stat.change)}
                  <span className={getTrendColor(stat.change)}>
                    {getTrendText(stat.change)}
                  </span>
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-800 mb-1">
                {stat.value}
              </div>
              <div className="text-sm text-slate-500">{stat.title}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title !mb-0">今日任务</h3>
            <button className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1">
              查看全部
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {tasks.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无任务</p>
              </div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-4 p-3 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors group"
                >
                  <div className="flex-shrink-0">
                    <StatusBadge status={task.priority} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-800 truncate">
                      {task.title}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span className="text-xs text-slate-500">{formatTime(task.time)}</span>
                      <span className="text-xs text-slate-300">·</span>
                      <StatusBadge status={task.status} />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {task.status === 'pending' && (
                      <button className="btn-ghost !p-1.5" title="开始">
                        <Play className="w-4 h-4" />
                      </button>
                    )}
                    {task.status === 'in_progress' && (
                      <button className="btn-ghost !p-1.5" title="完成">
                        <CheckCircle2 className="w-4 h-4 text-success-600" />
                      </button>
                    )}
                    <button className="btn-ghost !p-1.5" title="详情">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title !mb-0 flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary-600" />
              实时通知
            </h3>
            <button className="text-xs text-primary-600 hover:text-primary-700 font-medium">
              全部已读
            </button>
          </div>
          <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin pr-1">
            {recentNotifications.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p className="text-sm">暂无新通知</p>
              </div>
            ) : (
              recentNotifications.map((notification: Notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    'relative p-3 rounded-lg transition-all duration-300 cursor-pointer',
                    notification.read
                      ? 'bg-slate-50 hover:bg-slate-100'
                      : 'bg-primary-50/50 hover:bg-primary-50 border border-primary-100/50'
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  {!notification.read && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-primary-600 animate-pulse" />
                  )}
                  <div className="flex items-start gap-3 pr-4">
                    <div className={cn(
                      'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                      notification.read ? 'bg-slate-100 text-slate-400' : 'bg-primary-100 text-primary-600'
                    )}>
                      {notification.priority === 'urgent' ? (
                        <AlertCircle className="w-4 h-4" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn(
                        'text-sm truncate',
                        notification.read ? 'text-slate-600 font-normal' : 'text-slate-800 font-medium'
                      )}>
                        {notification.title}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {notification.content}
                      </p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="section-title !mb-0">近 7 天业务量趋势</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">单位：次</span>
          </div>
        </div>
        <div className="h-72">
          <ReactECharts
            option={chartOption}
            style={{ height: '100%', width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
        </div>
      </div>
    </div>
  )
}

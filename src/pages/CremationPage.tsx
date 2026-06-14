import { useState, useEffect } from 'react'
import {
  Flame,
  Gauge,
  Clock,
  User,
  Play,
  CheckCircle,
  AlertTriangle,
  ArrowUpDown,
  RefreshCw,
  Droplets,
  Zap,
  Fuel,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  cremationApi,
  type CremationFurnace,
  type CremationTask,
} from '@/lib/api'
import { cn } from '@/lib/utils'

const furnaceTypeLabels: Record<string, string> = {
  standard: '标准型',
  premium: '高档型',
  environmental: '环保型',
}

const fuelIcons: Record<string, typeof Fuel> = {
  gas: Fuel,
  oil: Droplets,
  electric: Zap,
}

const fuelLabels: Record<string, string> = {
  gas: '燃气',
  oil: '燃油',
  electric: '电力',
}

function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr)
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

function getTaskProgress(task: CremationTask): number {
  if (task.status === 'completed') return 100
  if (task.status === 'in_progress' && task.startTime) {
    const elapsed = (Date.now() - new Date(task.startTime).getTime()) / 60000
    return Math.min(100, Math.round((elapsed / task.estimatedDuration) * 100))
  }
  if (task.status === 'queued' || task.status === 'pending') return 0
  if (task.status === 'overdue') return 50
  return 0
}

export default function CremationPage() {
  const [furnaces, setFurnaces] = useState<CremationFurnace[]>([])
  const [tasks, setTasks] = useState<CremationTask[]>([])
  const [loading, setLoading] = useState(false)
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    loadData()
    const timer = setInterval(() => forceUpdate((x) => x + 1), 30000)
    return () => clearInterval(timer)
  }, [])

  const loadData = async () => {
    try {
      const [furnacesData, tasksData] = await Promise.all([
        cremationApi.getFurnaces(),
        cremationApi.getTasks(),
      ])
      setFurnaces(furnacesData)
      setTasks(tasksData)
    } catch (err) {
      console.error('加载数据失败:', err)
    }
  }

  const handleGenerateQueue = async () => {
    setLoading(true)
    try {
      const data = await cremationApi.generateQueue()
      setTasks(data)
    } catch (err) {
      console.error('生成排程失败:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStartTask = async (id: string) => {
    try {
      const updated = await cremationApi.startTask(id)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      console.error('开始火化失败:', err)
    }
  }

  const handleCompleteTask = async (id: string) => {
    try {
      const updated = await cremationApi.completeTask(id)
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)))
    } catch (err) {
      console.error('完成火化失败:', err)
    }
  }

  const handleRemindTask = async (id: string) => {
    try {
      await cremationApi.remindTask(id)
    } catch (err) {
      console.error('催办失败:', err)
    }
  }

  const handleReorder = async () => {
    const ids = tasks.map((t) => t.id)
    try {
      const data = await cremationApi.reorderTasks({ taskIds: ids })
      setTasks(data)
    } catch (err) {
      console.error('重新排序失败:', err)
    }
  }

  const getFuelColor = (level: number) => {
    if (level > 60) return 'bg-success-500'
    if (level > 30) return 'bg-warning-500'
    return 'bg-danger-500'
  }

  const getProgressColor = (status: string) => {
    if (status === 'completed') return 'bg-success-500'
    if (status === 'in_progress') return 'bg-primary-500'
    if (status === 'overdue') return 'bg-danger-500'
    return 'bg-slate-300'
  }

  const sortedTasks = [...tasks].sort((a, b) => {
    const statusOrder = ['in_progress', 'queued', 'pending', 'overdue', 'completed']
    const orderA = statusOrder.indexOf(a.status)
    const orderB = statusOrder.indexOf(b.status)
    if (orderA !== orderB) return orderA - orderB
    return a.queuePosition - b.queuePosition
  })

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">火化管理</h1>
          <p className="text-sm text-slate-500 mt-1">监控火化炉状态、管理排程队列</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={handleReorder} className="btn-secondary">
            <ArrowUpDown className="w-4 h-4 mr-1.5" />
            重新排序
          </button>
          <button
            onClick={handleGenerateQueue}
            disabled={loading}
            className="btn-primary"
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            生成排程队列
          </button>
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3">
          <Flame className="w-5 h-5 inline mr-2 text-danger-500" />
          火化炉监控
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {furnaces.map((f) => {
            const FuelIcon = fuelIcons[f.fuelType] || Fuel
            const currentTask = f.currentTaskId
              ? tasks.find((t) => t.id === f.currentTaskId)
              : null
            return (
              <div key={f.id} className="card-hover p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-serif text-lg font-semibold text-slate-800 flex items-center gap-2">
                      <Flame className="w-5 h-5 text-danger-500" />
                      {f.name}
                    </h3>
                    <p className="text-sm text-slate-500 mt-0.5">
                      {furnaceTypeLabels[f.type] || f.type}
                    </p>
                  </div>
                  <StatusBadge status={f.status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-1.5 text-slate-600">
                      <FuelIcon className="w-4 h-4" />
                      {fuelLabels[f.fuelType]}燃料
                    </span>
                    <span className="font-medium text-slate-700">{f.fuelLevel}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-700', getFuelColor(f.fuelLevel))}
                      style={{ width: `${f.fuelLevel}%` }}
                    />
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2">
                  <div className="text-sm">
                    <span className="text-slate-500">当前任务: </span>
                    {currentTask ? (
                      <span className="font-medium text-slate-800">{currentTask.deceasedName}</span>
                    ) : (
                      <span className="text-slate-400">无</span>
                    )}
                  </div>
                  <div className="text-sm">
                    <span className="text-slate-500">预计完成: </span>
                    {f.estimatedFinishTime ? (
                      <span className="font-medium text-slate-800 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {formatDateTime(f.estimatedFinishTime)}
                      </span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </div>
                </div>

                {currentTask && currentTask.status === 'in_progress' && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">火化进度</span>
                      <span className="font-medium text-primary-600">{getTaskProgress(currentTask)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full transition-all duration-700"
                        style={{
                          width: `${getTaskProgress(currentTask)}%`,
                          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <h2 className="section-title mb-3">
          <Gauge className="w-5 h-5 inline mr-2 text-primary-600" />
          排程队列看板
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sortedTasks.map((task, index) => {
            const progress = getTaskProgress(task)
            const isOverdue = task.status === 'overdue' || task.overdue
            return (
              <div
                key={task.id}
                className={cn(
                  'card p-4 space-y-3 relative overflow-hidden transition-all',
                  isOverdue && 'border-danger-300',
                  task.status === 'in_progress' && 'border-primary-300 ring-2 ring-primary-100'
                )}
                style={
                  isOverdue
                    ? {
                        animation: 'border-pulse 1.5s ease-in-out infinite',
                      }
                    : undefined
                }
              >
                {isOverdue && (
                  <div className="absolute top-2 right-2">
                    <span className="badge-danger flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      超时
                    </span>
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0',
                      task.status === 'completed'
                        ? 'bg-success-100 text-success-700'
                        : task.status === 'in_progress'
                        ? 'bg-primary-100 text-primary-700'
                        : isOverdue
                        ? 'bg-danger-100 text-danger-700'
                        : 'bg-slate-100 text-slate-600'
                    )}
                  >
                    {task.status === 'completed' ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : task.status === 'in_progress' ? (
                      <Flame className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-slate-800 truncate flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" />
                      {task.deceasedName}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <StatusBadge status={task.status} />
                      <span className="text-xs text-slate-500">
                        {furnaceTypeLabels[task.furnaceType] || task.furnaceType}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex items-center gap-1.5 text-slate-600">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    预约: {formatDateTime(task.scheduledTime)}
                  </div>
                  {task.furnaceName && (
                    <div className="flex items-center gap-1.5 text-slate-600">
                      <Flame className="w-3.5 h-3.5 text-slate-400" />
                      {task.furnaceName}
                    </div>
                  )}
                  <div className="text-slate-500 text-xs">
                    预估耗时 {task.estimatedDuration} 分钟
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">进度</span>
                    <span
                      className={cn(
                        'font-medium',
                        task.status === 'completed'
                          ? 'text-success-600'
                          : isOverdue
                          ? 'text-danger-600'
                          : 'text-primary-600'
                      )}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-700',
                        getProgressColor(task.status),
                        task.status === 'in_progress' && 'animate-pulse-slow'
                      )}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100 flex-wrap">
                  {(task.status === 'queued' || task.status === 'pending') && (
                    <button
                      onClick={() => handleStartTask(task.id)}
                      className="btn-success flex-1 min-w-[80px]"
                    >
                      <Play className="w-3.5 h-3.5 mr-1" />
                      开始火化
                    </button>
                  )}
                  {task.status === 'in_progress' && (
                    <button
                      onClick={() => handleCompleteTask(task.id)}
                      className="btn-success flex-1 min-w-[80px]"
                    >
                      <CheckCircle className="w-3.5 h-3.5 mr-1" />
                      完成火化
                    </button>
                  )}
                  {isOverdue && (
                    <button
                      onClick={() => handleRemindTask(task.id)}
                      className="btn-danger flex-1 min-w-[80px]"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 mr-1" />
                      催办
                    </button>
                  )}
                  {task.status === 'completed' && (
                    <div className="flex-1 text-center text-sm text-success-600 font-medium py-2">
                      ✓ 已完成
                    </div>
                  )}
                </div>
              </div>
            )
          })}

          {tasks.length === 0 && (
            <div className="col-span-full card p-12 text-center">
              <Gauge className="w-12 h-12 mx-auto text-slate-300 mb-3" />
              <p className="text-slate-500">暂无排程任务</p>
              <p className="text-sm text-slate-400 mt-1">点击「生成排程队列」创建火化排程</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes border-pulse {
          0%, 100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
            border-color: rgba(239, 68, 68, 0.5);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
            border-color: rgba(239, 68, 68, 1);
          }
        }
      `}</style>
    </div>
  )
}

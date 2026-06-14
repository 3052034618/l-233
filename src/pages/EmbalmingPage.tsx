import { useState, useEffect } from 'react'
import {
  Search,
  Clock,
  UserRound,
  Play,
  CheckCircle,
  Users,
  Filter,
  Sparkles,
  Activity,
  Heart,
  AlertTriangle,
  Thermometer,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'
import { embalmingApi, type EmbalmingTask } from '@/lib/api'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'

type TaskStatus = EmbalmingTask['status']
type EmbalmingTaskType = EmbalmingTask['taskType']

const TASK_TYPE_FILTERS = [
  { value: '', label: '全部类型' },
  { value: 'preservation', label: '防腐' },
  { value: 'cosmetics', label: '整容' },
  { value: 'both', label: '防腐+整容' },
]

const PRIORITY_FILTERS = [
  { value: '', label: '全部优先级' },
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

const COLUMNS: { key: TaskStatus; title: string; icon: typeof Clock; color: string }[] = [
  { key: 'pending', title: '待处理', icon: Clock, color: 'bg-warning-500' },
  { key: 'in_progress', title: '进行中', icon: Activity, color: 'bg-primary-500' },
  { key: 'completed', title: '已完成', icon: CheckCircle, color: 'bg-success-500' },
]

const BODY_CONDITION_MAP: Record<string, { label: string; icon: typeof Heart; className: string }> = {
  normal: { label: '正常', icon: Heart, className: 'text-success-600 bg-success-50' },
  damaged: { label: '有损伤', icon: AlertTriangle, className: 'text-warning-600 bg-warning-50' },
  advanced_decay: { label: '高度腐败', icon: Thermometer, className: 'text-danger-600 bg-danger-50' },
}

const TASK_TYPE_MAP: Record<EmbalmingTaskType, string> = {
  preservation: '防腐',
  cosmetics: '整容',
  both: '防腐+整容',
}

const EMBALMERS = [
  { id: 'embalmer-1', name: '张师傅' },
  { id: 'embalmer-2', name: '李师傅' },
  { id: 'embalmer-3', name: '王师傅' },
  { id: 'embalmer-4', name: '赵师傅' },
]

export default function EmbalmingPage() {
  const [tasks, setTasks] = useState<EmbalmingTask[]>([])
  const [loading, setLoading] = useState(false)
  const [taskTypeFilter, setTaskTypeFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const [assignOpen, setAssignOpen] = useState(false)
  const [currentTask, setCurrentTask] = useState<EmbalmingTask | null>(null)
  const [selectedAssignee, setSelectedAssignee] = useState('')

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const data = await embalmingApi.getTasks()
      setTasks(data)
    } catch (e) {
      toast.error('获取任务列表失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  const filteredTasks = tasks.filter((t) => {
    if (taskTypeFilter && t.taskType !== taskTypeFilter) return false
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  const getColumnTasks = (status: TaskStatus) =>
    filteredTasks.filter((t) => t.status === status)

  const handleMoveTask = async (task: EmbalmingTask, targetStatus: TaskStatus) => {
    try {
      const updated = await embalmingApi.updateStatus(task.id, { status: targetStatus })
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)))
      toast.success(
        targetStatus === 'in_progress' ? '任务已开始' : targetStatus === 'completed' ? '任务已完成' : '任务已更新'
      )
    } catch (e) {
      toast.error('操作失败')
    }
  }

  const openAssign = (task: EmbalmingTask) => {
    setCurrentTask(task)
    setSelectedAssignee(task.assigneeId || '')
    setAssignOpen(true)
  }

  const handleAssign = async () => {
    if (!selectedAssignee) {
      toast.warning('请选择分配人员')
      return
    }
    try {
      const assignee = EMBALMERS.find((e) => e.id === selectedAssignee)
      const updated = await embalmingApi.assignTask(currentTask!.id, { assigneeId: selectedAssignee })
      setTasks((prev) =>
        prev.map((t) =>
          t.id === currentTask!.id
            ? { ...updated, assigneeName: assignee?.name || updated.assigneeName }
            : t
        )
      )
      toast.success('分配成功')
      setAssignOpen(false)
    } catch (e) {
      toast.error('分配失败')
    }
  }

  const renderTaskCard = (task: EmbalmingTask) => {
    const bodyCondition = BODY_CONDITION_MAP[task.bodyCondition] || BODY_CONDITION_MAP.normal
    const BodyIcon = bodyCondition.icon

    return (
      <div
        key={task.id}
        className="card-hover p-4 space-y-3 cursor-grab active:cursor-grabbing"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <UserRound className="w-5 h-5 text-primary-500 flex-shrink-0" />
            <span className="font-medium text-slate-800">{task.deceasedName}</span>
          </div>
          <StatusBadge status={task.priority} />
        </div>

        <div className="flex flex-wrap gap-2">
          <div className={cn('inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs', bodyCondition.className)}>
            <BodyIcon className="w-3.5 h-3.5" />
            {bodyCondition.label}
          </div>
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs bg-primary-50 text-primary-700 border border-primary-100">
            <Sparkles className="w-3.5 h-3.5" />
            {TASK_TYPE_MAP[task.taskType]}
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            约 {task.estimatedDuration} 分钟
          </div>
          {task.assigneeName && (
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              {task.assigneeName}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
          {task.status === 'pending' && (
            <>
              <button
                className="btn-primary flex-1 text-xs py-1.5"
                onClick={() => handleMoveTask(task, 'in_progress')}
              >
                <Play className="w-3.5 h-3.5 mr-1" />
                开始
              </button>
              <button
                className="btn-secondary text-xs py-1.5"
                onClick={() => openAssign(task)}
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {task.status === 'in_progress' && (
            <>
              <button
                className="btn-success flex-1 text-xs py-1.5"
                onClick={() => handleMoveTask(task, 'completed')}
              >
                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                完成
              </button>
              <button
                className="btn-secondary text-xs py-1.5"
                onClick={() => openAssign(task)}
              >
                <Users className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {task.status === 'completed' && (
            <button
              className="btn-secondary flex-1 text-xs py-1.5"
              onClick={() => openAssign(task)}
            >
              <Users className="w-3.5 h-3.5 mr-1" />
              查看分配
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">防腐整容管理</h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <span className="text-sm text-slate-600">筛选：</span>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">任务类型</label>
            <select
              className="input-field w-32"
              value={taskTypeFilter}
              onChange={(e) => setTaskTypeFilter(e.target.value)}
            >
              {TASK_TYPE_FILTERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-500">优先级</label>
            <select
              className="input-field w-32"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
            >
              {PRIORITY_FILTERS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-sm text-slate-500">
            共 <span className="font-medium text-slate-700">{filteredTasks.length}</span> 个任务
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const ColumnIcon = col.icon
          const columnTasks = getColumnTasks(col.key)
          return (
            <div key={col.key} className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', col.color)} />
                  <ColumnIcon className="w-4 h-4 text-slate-500" />
                  <h3 className="font-medium text-slate-700">{col.title}</h3>
                  <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600">
                    {columnTasks.length}
                  </span>
                </div>
              </div>
              <div
                className={cn(
                  'flex flex-col gap-3 min-h-[400px] p-3 rounded-xl transition-colors',
                  'bg-slate-50/50 border border-dashed border-slate-200'
                )}
                onDragOver={(e) => e.preventDefault()}
              >
                {loading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div
                      key={i}
                      className="card p-4 space-y-3"
                    >
                      <div className="h-5 bg-slate-200 rounded animate-pulse w-3/4" />
                      <div className="h-4 bg-slate-100 rounded animate-pulse w-1/2" />
                      <div className="h-8 bg-slate-100 rounded animate-pulse" />
                    </div>
                  ))
                ) : columnTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Search className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-sm">暂无任务</p>
                  </div>
                ) : (
                  columnTasks.map(renderTaskCard)
                )}
              </div>
            </div>
          )
        })}
      </div>

      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="分配人员"
        size="sm"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleAssign}>
              <Users className="w-4 h-4 mr-1.5" />
              确认分配
            </button>
          </>
        }
      >
        {currentTask && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-slate-50 space-y-2">
              <div className="flex items-center gap-2">
                <UserRound className="w-4 h-4 text-primary-500" />
                <span className="font-medium text-slate-800">{currentTask.deceasedName}</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-500">
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {TASK_TYPE_MAP[currentTask.taskType]}
                </span>
                <StatusBadge status={currentTask.priority} />
              </div>
            </div>
            <div>
              <label className="label-field">选择防腐整容师</label>
              <div className="space-y-2">
                {EMBALMERS.map((embalmer) => (
                  <label
                    key={embalmer.id}
                    className={cn(
                      'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all',
                      selectedAssignee === embalmer.id
                        ? 'bg-primary-50 border-primary-300'
                        : 'bg-white border-slate-200 hover:border-primary-200 hover:bg-primary-50/50'
                    )}
                  >
                    <input
                      type="radio"
                      name="assignee"
                      className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                      checked={selectedAssignee === embalmer.id}
                      onChange={() => setSelectedAssignee(embalmer.id)}
                    />
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <Users className="w-4 h-4 text-primary-600" />
                      </div>
                      <span className="text-sm font-medium text-slate-700">{embalmer.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

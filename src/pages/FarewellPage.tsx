import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Building2,
  Users,
  Layers,
  Sparkles,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Plus,
  Video,
  Music,
  Flower2,
  Armchair,
  RefreshCw,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import {
  farewellApi,
  type FarewellHall,
  type FarewellReservation,
  type HallSuggestion,
} from '@/lib/api'
import { cn, showToast } from '@/lib/utils'

const START_HOUR = 8
const END_HOUR = 20
const TOTAL_HOURS = END_HOUR - START_HOUR

const facilityIcons: Record<string, typeof Video> = {
  音响: Music,
  电子屏: Video,
  鲜花台: Flower2,
  休息椅: Armchair,
}

function parseDateTime(dateStr: string): Date {
  return new Date(dateStr.replace(' ', 'T'))
}

function formatTime(dateStr: string): string {
  const date = parseDateTime(dateStr)
  return `${date.getHours().toString().padStart(2, '0')}:${date
    .getMinutes()
    .toString()
    .padStart(2, '0')}`
}

function parseTime(dateStr: string): number {
  const date = parseDateTime(dateStr)
  return date.getHours() + date.getMinutes() / 60
}

function getTodayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d
    .getDate()
    .toString()
    .padStart(2, '0')}`
}

export default function FarewellPage() {
  const [halls, setHalls] = useState<FarewellHall[]>([])
  const [reservations, setReservations] = useState<Record<string, FarewellReservation[]>>({})
  const [selectedDate, setSelectedDate] = useState(getTodayStr())
  const [selectedHall, setSelectedHall] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'timeline' | 'calendar'>('timeline')
  const [hoveredReservation, setHoveredReservation] = useState<FarewellReservation | null>(null)
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    hallId: '',
    attendeeCount: 50,
    durationMinutes: 60,
    preferredStartTime: '09:00',
  })
  const [suggestions, setSuggestions] = useState<HallSuggestion[]>([])
  const [selectedSuggestion, setSelectedSuggestion] = useState<{
    hallId: string
    startTime: string
    endTime: string
  } | null>(null)

  useEffect(() => {
    loadData()
  }, [selectedDate])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const hallsData = await farewellApi.getHalls()
      const validHalls = hallsData.filter(h => 
        h.name && h.capacity !== undefined && h.facilities && h.floor !== undefined && h.status
      )
      setHalls(validHalls)

      const schedules: Record<string, FarewellReservation[]> = {}
      await Promise.all(
        validHalls.map(async (hall) => {
          try {
            const res = await farewellApi.getHallSchedule(hall.id, { date: selectedDate })
            schedules[hall.id] = res
          } catch {
            schedules[hall.id] = []
          }
        })
      )
      setReservations(schedules)
      showToast('数据加载成功', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载数据失败'
      setError(message)
      showToast(message, 'error')
      console.error('加载数据失败:', err)
    } finally {
      setLoading(false)
    }
  }, [selectedDate])

  const handleGetSuggestions = async () => {
    if (!formData.attendeeCount || !formData.durationMinutes) return
    try {
      const preferredTime = `${selectedDate} ${formData.preferredStartTime}`
      const data = await farewellApi.getSuggestion({
        attendeeCount: formData.attendeeCount,
        durationMinutes: formData.durationMinutes,
        preferredTime,
      })
      setSuggestions(data)
      showToast('智能推荐完成', 'success')
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取推荐失败'
      showToast(message, 'error')
      console.error('获取推荐失败:', err)
    }
  }

  const handleSelectSuggestion = (hallId: string, startTime: string, endTime: string) => {
    setSelectedSuggestion({ hallId, startTime, endTime })
    setFormData((prev) => ({ ...prev, hallId, preferredStartTime: startTime.slice(11, 16) }))
  }

  const handleSubmit = async () => {
    if (!selectedSuggestion || !formData.hallId) return
    try {
      await farewellApi.createReservation({
        hallId: formData.hallId,
        receiptId: 'mock-receipt-' + Date.now(),
        deceasedName: '示例逝者',
        attendeeCount: formData.attendeeCount,
        durationMinutes: formData.durationMinutes,
        startTime: selectedSuggestion.startTime,
        endTime: selectedSuggestion.endTime,
        status: 'reserved',
        familyName: '示例家属',
        familyPhone: '13800138000',
      })
      setModalOpen(false)
      setSuggestions([])
      setSelectedSuggestion(null)
      showToast('预约创建成功', 'success')
      loadData()
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建预约失败'
      showToast(message, 'error')
      console.error('创建预约失败:', err)
    }
  }

  const hours = useMemo(() => {
    return Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i)
  }, [])

  return (
    <div className="space-y-4 animate-fade-in">
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-danger-700">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
          <button
            onClick={loadData}
            className="text-sm text-danger-600 hover:text-danger-800 font-medium"
          >
            重试
          </button>
        </div>
      )}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">告别厅管理</h1>
          <p className="text-sm text-slate-500 mt-1">管理厅室资源、查看预约排程、智能推荐时段</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={loadData}
            disabled={loading}
            className="btn-secondary"
          >
            <RefreshCw className={cn('w-4 h-4 mr-1.5', loading && 'animate-spin')} />
            刷新
          </button>
          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
            <button
              onClick={() => setViewMode('timeline')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'timeline' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <Clock className="w-4 h-4 inline mr-1" />
              时间轴
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                viewMode === 'calendar' ? 'bg-primary-600 text-white' : 'text-slate-600 hover:bg-slate-100'
              )}
            >
              <Calendar className="w-4 h-4 inline mr-1" />
              日历
            </button>
          </div>

          <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg">
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, -1))}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-l-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 text-sm font-medium text-slate-700">{selectedDate}</span>
            <button
              onClick={() => setSelectedDate(addDays(selectedDate, 1))}
              className="p-2 text-slate-500 hover:bg-slate-100 rounded-r-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button onClick={() => setModalOpen(true)} className="btn-primary">
            <Sparkles className="w-4 h-4 mr-1.5" />
            智能预约
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-3 space-y-3">
          <h2 className="section-title mb-2">
            <Building2 className="w-5 h-5 inline mr-2 text-primary-600" />
            厅室资源
          </h2>
          {halls.map((hall) => (
            <div
              key={hall.id}
              onClick={() => setSelectedHall(hall.id)}
              className={cn(
                'card-hover p-4 cursor-pointer',
                selectedHall === hall.id && 'ring-2 ring-primary-400 border-primary-300'
              )}
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-slate-800">{hall.name}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {hall.capacity}人
                    </span>
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5" />
                      {hall.floor}楼
                    </span>
                  </div>
                </div>
                <StatusBadge status={hall.status} />
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {hall.facilities.map((f) => {
                  const Icon = facilityIcons[f] || Building2
                  return (
                    <span
                      key={f}
                      className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary-50 text-primary-700 text-xs rounded-md border border-primary-100"
                    >
                      <Icon className="w-3 h-3" />
                      {f}
                    </span>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-9">
          <h2 className="section-title mb-2">
            <Clock className="w-5 h-5 inline mr-2 text-primary-600" />
            预约排程 {selectedDate}
          </h2>

          {viewMode === 'timeline' ? (
            <div className="card p-4 overflow-x-auto">
              <div className="min-w-[800px]">
                <div className="flex border-b border-slate-200 pb-2 mb-2">
                  <div className="w-28 flex-shrink-0 text-sm font-medium text-slate-500">厅室</div>
                  <div className="flex-1 flex">
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="flex-1 text-center text-xs font-medium text-slate-400"
                      >
                        {h.toString().padStart(2, '0')}:00
                      </div>
                    ))}
                  </div>
                </div>

                {halls.map((hall) => (
                  <div key={hall.id} className="flex items-center py-2 border-b border-slate-50 last:border-0">
                    <div className="w-28 flex-shrink-0 pr-3">
                      <div className="text-sm font-medium text-slate-700 truncate">{hall.name}</div>
                      <div className="text-xs text-slate-400">{hall.capacity}人 · {hall.floor}楼</div>
                    </div>
                    <div className="flex-1 relative h-10 bg-slate-50 rounded-lg border border-slate-100 flex">
                      {hours.map((h, idx) => (
                        <div
                          key={h}
                          className={cn(
                            'flex-1 border-slate-100',
                            idx < hours.length - 1 && 'border-r'
                          )}
                        />
                      ))}

                      {reservations[hall.id]?.map((res) => {
                        const startHour = parseTime(formatTime(res.startTime))
                        const endHour = parseTime(formatTime(res.endTime))
                        const left = ((startHour - START_HOUR) / TOTAL_HOURS) * 100
                        const width = ((endHour - startHour) / TOTAL_HOURS) * 100
                        const colorMap: Record<string, string> = {
                          reserved: 'bg-warning-500',
                          in_progress: 'bg-primary-500',
                          completed: 'bg-success-500',
                          cancelled: 'bg-slate-400',
                        }
                        return (
                          <div
                            key={res.id}
                            className={cn(
                              'absolute top-1 bottom-1 rounded-md cursor-pointer transition-all hover:opacity-80 hover:shadow-md',
                              colorMap[res.status] || 'bg-slate-400'
                            )}
                            style={{ left: `${left}%`, width: `${width}%` }}
                            onMouseEnter={(e) => {
                              setHoveredReservation(res)
                              const rect = e.currentTarget.getBoundingClientRect()
                              setHoverPos({ x: rect.left + rect.width / 2, y: rect.top - 8 })
                            }}
                            onMouseLeave={() => setHoveredReservation(null)}
                          >
                            <div className="h-full flex items-center justify-center px-1.5 overflow-hidden">
                              <span className="text-xs text-white font-medium truncate">
                                {res.deceasedName}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}

                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-warning-500" />
                    已预约
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-primary-500" />
                    进行中
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-success-500" />
                    已完成
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <span className="w-3 h-3 rounded-sm bg-slate-400" />
                    已取消
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="card p-6">
              <div className="text-center text-slate-500">
                <Calendar className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <p>日历视图开发中...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {hoveredReservation && (
        <div
          className="fixed z-50 card p-3 text-sm shadow-hover pointer-events-none animate-fade-in"
          style={{
            left: hoverPos.x,
            top: hoverPos.y,
            transform: 'translate(-50%, -100%)',
            minWidth: '200px',
          }}
        >
          <div className="font-semibold text-slate-800 mb-2">{hoveredReservation.deceasedName}</div>
          <div className="space-y-1 text-slate-600">
            <div>时间: {formatTime(hoveredReservation.startTime)} - {formatTime(hoveredReservation.endTime)}</div>
            <div>人数: {hoveredReservation.attendeeCount}人</div>
            <div>家属: {hoveredReservation.familyName}</div>
            <div>
              状态: <StatusBadge status={hoveredReservation.status} />
            </div>
          </div>
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSuggestions([])
          setSelectedSuggestion(null)
        }}
        title="智能预约告别厅"
        size="xl"
        footer={
          <>
            <button
              onClick={() => {
                setModalOpen(false)
                setSuggestions([])
                setSelectedSuggestion(null)
              }}
              className="btn-secondary"
            >
              <X className="w-4 h-4 mr-1" />
              取消
            </button>
            <button
              onClick={handleSubmit}
              disabled={!selectedSuggestion}
              className="btn-primary"
            >
              <Check className="w-4 h-4 mr-1" />
              确认预约
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label-field">选择厅室</label>
              <select
                className="input-field"
                value={formData.hallId}
                onChange={(e) => setFormData({ ...formData, hallId: e.target.value })}
              >
                <option value="">全部厅室（智能推荐）</option>
                {halls.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name} ({h.capacity}人)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">参加人数</label>
              <input
                type="number"
                className="input-field"
                value={formData.attendeeCount}
                onChange={(e) => setFormData({ ...formData, attendeeCount: Number(e.target.value) })}
                min={1}
              />
            </div>
            <div>
              <label className="label-field">使用时长（分钟）</label>
              <select
                className="input-field"
                value={formData.durationMinutes}
                onChange={(e) =>
                  setFormData({ ...formData, durationMinutes: Number(e.target.value) })
                }
              >
                <option value={30}>30 分钟</option>
                <option value={60}>60 分钟</option>
                <option value={90}>90 分钟</option>
                <option value={120}>120 分钟</option>
              </select>
            </div>
            <div>
              <label className="label-field">偏好时段</label>
              <input
                type="time"
                className="input-field"
                value={formData.preferredStartTime}
                onChange={(e) => setFormData({ ...formData, preferredStartTime: e.target.value })}
              />
            </div>
          </div>

          <div className="flex justify-center">
            <button onClick={handleGetSuggestions} className="btn-success">
              <Sparkles className="w-4 h-4 mr-1.5" />
              获取智能推荐
            </button>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-serif text-base font-semibold text-slate-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-warning-500" />
                推荐结果
              </h3>
              <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                {suggestions.map((s) => (
                  <div key={s.hallId} className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{s.hallName}</span>
                        <span className="ml-2 text-sm text-slate-500">容纳 {s.capacity} 人</span>
                      </div>
                    </div>

                    {s.suggestedSlots.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-success-700 mb-2 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          推荐可用时段（点击选择）
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.suggestedSlots.map((slot, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSuggestion(s.hallId, slot.startTime, slot.endTime)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                                selectedSuggestion?.hallId === s.hallId &&
                                selectedSuggestion?.startTime === slot.startTime
                                  ? 'bg-success-600 text-white border-success-600'
                                  : 'bg-success-50 text-success-700 border-success-200 hover:bg-success-100'
                              )}
                            >
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {s.alternativeSlots.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-primary-700 mb-2 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          相邻可选时段
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.alternativeSlots.map((slot, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSelectSuggestion(s.hallId, slot.startTime, slot.endTime)}
                              className={cn(
                                'px-3 py-1.5 rounded-lg text-sm font-medium transition-all border',
                                selectedSuggestion?.hallId === s.hallId &&
                                selectedSuggestion?.startTime === slot.startTime
                                  ? 'bg-primary-600 text-white border-primary-600'
                                  : 'bg-primary-50 text-primary-700 border-primary-200 hover:bg-primary-100'
                              )}
                            >
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {s.conflictSlots.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-danger-700 mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3.5 h-3.5" />
                          冲突时段
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {s.conflictSlots.map((slot, idx) => (
                            <span
                              key={idx}
                              className="px-3 py-1.5 rounded-lg text-sm font-medium bg-danger-50 text-danger-700 border border-danger-200 cursor-not-allowed"
                              title={slot.reason}
                            >
                              {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {suggestions.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <Plus className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="text-sm">填写需求后点击「获取智能推荐」</p>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}

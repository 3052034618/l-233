import { useState, useEffect, useMemo } from 'react'
import ReactECharts from 'echarts-for-react'
import { RefreshCw, Download, Building2, Flame, Truck, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import { reportApi, farewellApi, cremationApi, vehicleApi, type FarewellReservation, type CremationTask, type VehicleTask } from '@/lib/api'
import DataTable, { type Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils'

interface HallUsageData {
  hallId: string
  hallName: string
  capacity: number
  floor: number
  reservationCount: number
  usedMinutes: number
  totalAvailableMinutes: number
  usageRate: number
}

interface DailyStat {
  date: string
  total: number
  completed: number
  rate: number
  delayed?: number
}

const AREAS = ['全部区域', '东城区', '西城区', '朝阳区', '海淀区', '丰台区']

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function getDateRange(days: number): { start: string; end: string } {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - days + 1)
  return { start: formatDate(start), end: formatDate(end) }
}

export default function ReportsPage() {
  const { start, end } = getDateRange(14)
  const [startDate, setStartDate] = useState(start)
  const [endDate, setEndDate] = useState(end)
  const [area, setArea] = useState('全部区域')
  const [loading, setLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [hallUsage, setHallUsage] = useState<HallUsageData[]>([])
  const [cremationStats, setCremationStats] = useState<{ dailyStats: DailyStat[]; completionRate: number; total: number; completed: number }>({ dailyStats: [], completionRate: 0, total: 0, completed: 0 })
  const [vehicleStats, setVehicleStats] = useState<{ dailyStats: DailyStat[]; punctualityRate: number; total: number; onTime: number }>({ dailyStats: [], punctualityRate: 0, total: 0, onTime: 0 })
  const [reservations, setReservations] = useState<FarewellReservation[]>([])
  const [cremationTasks, setCremationTasks] = useState<CremationTask[]>([])
  const [vehicleTasks, setVehicleTasks] = useState<VehicleTask[]>([])
  const [activeTab, setActiveTab] = useState<'reservations' | 'cremation' | 'vehicle'>('reservations')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [hallRes, cremationRes, vehicleRes, farewellRes, cremationTaskRes, vehicleTaskRes] = await Promise.all([
        reportApi.getHallUsage({ startDate, endDate }) as any,
        reportApi.getCremationRate({ startDate, endDate }) as any,
        reportApi.getVehiclePunctuality({ startDate, endDate }) as any,
        farewellApi.getHalls(),
        cremationApi.getTasks(),
        vehicleApi.getList().then(() => vehicleApi.getList() as any),
      ])

      if (hallRes?.halls) {
        setHallUsage(hallRes.halls)
      }
      if (cremationRes) {
        setCremationStats({
          dailyStats: cremationRes.dailyStats || [],
          completionRate: cremationRes.completionRate || 0,
          total: cremationRes.total || 0,
          completed: cremationRes.completed || 0,
        })
      }
      if (vehicleRes) {
        setVehicleStats({
          dailyStats: vehicleRes.dailyStats || [],
          punctualityRate: vehicleRes.punctualityRate || 0,
          total: vehicleRes.total || 0,
          onTime: vehicleRes.onTime || 0,
        })
      }

      const allReservations: FarewellReservation[] = []
      for (const hall of farewellRes) {
        const hallReservations = await farewellApi.getHallSchedule(hall.id, { date: endDate })
        allReservations.push(...hallReservations)
      }
      setReservations(allReservations)
      setCremationTasks(cremationTaskRes)

      const allVehicleTasks: VehicleTask[] = []
      try {
        const vehicleTasksRes = await (reportApi as any).getDaily({ date: endDate })
        if (vehicleTasksRes?.data?.vehicleTasks) {
          setVehicleTasks(vehicleTasksRes.data.vehicleTasks)
        }
      } catch {
        setVehicleTasks(allVehicleTasks)
      }
    } catch (err) {
      console.error('获取报表数据失败:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const metrics = useMemo(() => {
    const avgUsage = hallUsage.length > 0 ? hallUsage.reduce((s, h) => s + h.usageRate, 0) / hallUsage.length : 0
    const avgServiceDuration = cremationTasks.length > 0 ? Math.round(cremationTasks.reduce((s, t) => s + t.estimatedDuration, 0) / cremationTasks.length) : 0
    return {
      hallUsage: { value: avgUsage.toFixed(1) + '%', change: 2.3 },
      cremationRate: { value: cremationStats.completionRate.toFixed(1) + '%', change: cremationStats.completionRate > 80 ? 5.1 : -1.2 },
      vehicleRate: { value: vehicleStats.punctualityRate.toFixed(1) + '%', change: vehicleStats.punctualityRate > 85 ? 3.7 : -2.1 },
      avgDuration: { value: avgServiceDuration + ' 分钟', change: avgServiceDuration < 60 ? -4.5 : 1.8 },
    }
  }, [hallUsage, cremationStats, vehicleStats, cremationTasks])

  const hallUsageChart = useMemo(() => ({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: hallUsage.map(h => h.hallName), axisLabel: { interval: 0, rotate: 0 } },
    yAxis: { type: 'value', max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'bar',
      data: hallUsage.map(h => h.usageRate),
      itemStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#0d9488' },
            { offset: 1, color: '#14b8a6' },
          ],
        },
        borderRadius: [6, 6, 0, 0],
      },
      barWidth: '45%',
      label: { show: true, position: 'top', formatter: '{c}%' },
    }],
  }), [hallUsage])

  const cremationTrendChart = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['火化完成率', '完成数量'], right: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: cremationStats.dailyStats.map(d => d.date.slice(5)), boundaryGap: false },
    yAxis: [
      { type: 'value', name: '完成率', max: 100, axisLabel: { formatter: '{value}%' } },
      { type: 'value', name: '数量' },
    ],
    series: [
      {
        name: '火化完成率', type: 'line', smooth: true, yAxisIndex: 0,
        data: cremationStats.dailyStats.map(d => d.rate),
        itemStyle: { color: '#d97706' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(217,119,6,0.25)' }, { offset: 1, color: 'rgba(217,119,6,0.02)' }] } },
      },
      {
        name: '完成数量', type: 'line', smooth: true, yAxisIndex: 1,
        data: cremationStats.dailyStats.map(d => d.completed),
        itemStyle: { color: '#64748b' },
      },
    ],
  }), [cremationStats])

  const businessPieChart = useMemo(() => {
    const data = [
      { name: '遗体接收', value: cremationStats.total },
      { name: '防腐整容', value: Math.round(cremationStats.total * 0.7) },
      { name: '告别厅', value: hallUsage.reduce((s, h) => s + h.reservationCount, 0) },
      { name: '火化服务', value: cremationStats.completed },
      { name: '骨灰存放', value: Math.round(cremationStats.total * 0.6) },
      { name: '灵车调度', value: vehicleStats.total },
    ]
    return {
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['60%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data,
        color: ['#0d9488', '#d97706', '#64748b', '#dc2626', '#7c3aed', '#0891b2'],
      }],
    }
  }, [cremationStats, hallUsage, vehicleStats])

  const vehicleTrendChart = useMemo(() => ({
    tooltip: { trigger: 'axis' },
    legend: { data: ['灵车准点率', '准点数量'], right: 10 },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: vehicleStats.dailyStats.map(d => d.date.slice(5)), boundaryGap: false },
    yAxis: [
      { type: 'value', name: '准点率', max: 100, axisLabel: { formatter: '{value}%' } },
      { type: 'value', name: '数量' },
    ],
    series: [
      {
        name: '灵车准点率', type: 'line', smooth: true, yAxisIndex: 0,
        data: vehicleStats.dailyStats.map(d => d.rate),
        itemStyle: { color: '#0891b2' },
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(8,145,178,0.25)' }, { offset: 1, color: 'rgba(8,145,178,0.02)' }] } },
      },
      {
        name: '准点数量', type: 'line', smooth: true, yAxisIndex: 1,
        data: vehicleStats.dailyStats.map(d => d.total - (d.delayed || 0)),
        itemStyle: { color: '#7c3aed' },
      },
    ],
  }), [vehicleStats])

  const handleExport = async () => {
    setExporting(true)
    try {
      const blob = await reportApi.exportExcel({
        type: 'daily',
        startDate,
        endDate,
        area: area === '全部区域' ? undefined : area,
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `运营报表_${startDate}_${endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      console.error('导出失败:', err)
    } finally {
      setExporting(false)
    }
  }

  const reservationColumns: Column<any>[] = [
    { key: 'hallName', title: '厅室名称', dataIndex: 'hallName' as const, sortable: true },
    { key: 'deceasedName', title: '逝者姓名', dataIndex: 'deceasedName' as const },
    { key: 'attendeeCount', title: '参加人数', dataIndex: 'attendeeCount' as const, sortable: true, align: 'center' as const },
    { key: 'durationMinutes', title: '时长(分钟)', dataIndex: 'durationMinutes' as const, sortable: true, align: 'center' as const },
    { key: 'startTime', title: '开始时间', dataIndex: 'startTime' as const, sortable: true },
    { key: 'status', title: '状态', dataIndex: 'status' as const, render: (r: any) => <StatusBadge status={r.status} /> },
  ]

  const cremationColumns: Column<any>[] = [
    { key: 'deceasedName', title: '逝者姓名', dataIndex: 'deceasedName' as const },
    { key: 'furnaceName', title: '火化炉', dataIndex: 'furnaceName' as const },
    { key: 'furnaceType', title: '炉型', dataIndex: 'furnaceType' as const },
    { key: 'queuePosition', title: '排队位置', dataIndex: 'queuePosition' as const, sortable: true, align: 'center' as const },
    { key: 'scheduledTime', title: '计划时间', dataIndex: 'scheduledTime' as const, sortable: true },
    { key: 'estimatedDuration', title: '预估时长', dataIndex: 'estimatedDuration' as const, align: 'center' as const },
    { key: 'status', title: '状态', dataIndex: 'status' as const, render: (r: any) => <StatusBadge status={r.status} /> },
  ]

  const vehicleColumns: Column<any>[] = [
    { key: 'vehiclePlate', title: '车牌号', dataIndex: 'vehiclePlate' as const },
    { key: 'driverName', title: '司机', dataIndex: 'driverName' as const },
    { key: 'taskType', title: '任务类型', dataIndex: 'taskType' as const, render: (r: any) => r.taskType === 'pickup' ? '接运' : r.taskType === 'transfer' ? '转运' : '送返' },
    { key: 'distanceKm', title: '距离(km)', dataIndex: 'distanceKm' as const, sortable: true, align: 'center' as const },
    { key: 'scheduledTime', title: '计划时间', dataIndex: 'scheduledTime' as const, sortable: true },
    { key: 'status', title: '状态', dataIndex: 'status' as const, render: (r: any) => <StatusBadge status={r.status} /> },
  ]

  const MetricCard = ({ icon: Icon, label, value, change, color }: { icon: any; label: string; value: string; change: number; color: string }) => (
    <div className="card-hover p-5">
      <div className="flex items-start justify-between">
        <div className={cn('p-2.5 rounded-xl', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className={cn('flex items-center gap-1 text-sm font-medium', change >= 0 ? 'text-success-600' : 'text-danger-600')}>
          {change >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {Math.abs(change)}%
        </div>
      </div>
      <div className="mt-4">
        <p className="text-sm text-slate-500">{label}</p>
        <p className="mt-1 font-serif text-3xl font-bold text-slate-800">{value}</p>
      </div>
    </div>
  )

  const tabs = [
    { key: 'reservations', label: '厅室预约明细' },
    { key: 'cremation', label: '火化任务明细' },
    { key: 'vehicle', label: '出车任务明细' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="page-title">运营报表中心</h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 whitespace-nowrap">日期范围:</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="input-field w-auto" />
            <span className="text-slate-400">至</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field w-auto" />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600 whitespace-nowrap">区域:</label>
            <select value={area} onChange={e => setArea(e.target.value)} className="input-field w-auto">
              {AREAS.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            <button onClick={fetchData} disabled={loading} className="btn-secondary">
              <RefreshCw className={cn('w-4 h-4 mr-2', loading && 'animate-spin')} />
              刷新
            </button>
            <button onClick={handleExport} disabled={exporting} className="btn-primary">
              <Download className={cn('w-4 h-4 mr-2', exporting && 'animate-spin')} />
              导出 Excel
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard icon={Building2} label="厅室使用率" value={metrics.hallUsage.value} change={metrics.hallUsage.change} color="bg-success-600" />
        <MetricCard icon={Flame} label="火化完成率" value={metrics.cremationRate.value} change={metrics.cremationRate.change} color="bg-warning-600" />
        <MetricCard icon={Truck} label="灵车准点率" value={metrics.vehicleRate.value} change={metrics.vehicleRate.change} color="bg-primary-600" />
        <MetricCard icon={Clock} label="平均服务时长" value={metrics.avgDuration.value} change={metrics.avgDuration.change} color="bg-danger-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="section-title mb-4">各告别厅使用率对比</h3>
          <ReactECharts option={hallUsageChart} style={{ height: 320 }} />
        </div>
        <div className="card p-5">
          <h3 className="section-title mb-4">近14天火化完成率趋势</h3>
          <ReactECharts option={cremationTrendChart} style={{ height: 320 }} />
        </div>
        <div className="card p-5">
          <h3 className="section-title mb-4">各业务类型占比</h3>
          <ReactECharts option={businessPieChart} style={{ height: 320 }} />
        </div>
        <div className="card p-5">
          <h3 className="section-title mb-4">灵车准点率趋势</h3>
          <ReactECharts option={vehicleTrendChart} style={{ height: 320 }} />
        </div>
      </div>

      <div className="card">
        <div className="flex border-b border-slate-100 px-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px',
                activeTab === tab.key
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === 'reservations' && (
            <DataTable columns={reservationColumns} data={reservations} loading={loading} rowKey="id" />
          )}
          {activeTab === 'cremation' && (
            <DataTable columns={cremationColumns} data={cremationTasks} loading={loading} rowKey="id" />
          )}
          {activeTab === 'vehicle' && (
            <DataTable columns={vehicleColumns} data={vehicleTasks} loading={loading} rowKey="id" />
          )}
        </div>
      </div>
    </div>
  )
}

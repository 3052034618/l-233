import { useState, useMemo } from 'react'
import {
  Car,
  MapPin,
  Calendar,
  Navigation,
  User,
  Fuel,
  Users,
  Clock,
  Star,
  Play,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Sparkles,
  Route,
  Truck,
} from 'lucide-react'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils'
import type { Vehicle, VehicleTask, DispatchSuggestion } from '@/lib/api'

const mockVehicles: Vehicle[] = [
  {
    id: 'v1',
    plateNo: '京A·88888',
    model: '奔驰威霆',
    type: 'luxury',
    capacity: 7,
    currentLoad: 0,
    fuelLevel: 85,
    status: 'idle',
    driverId: 'd1',
    driverName: '张师傅',
    currentLocation: { lat: 39.9042, lng: 116.4074, address: '殡仪馆停车场' },
  },
  {
    id: 'v2',
    plateNo: '京B·66666',
    model: '别克GL8',
    type: 'van',
    capacity: 7,
    currentLoad: 3,
    fuelLevel: 62,
    status: 'in_transit',
    driverId: 'd2',
    driverName: '李师傅',
    currentLocation: { lat: 39.9242, lng: 116.4374, address: '朝阳区东三环' },
  },
  {
    id: 'v3',
    plateNo: '京C·12345',
    model: '大众帕萨特',
    type: 'sedan',
    capacity: 5,
    currentLoad: 0,
    fuelLevel: 30,
    status: 'idle',
    driverId: 'd3',
    driverName: '王师傅',
    currentLocation: { lat: 39.8842, lng: 116.3674, address: '丰台区南四环' },
  },
  {
    id: 'v4',
    plateNo: '京D·99999',
    model: '丰田考斯特',
    type: 'van',
    capacity: 12,
    currentLoad: 0,
    fuelLevel: 15,
    status: 'maintenance',
    driverId: undefined,
    driverName: undefined,
    currentLocation: { lat: 39.9142, lng: 116.3974, address: '维修车间' },
  },
  {
    id: 'v5',
    plateNo: '京E·55555',
    model: '红旗H9',
    type: 'luxury',
    capacity: 5,
    currentLoad: 2,
    fuelLevel: 78,
    status: 'in_transit',
    driverId: 'd5',
    driverName: '赵师傅',
    currentLocation: { lat: 39.9442, lng: 116.4674, address: '朝阳区望京' },
  },
  {
    id: 'v6',
    plateNo: '京F·33333',
    model: '奥迪A6L',
    type: 'sedan',
    capacity: 5,
    currentLoad: 0,
    fuelLevel: 92,
    status: 'idle',
    driverId: 'd6',
    driverName: '刘师傅',
    currentLocation: { lat: 39.8742, lng: 116.4174, address: '西城区西单' },
  },
]

const mockTasks: VehicleTask[] = [
  {
    id: 't1',
    vehicleId: 'v2',
    vehiclePlate: '京B·66666',
    driverId: 'd2',
    driverName: '李师傅',
    receiptId: 'r1',
    taskType: 'pickup',
    origin: { address: '协和医院', lat: 39.9142, lng: 116.4174 },
    destination: { address: '殡仪馆', lat: 39.9042, lng: 116.4074 },
    scheduledTime: '2026-06-14 14:30',
    estimatedDuration: 45,
    distanceKm: 8.5,
    status: 'in_progress',
    route: [
      { lat: 39.9142, lng: 116.4174 },
      { lat: 39.92, lng: 116.42 },
      { lat: 39.915, lng: 116.41 },
      { lat: 39.9042, lng: 116.4074 },
    ],
    trackLog: [],
  },
  {
    id: 't2',
    vehicleId: 'v5',
    vehiclePlate: '京E·55555',
    driverId: 'd5',
    driverName: '赵师傅',
    receiptId: 'r2',
    taskType: 'transfer',
    origin: { address: '望京医院', lat: 39.9942, lng: 116.4774 },
    destination: { address: '殡仪馆', lat: 39.9042, lng: 116.4074 },
    scheduledTime: '2026-06-14 15:00',
    estimatedDuration: 60,
    distanceKm: 15.2,
    status: 'pending',
    route: [],
    trackLog: [],
  },
  {
    id: 't3',
    vehicleId: 'v1',
    vehiclePlate: '京A·88888',
    driverId: 'd1',
    driverName: '张师傅',
    receiptId: 'r3',
    taskType: 'delivery',
    origin: { address: '殡仪馆', lat: 39.9042, lng: 116.4074 },
    destination: { address: '万安公墓', lat: 39.9842, lng: 116.2974 },
    scheduledTime: '2026-06-14 10:00',
    estimatedDuration: 50,
    distanceKm: 12.8,
    status: 'completed',
    route: [],
    trackLog: [],
  },
  {
    id: 't4',
    vehicleId: 'v3',
    vehiclePlate: '京C·12345',
    driverId: 'd3',
    driverName: '王师傅',
    receiptId: 'r4',
    taskType: 'pickup',
    origin: { address: '友谊医院', lat: 39.8742, lng: 116.3874 },
    destination: { address: '殡仪馆', lat: 39.9042, lng: 116.4074 },
    scheduledTime: '2026-06-14 09:00',
    estimatedDuration: 30,
    distanceKm: 5.3,
    status: 'delayed',
    route: [],
    trackLog: [],
  },
]

const taskTypeLabels: Record<string, string> = {
  pickup: '接运',
  transfer: '转运',
  delivery: '送返',
}

const vehicleTypeLabels: Record<string, string> = {
  sedan: '轿车',
  van: '商务车',
  luxury: '豪华车',
}

export default function VehiclePage() {
  const [origin, setOrigin] = useState('')
  const [destination, setDestination] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')

  const dispatchSuggestions = useMemo<DispatchSuggestion[]>(() => {
    const idleVehicles = mockVehicles.filter((v) => v.status === 'idle')
    return idleVehicles
      .map((v, idx) => ({
        vehicleId: v.id,
        vehiclePlate: v.plateNo,
        driverName: v.driverName || '未分配',
        distanceKm: +(2 + idx * 3.5 + Math.random() * 2).toFixed(1),
        estimatedArrival: `预计 ${10 + idx * 8} 分钟后到达`,
        currentLoad: v.currentLoad,
        score: Math.floor(95 - idx * 6 + Math.random() * 5),
      }))
      .sort((a, b) => b.score - a.score)
  }, [])

  const vehicles = mockVehicles
  const tasks = mockTasks

  const mapWidth = 800
  const mapHeight = 400
  const mapPadding = 40

  const latToY = (lat: number) => {
    const minLat = 39.85
    const maxLat = 40.02
    return (
      mapHeight -
      mapPadding -
      ((lat - minLat) / (maxLat - minLat)) * (mapHeight - mapPadding * 2)
    )
  }

  const lngToX = (lng: number) => {
    const minLng = 116.28
    const maxLng = 116.5
    return (
      mapPadding +
      ((lng - minLng) / (maxLng - minLng)) * (mapWidth - mapPadding * 2)
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <Car className="w-7 h-7 text-primary-600" />
          灵车调度管理
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            className={cn(
              'card-hover p-4 transition-all duration-150',
              vehicle.status === 'maintenance' && 'opacity-60'
            )}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                <Truck className="w-5 h-5 text-primary-700" />
              </div>
              <StatusBadge status={vehicle.status} />
            </div>

            <div className="font-bold text-slate-800 mb-1">{vehicle.plateNo}</div>
            <div className="text-xs text-slate-500 mb-3">
              {vehicle.model} · {vehicleTypeLabels[vehicle.type]}
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-600">
                <User className="w-3 h-3 text-slate-400" />
                <span>{vehicle.driverName || '未分配司机'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Users className="w-3 h-3 text-slate-400" />
                <span>
                  负载 {vehicle.currentLoad}/{vehicle.capacity}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="flex items-center gap-1 text-slate-500">
                  <Fuel className="w-3 h-3" />
                  油量
                </span>
                <span
                  className={cn(
                    'font-medium',
                    vehicle.fuelLevel < 20
                      ? 'text-danger-600'
                      : vehicle.fuelLevel < 40
                      ? 'text-warning-600'
                      : 'text-success-600'
                  )}
                >
                  {vehicle.fuelLevel}%
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-300',
                    vehicle.fuelLevel < 20
                      ? 'bg-danger-500'
                      : vehicle.fuelLevel < 40
                      ? 'bg-warning-500'
                      : 'bg-success-500'
                  )}
                  style={{ width: `${vehicle.fuelLevel}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-4">
          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              智能调度
            </h3>

            <div className="space-y-4">
              <div>
                <label className="label-field flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-danger-500" />
                  出发地
                </label>
                <input
                  type="text"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  placeholder="请输入出发地址"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-field flex items-center gap-1">
                  <Navigation className="w-3 h-3 text-success-500" />
                  目的地
                </label>
                <input
                  type="text"
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="请输入目的地址"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-field flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  预约时间
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="input-field"
                />
              </div>

              <button className="btn-primary w-full">
                <Sparkles className="w-4 h-4 mr-1" />
                智能匹配车辆
              </button>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-warning-500" />
              调度推荐
              <span className="ml-auto text-xs font-normal text-slate-400">
                按综合评分排序
              </span>
            </h3>

            <div className="space-y-3">
              {dispatchSuggestions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  暂无可用车辆推荐
                </div>
              ) : (
                dispatchSuggestions.map((suggestion, idx) => (
                  <div
                    key={suggestion.vehicleId}
                    className={cn(
                      'p-4 rounded-lg border transition-all duration-150 cursor-pointer group',
                      idx === 0
                        ? 'bg-primary-50 border-primary-200 hover:bg-primary-100'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold',
                            idx === 0
                              ? 'bg-warning-500 text-white'
                              : 'bg-slate-200 text-slate-600'
                          )}
                        >
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-semibold text-slate-800">
                            {suggestion.vehiclePlate}
                          </div>
                          <div className="text-xs text-slate-500">
                            司机：{suggestion.driverName}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            'text-lg font-bold',
                            idx === 0 ? 'text-primary-700' : 'text-slate-700'
                          )}
                        >
                          {suggestion.score}
                          <span className="text-xs font-normal ml-0.5">分</span>
                        </div>
                        <div className="flex items-center gap-0.5 justify-end">
                          {Array.from({ length: 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={cn(
                                'w-3 h-3',
                                i < Math.ceil(suggestion.score / 20)
                                  ? 'text-warning-500 fill-warning-500'
                                  : 'text-slate-300'
                              )}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-500">
                      <div className="flex items-center gap-1">
                        <Route className="w-3 h-3" />
                        {suggestion.distanceKm}km
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {suggestion.estimatedArrival.replace('预计 ', '').replace(' 分钟后到达', '')}分
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        负载 {suggestion.currentLoad}
                      </div>
                    </div>

                    {idx === 0 && (
                      <div className="mt-3 pt-3 border-t border-primary-200 flex items-center justify-between">
                        <span className="text-xs text-primary-600 font-medium flex items-center gap-1">
                          <Sparkles className="w-3 h-3" />
                          最佳推荐
                        </span>
                        <button className="text-xs text-primary-700 font-medium flex items-center gap-0.5 hover:underline">
                          派单 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="xl:col-span-7 space-y-4">
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="section-title mb-0 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                实时车辆位置
              </h3>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-success-500" />
                  空闲
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-warning-500" />
                  运输中
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-full bg-danger-500" />
                  维护中
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden"
              style={{
                background:
                  'linear-gradient(135deg, #e0f2fe 0%, #f0fdfa 25%, #fef3c7 50%, #fce7f3 75%, #e0e7ff 100%)',
                height: `${mapHeight}px`,
              }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(rgba(148, 163, 184, 0.3) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(148, 163, 184, 0.3) 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />

              <svg
                width={mapWidth}
                height={mapHeight}
                className="absolute inset-0"
                viewBox={`0 0 ${mapWidth} ${mapHeight}`}
              >
                <defs>
                  <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#0d9488" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {tasks
                  .filter((t) => t.status === 'in_progress')
                  .map((task) => (
                    <polyline
                      key={task.id}
                      points={task.route
                        .map((p) => `${lngToX(p.lng)},${latToY(p.lat)}`)
                        .join(' ')}
                      fill="none"
                      stroke="url(#routeGradient)"
                      strokeWidth="3"
                      strokeDasharray="8,4"
                      strokeLinecap="round"
                    />
                  ))}
              </svg>

              {vehicles.map((vehicle) => {
                const x = lngToX(vehicle.currentLocation.lng)
                const y = latToY(vehicle.currentLocation.lat)
                const colorMap = {
                  idle: 'bg-success-500',
                  in_transit: 'bg-warning-500',
                  maintenance: 'bg-danger-500',
                }
                const ringColorMap = {
                  idle: 'ring-success-300',
                  in_transit: 'ring-warning-300',
                  maintenance: 'ring-danger-300',
                }
                return (
                  <div
                    key={vehicle.id}
                    className="absolute"
                    style={{
                      left: x,
                      top: y,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    {vehicle.status !== 'maintenance' && (
                      <div
                        className={cn(
                          'absolute inset-0 w-8 h-8 -m-1 rounded-full ring-4 animate-ping opacity-40',
                          ringColorMap[vehicle.status]
                        )}
                      />
                    )}
                    <div
                      className={cn(
                        'relative w-6 h-6 rounded-full flex items-center justify-center shadow-lg ring-2 ring-white',
                        colorMap[vehicle.status]
                      )}
                      title={`${vehicle.plateNo} - ${vehicle.currentLocation.address}`}
                    >
                      <Car className="w-3.5 h-3.5 text-white" />
                    </div>
                  </div>
                )
              })}

              <div className="absolute bottom-3 left-3 text-xs text-slate-500 bg-white/80 backdrop-blur-sm px-2 py-1 rounded">
                <MapPin className="w-3 h-3 inline mr-1" />
                实时地图 · {vehicles.filter((v) => v.status === 'in_transit').length} 辆运行中
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2 mb-4">
              <CheckCircle className="w-4 h-4" />
              出车任务列表
            </h3>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                      任务类型
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                      路线
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                      司机
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                      预约时间
                    </th>
                    <th className="text-left py-3 px-3 text-xs font-medium text-slate-500">
                      状态
                    </th>
                    <th className="text-right py-3 px-3 text-xs font-medium text-slate-500">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map((task) => (
                    <tr
                      key={task.id}
                      className="border-b border-slate-50 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3 px-3">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium',
                            task.taskType === 'pickup' &&
                              'bg-primary-50 text-primary-700 border border-primary-100',
                            task.taskType === 'transfer' &&
                              'bg-warning-50 text-warning-700 border border-warning-100',
                            task.taskType === 'delivery' &&
                              'bg-success-50 text-success-700 border border-success-100'
                          )}
                        >
                          {task.taskType === 'pickup' && (
                            <MapPin className="w-3 h-3" />
                          )}
                          {task.taskType === 'transfer' && (
                            <Route className="w-3 h-3" />
                          )}
                          {task.taskType === 'delivery' && (
                            <Navigation className="w-3 h-3" />
                          )}
                          {taskTypeLabels[task.taskType]}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <div className="text-sm">
                          <div className="flex items-center gap-1 text-slate-600">
                            <MapPin className="w-3 h-3 text-danger-500 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {task.origin.address}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-600 mt-0.5">
                            <Navigation className="w-3 h-3 text-success-500 flex-shrink-0" />
                            <span className="truncate max-w-[100px]">
                              {task.destination.address}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5 text-sm text-slate-700">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {task.driverName}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-sm text-slate-600">
                        {task.scheduledTime}
                      </td>
                      <td className="py-3 px-3">
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="py-3 px-3 text-right">
                        {task.status === 'pending' && (
                          <button className="btn-primary !py-1.5 !px-3 text-xs">
                            <Play className="w-3 h-3 mr-1" />
                            出发
                          </button>
                        )}
                        {task.status === 'in_progress' && (
                          <button className="btn-secondary !py-1.5 !px-3 text-xs">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            完成
                          </button>
                        )}
                        {task.status === 'delayed' && (
                          <button className="btn-warning !py-1.5 !px-3 text-xs">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            催单
                          </button>
                        )}
                        {task.status === 'completed' && (
                          <span className="text-xs text-slate-400">已完成</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

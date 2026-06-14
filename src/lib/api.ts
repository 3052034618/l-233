import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'

export interface LoginRequest {
  username: string
  password: string
}

export interface UserInfo {
  id: string
  name: string
  role: 'admin' | 'dispatcher' | 'embalmer' | 'cremator' | 'driver' | 'family'
  avatar?: string
}

export interface LoginResponse {
  token: string
  user: UserInfo
}

export interface DeceasedInfo {
  id?: string
  name: string
  gender: 'male' | 'female'
  age: number
  idCard: string
  dateOfDeath: string
  causeOfDeath: string
  deathCertificateNo: string
  policeRecordNo: string
  status: 'pending' | 'verified' | 'rejected' | 'processing'
  familyName: string
  familyPhone: string
  familyRelation: string
  receiptTime?: string
  verificationResult?: {
    deathCertValid: boolean
    policeRecordValid: boolean
    issues: string[]
  }
  createdAt?: string
  updatedAt?: string
}

export interface EmbalmingTask {
  id: string
  receiptId: string
  deceasedName: string
  bodyCondition: 'normal' | 'damaged' | 'advanced_decay'
  taskType: 'preservation' | 'cosmetics' | 'both'
  assigneeId?: string
  assigneeName?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  estimatedDuration: number
  startTime?: string
  endTime?: string
  notes?: string
  createdAt?: string
}

export interface FarewellHall {
  id: string
  name: string
  capacity: number
  facilities: string[]
  floor: number
  status: 'available' | 'maintenance'
}

export interface FarewellReservation {
  id?: string
  hallId: string
  hallName?: string
  receiptId: string
  deceasedName: string
  attendeeCount: number
  durationMinutes: number
  startTime: string
  endTime: string
  status: 'reserved' | 'in_progress' | 'completed' | 'cancelled'
  familyName: string
  familyPhone: string
  createdAt?: string
}

export interface HallSuggestion {
  hallId: string
  hallName: string
  capacity: number
  suggestedSlots: { startTime: string; endTime: string }[]
  conflictSlots: { startTime: string; endTime: string; reason: string }[]
  alternativeSlots: { startTime: string; endTime: string }[]
}

export interface CremationFurnace {
  id: string
  name: string
  type: 'standard' | 'premium' | 'environmental'
  fuelType: 'gas' | 'oil' | 'electric'
  fuelLevel: number
  status: 'idle' | 'running' | 'maintenance'
  currentTaskId?: string
  estimatedFinishTime?: string
}

export interface CremationTask {
  id: string
  receiptId: string
  deceasedName: string
  furnaceId?: string
  furnaceName?: string
  furnaceType: string
  queuePosition: number
  scheduledTime: string
  startTime?: string
  endTime?: string
  status: 'queued' | 'pending' | 'in_progress' | 'completed' | 'overdue'
  estimatedDuration: number
  overdue: boolean
  createdAt?: string
}

export interface StorageNiche {
  id: string
  area: string
  row: number
  col: number
  level: number
  type: 'single' | 'double' | 'family'
  price: number
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
}

export interface NicheMatchResult extends StorageNiche {
  remainingYears: number
  score?: number
  matchReasons?: string[]
}

export interface StorageContract {
  id?: string
  nicheId: string
  nicheInfo?: { area: string; row: number; col: number; level: number; type: string }
  receiptId: string
  deceasedName: string
  familyName: string
  familyPhone: string
  familyIdCard: string
  startDate: string
  endDate: string
  years: number
  status: 'active' | 'expired' | 'transferred'
  certificateNo: string
  qrCode?: string
  createdAt?: string
}

export interface CertificateData {
  certificateNo: string
  qrCode: string
  deceasedName: string
  nicheInfo: {
    area: string
    row: number
    col: number
    level: number
    type: string
  }
}

export interface DriverInfo {
  id: string
  name: string
  phone?: string
}

export interface Vehicle {
  id: string
  plateNo: string
  model: string
  type: 'sedan' | 'van' | 'luxury'
  capacity: number
  currentLoad: number
  fuelLevel: number
  status: 'idle' | 'in_transit' | 'maintenance'
  driverId?: string
  driverName?: string
  currentLocation: { lat: number; lng: number; address: string }
  hasRealLocation?: boolean
}

export interface VehicleTask {
  id?: string
  vehicleId: string
  vehiclePlate?: string
  driverId: string
  driverName?: string
  receiptId?: string
  taskType: 'pickup' | 'transfer' | 'delivery'
  origin: { address: string; lat: number; lng: number }
  destination: { address: string; lat: number; lng: number }
  scheduledTime: string
  estimatedDuration: number
  distanceKm: number
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  route: { lat: number; lng: number }[]
  currentPosition?: { lat: number; lng: number; timestamp: string }
  trackLog: { lat: number; lng: number; timestamp: string }[]
  createdAt?: string
}

export interface DispatchSuggestion {
  vehicleId: string
  vehiclePlate: string
  driverName: string
  distanceKm: number
  estimatedArrival: string
  currentLoad: number
  score: number
}

export interface DailyReport {
  date: string
  area?: string
  statistics: {
    receiptCount: number
    embalmingCompleted: number
    embalmingTotal: number
    farewellHalls: { hallId: string; hallName: string; usageRate: number; reservations: number }[]
    cremationTotal: number
    cremationCompleted: number
    cremationRate: number
    vehicleTotal: number
    vehicleOnTime: number
    vehicleOnTimeRate: number
    storageNew: number
  }
}

export interface Notification {
  id: string
  type: 'receipt' | 'embalming' | 'farewell' | 'cremation' | 'storage' | 'vehicle' | 'system'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  title: string
  content: string
  relatedId?: string
  relatedType?: string
  recipientId: string
  recipientRole: string
  read: boolean
  createdAt: string
}

export interface ApiResponse<T> {
  success: boolean
  message: string
  data: T
}

const TOKEN_KEY = 'auth_token'

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY)
}

const setToken = (token: string): void => {
  localStorage.setItem(TOKEN_KEY, token)
}

const removeToken = (): void => {
  localStorage.removeItem(TOKEN_KEY)
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

function convertKeysToCamelCase<T>(obj: unknown): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeysToCamelCase(item)) as unknown as T
  }
  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {}
    for (const key in obj as Record<string, unknown>) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const camelKey = toCamelCase(key)
        const value = (obj as Record<string, unknown>)[key]
        if (key === 'verification_result' && typeof value === 'string') {
          try {
            result[camelKey] = JSON.parse(value)
          } catch {
            result[camelKey] = undefined
          }
        } else if (key === 'facilities' && typeof value === 'string') {
          try {
            result[camelKey] = JSON.parse(value)
          } catch {
            result[camelKey] = []
          }
        } else if (key === 'route' && typeof value === 'string') {
          try {
            result[camelKey] = JSON.parse(value)
          } catch {
            result[camelKey] = []
          }
        } else if (key === 'track_log' && typeof value === 'string') {
          try {
            result[camelKey] = JSON.parse(value)
          } catch {
            result[camelKey] = []
          }
        } else if (key === 'data' && typeof value === 'string') {
          try {
            result[camelKey] = JSON.parse(value)
          } catch {
            result[camelKey] = value
          }
        } else if (key === 'is_read') {
          result[camelKey] = value === 1 || value === true
        } else if (key === 'overdue') {
          result[camelKey] = value === 1 || value === true
        } else if (key === 'current_lat' || key === 'current_lng' || key === 'current_address') {
          const locationKey = key === 'current_lat' ? 'lat' : key === 'current_lng' ? 'lng' : 'address'
          if (!result['currentLocation']) {
            result['currentLocation'] = {} as Record<string, unknown>
          }
          ;(result['currentLocation'] as Record<string, unknown>)[locationKey] = value
        } else if (key === 'origin_address' || key === 'origin_lat' || key === 'origin_lng') {
          const originKey = key === 'origin_address' ? 'address' : key === 'origin_lat' ? 'lat' : 'lng'
          if (!result['origin']) {
            result['origin'] = {} as Record<string, unknown>
          }
          ;(result['origin'] as Record<string, unknown>)[originKey] = value
        } else if (key === 'dest_address' || key === 'dest_lat' || key === 'dest_lng') {
          const destKey = key === 'dest_address' ? 'address' : key === 'dest_lat' ? 'lat' : 'lng'
          if (!result['destination']) {
            result['destination'] = {} as Record<string, unknown>
          }
          ;(result['destination'] as Record<string, unknown>)[destKey] = value
        } else if (key === 'row_num' || key === 'col_num' || key === 'level_num') {
          const numKey = key === 'row_num' ? 'row' : key === 'col_num' ? 'col' : 'level'
          result[numKey] = value
        } else {
          result[camelKey] = convertKeysToCamelCase(value)
        }
      }
    }
    return result as T
  }
  return obj as T
}

function transformReceiptResponse(data: unknown): DeceasedInfo {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: (converted.id || converted.receiptId) as string,
    name: (converted.name || converted.deceasedName) as string,
    gender: (converted.gender || converted.deceasedGender) as 'male' | 'female',
    age: (converted.age || converted.deceasedAge) as number,
    idCard: (converted.idCard || converted.deceasedIdCard) as string,
    dateOfDeath: (converted.dateOfDeath) as string,
    causeOfDeath: (converted.causeOfDeath) as string,
    deathCertificateNo: (converted.deathCertificateNo) as string,
    policeRecordNo: (converted.policeRecordNo) as string,
    status: converted.status as 'pending' | 'verified' | 'rejected' | 'processing',
    familyName: converted.familyName as string,
    familyPhone: converted.familyPhone as string,
    familyRelation: converted.familyRelation as string,
    receiptTime: converted.receiptTime as string,
    verificationResult: converted.verificationResult as DeceasedInfo['verificationResult'],
    createdAt: converted.createdAt as string,
    updatedAt: converted.updatedAt as string,
  }
}

function transformEmbalmingTaskResponse(data: unknown): EmbalmingTask {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    receiptId: converted.receiptId as string,
    deceasedName: converted.deceasedName as string,
    bodyCondition: converted.bodyCondition as 'normal' | 'damaged' | 'advanced_decay',
    taskType: converted.taskType as 'preservation' | 'cosmetics' | 'both',
    assigneeId: converted.assigneeId as string,
    assigneeName: converted.assigneeName as string,
    status: converted.status as 'pending' | 'in_progress' | 'completed',
    priority: converted.priority as 'low' | 'normal' | 'high' | 'urgent',
    estimatedDuration: converted.estimatedDuration as number,
    startTime: converted.startTime as string,
    endTime: converted.endTime as string,
    notes: converted.notes as string,
    createdAt: converted.createdAt as string,
  }
}

function transformFarewellHallResponse(data: unknown): FarewellHall {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    name: converted.name as string,
    capacity: converted.capacity as number,
    facilities: converted.facilities as string[],
    floor: converted.floor as number,
    status: converted.status as 'available' | 'maintenance',
  }
}

function transformFarewellReservationResponse(data: unknown): FarewellReservation {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    hallId: converted.hallId as string,
    hallName: converted.hallName as string,
    receiptId: converted.receiptId as string,
    deceasedName: converted.deceasedName as string,
    attendeeCount: converted.attendeeCount as number,
    durationMinutes: converted.durationMinutes as number,
    startTime: converted.startTime as string,
    endTime: converted.endTime as string,
    status: converted.status as 'reserved' | 'in_progress' | 'completed' | 'cancelled',
    familyName: converted.familyName as string,
    familyPhone: converted.familyPhone as string,
    createdAt: converted.createdAt as string,
  }
}

function transformHallSuggestionResponse(data: unknown): HallSuggestion {
  return convertKeysToCamelCase<HallSuggestion>(data)
}

function transformCremationFurnaceResponse(data: unknown): CremationFurnace {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    name: converted.name as string,
    type: converted.type as 'standard' | 'premium' | 'environmental',
    fuelType: converted.fuelType as 'gas' | 'oil' | 'electric',
    fuelLevel: converted.fuelLevel as number,
    status: converted.status as 'idle' | 'running' | 'maintenance',
    currentTaskId: converted.currentTaskId as string,
    estimatedFinishTime: converted.estimatedFinishTime as string,
  }
}

function transformCremationTaskResponse(data: unknown): CremationTask {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    receiptId: converted.receiptId as string,
    deceasedName: converted.deceasedName as string,
    furnaceId: converted.furnaceId as string,
    furnaceName: converted.furnaceName as string,
    furnaceType: converted.furnaceType as string,
    queuePosition: converted.queuePosition as number,
    scheduledTime: converted.scheduledTime as string,
    startTime: converted.startTime as string,
    endTime: converted.endTime as string,
    status: converted.status as 'queued' | 'pending' | 'in_progress' | 'completed' | 'overdue',
    estimatedDuration: converted.estimatedDuration as number,
    overdue: converted.overdue as boolean,
    createdAt: converted.createdAt as string,
  }
}

function transformStorageNicheResponse(data: unknown): StorageNiche {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    area: converted.area as string,
    row: converted.row as number,
    col: converted.col as number,
    level: converted.level as number,
    type: converted.type as 'single' | 'double' | 'family',
    price: converted.price as number,
    status: converted.status as 'available' | 'occupied' | 'reserved' | 'maintenance',
  }
}

function transformNicheMatchResultResponse(data: unknown): NicheMatchResult {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  const niche = transformStorageNicheResponse(converted.niche || converted)
  return {
    ...niche,
    remainingYears: (converted.remainingYears as number) || 20,
    score: (converted.score ?? converted.matchScore) as number,
    matchReasons: (converted.matchReasons as string[]) || [],
  }
}

function transformStorageContractResponse(data: unknown): StorageContract {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    nicheId: converted.nicheId as string,
    nicheInfo: converted.nicheInfo as StorageContract['nicheInfo'],
    receiptId: converted.receiptId as string,
    deceasedName: converted.deceasedName as string,
    familyName: converted.familyName as string,
    familyPhone: converted.familyPhone as string,
    familyIdCard: converted.familyIdCard as string,
    startDate: converted.startDate as string,
    endDate: converted.endDate as string,
    years: converted.years as number,
    status: converted.status as 'active' | 'expired' | 'transferred',
    certificateNo: converted.certificateNo as string,
    qrCode: converted.qrCode as string,
    createdAt: converted.createdAt as string,
  }
}

function transformVehicleResponse(data: unknown): Vehicle {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  const loc = (converted.currentLocation || {}) as Record<string, unknown>
  const hasRealLocation = loc.lat != null && loc.lng != null
  const defaultLat = 39.9042
  const defaultLng = 116.4074
  return {
    id: converted.id as string,
    plateNo: converted.plateNo as string,
    model: converted.model as string,
    type: converted.type as 'sedan' | 'van' | 'luxury',
    capacity: converted.capacity as number,
    currentLoad: converted.currentLoad as number,
    fuelLevel: converted.fuelLevel as number,
    status: converted.status as 'idle' | 'in_transit' | 'maintenance',
    driverId: converted.driverId as string,
    driverName: converted.driverName as string,
    currentLocation: {
      lat: (loc.lat as number) ?? defaultLat,
      lng: (loc.lng as number) ?? defaultLng,
      address: (loc.address as string) || (hasRealLocation ? '当前位置' : '殡仪馆（默认）'),
    },
    hasRealLocation,
  }
}

function transformVehicleTaskResponse(data: unknown): VehicleTask {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)

  let origin = converted.origin as VehicleTask['origin']
  if (!origin && (converted.originAddress || converted.originLat || converted.originLng)) {
    origin = {
      address: (converted.originAddress as string) || '',
      lat: (converted.originLat as number) || 0,
      lng: (converted.originLng as number) || 0,
    }
  }

  let destination = converted.destination as VehicleTask['destination']
  if (!destination && (converted.destAddress || converted.destLat || converted.destLng)) {
    destination = {
      address: (converted.destAddress as string) || '',
      lat: (converted.destLat as number) || 0,
      lng: (converted.destLng as number) || 0,
    }
  }

  return {
    id: converted.id as string,
    vehicleId: converted.vehicleId as string,
    vehiclePlate: converted.vehiclePlate as string,
    driverId: converted.driverId as string,
    driverName: converted.driverName as string,
    receiptId: converted.receiptId as string,
    taskType: converted.taskType as 'pickup' | 'transfer' | 'delivery',
    origin,
    destination,
    scheduledTime: converted.scheduledTime as string,
    estimatedDuration: converted.estimatedDuration as number,
    distanceKm: converted.distanceKm as number,
    status: converted.status as 'pending' | 'in_progress' | 'completed' | 'delayed',
    route: converted.route as VehicleTask['route'],
    currentPosition: converted.currentPosition as VehicleTask['currentPosition'],
    trackLog: converted.trackLog as VehicleTask['trackLog'],
    createdAt: converted.createdAt as string,
  }
}

function transformDispatchSuggestionResponse(data: unknown): DispatchSuggestion {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    vehicleId: converted.id as string,
    vehiclePlate: converted.plateNo as string,
    driverName: (converted.driverName as string) || '',
    distanceKm: (converted.distanceToOrigin ?? converted.distanceKm) as number,
    estimatedArrival: (converted.estimatedArrival as string) || '',
    currentLoad: converted.currentLoad as number,
    score: converted.score as number,
  }
}

function transformDailyReportResponse(data: unknown): DailyReport {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  const summary = (converted.summary || {}) as Record<string, unknown>
  const farewellReservations = (converted.farewellReservations || []) as unknown[]
  const cremationTasks = (converted.cremationTasks || []) as unknown[]
  const vehicleTasks = (converted.vehicleTasks || []) as unknown[]

  const farewellHalls: DailyReport['statistics']['farewellHalls'] = []
  const hallMap = new Map<string, number>()
  farewellReservations.forEach((r: any) => {
    const hallId = r.hallId || r.hall_id
    const hallName = r.hallName || r.hall_name
    if (hallId) {
      hallMap.set(hallId, (hallMap.get(hallId) || 0) + 1)
      if (!farewellHalls.find((h) => h.hallId === hallId)) {
        farewellHalls.push({
          hallId,
          hallName: hallName || hallId,
          usageRate: 0,
          reservations: 0,
        })
      }
    }
  })
  farewellHalls.forEach((h) => {
    h.reservations = hallMap.get(h.hallId) || 0
  })

  const cremationTotal = (summary.cremationCount as number) || cremationTasks.length
  const cremationCompleted = (summary.cremationCompleted as number) || 0

  return {
    date: converted.date as string,
    area: converted.area as string,
    statistics: {
      receiptCount: (summary.receiptCount as number) || 0,
      embalmingCompleted: (summary.embalmingCompleted as number) || 0,
      embalmingTotal: (summary.embalmingCount as number) || 0,
      farewellHalls,
      cremationTotal,
      cremationCompleted,
      cremationRate: cremationTotal > 0 ? (cremationCompleted / cremationTotal) * 100 : 0,
      vehicleTotal: (summary.vehicleTaskCount as number) || vehicleTasks.length,
      vehicleOnTime: (summary.vehicleTaskCompleted as number) || 0,
      vehicleOnTimeRate: 0,
      storageNew: 0,
    },
  }
}

function transformNotificationResponse(data: unknown): Notification {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    type: converted.type as Notification['type'],
    priority: converted.priority as Notification['priority'],
    title: converted.title as string,
    content: converted.content as string,
    relatedId: converted.relatedId as string,
    relatedType: converted.relatedType as string,
    recipientId: converted.recipientId as string,
    recipientRole: converted.recipientRole as string,
    read: converted.read as boolean,
    createdAt: converted.createdAt as string,
  }
}

function transformUserResponse(data: unknown): UserInfo {
  const converted = convertKeysToCamelCase<Record<string, unknown>>(data)
  return {
    id: converted.id as string,
    name: converted.name as string,
    role: converted.role as UserInfo['role'],
    avatar: converted.avatar as string,
  }
}

const api: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

api.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data
    if (res && typeof res === 'object' && 'success' in res && 'data' in res) {
      if (!res.success) {
        return Promise.reject(new Error(res.message || '请求失败'))
      }
      return res
    }
    return res
  },
  (error) => {
    if (error.response?.status === 401) {
      removeToken()
      localStorage.removeItem('user_info')
      window.location.href = '/login'
    }
    const message = error.response?.data?.message || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const response: ApiResponse<{ token: string; user: unknown }> = await api.post('/auth/login', data)
    return {
      token: response.data.token,
      user: transformUserResponse(response.data.user),
    }
  },
  logout: (): Promise<void> => api.post('/auth/logout'),
}

export const receiptApi = {
  getList: async (params?: { status?: string; keyword?: string }): Promise<DeceasedInfo[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/receipts', { params })
    return response.data.map((item) => transformReceiptResponse(item))
  },
  create: async (data: DeceasedInfo): Promise<DeceasedInfo> => {
    const requestData = {
      deceased_name: data.name,
      deceased_gender: data.gender,
      deceased_age: data.age,
      deceased_id_card: data.idCard,
      date_of_death: data.dateOfDeath,
      cause_of_death: data.causeOfDeath,
      death_certificate_no: data.deathCertificateNo,
      police_record_no: data.policeRecordNo,
      family_name: data.familyName,
      family_phone: data.familyPhone,
      family_relation: data.familyRelation,
      receipt_time: data.receiptTime,
    }
    const response: ApiResponse<unknown> = await api.post('/receipts', requestData)
    return transformReceiptResponse(response.data)
  },
  getDetail: async (id: string): Promise<DeceasedInfo> => {
    const response: ApiResponse<unknown> = await api.get(`/receipts/${id}`)
    return transformReceiptResponse(response.data)
  },
  verify: async (id: string): Promise<{ receipt: DeceasedInfo; verification: DeceasedInfo['verificationResult'] }> => {
    const response: ApiResponse<{ receipt: unknown; verification: unknown }> = await api.put(`/receipts/${id}/verify`)
    return {
      receipt: transformReceiptResponse(response.data.receipt),
      verification: convertKeysToCamelCase<DeceasedInfo['verificationResult']>(response.data.verification),
    }
  },
  reject: async (id: string, data: { reason: string }): Promise<DeceasedInfo> => {
    const response: ApiResponse<unknown> = await api.put(`/receipts/${id}/reject`, data)
    return transformReceiptResponse(response.data)
  },
  assignEmbalming: async (id: string, data: { taskType: string; priority?: string; bodyCondition?: string }): Promise<{ task: EmbalmingTask; receipt: DeceasedInfo }> => {
    const requestData = {
      body_condition: data.bodyCondition || 'normal',
      task_type: data.taskType,
      priority: data.priority || 'normal',
    }
    const response: ApiResponse<{ task: unknown; receipt: unknown }> = await api.post(`/receipts/${id}/assign-embalming`, requestData)
    return {
      task: transformEmbalmingTaskResponse(response.data.task),
      receipt: transformReceiptResponse(response.data.receipt),
    }
  },
}

export const embalmingApi = {
  getTasks: async (params?: { status?: string }): Promise<EmbalmingTask[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/embalming/tasks', { params })
    return response.data.map((item) => transformEmbalmingTaskResponse(item))
  },
  createTask: async (data: Partial<EmbalmingTask>): Promise<EmbalmingTask> => {
    const requestData: Record<string, unknown> = {
      receipt_id: data.receiptId,
      body_condition: data.bodyCondition,
      task_type: data.taskType,
      assignee_id: data.assigneeId,
      priority: data.priority,
      estimated_duration: data.estimatedDuration,
      notes: data.notes,
    }
    const response: ApiResponse<unknown> = await api.post('/embalming/tasks', requestData)
    return transformEmbalmingTaskResponse(response.data)
  },
  updateStatus: async (id: string, data: { status: string }): Promise<EmbalmingTask> => {
    const response: ApiResponse<unknown> = await api.put(`/embalming/tasks/${id}/status`, data)
    return transformEmbalmingTaskResponse(response.data)
  },
  assignTask: async (id: string, data: { assigneeId: string }): Promise<EmbalmingTask> => {
    const requestData = {
      assignee_id: data.assigneeId,
    }
    const response: ApiResponse<unknown> = await api.put(`/embalming/tasks/${id}/assign`, requestData)
    return transformEmbalmingTaskResponse(response.data)
  },
}

export const farewellApi = {
  getHalls: async (): Promise<FarewellHall[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/farewell/halls')
    return response.data.map((item) => transformFarewellHallResponse(item))
  },
  getHallSchedule: async (id: string, params: { date: string }): Promise<FarewellReservation[]> => {
    const response: ApiResponse<{ hall: unknown; date: string; reservations: unknown[] }> = await api.get(`/farewell/halls/${id}/schedule`, { params })
    return response.data.reservations.map((item) => transformFarewellReservationResponse(item))
  },
  getSuggestion: async (params: {
    attendeeCount: number
    preferredTime?: string
    durationMinutes?: number
  }): Promise<HallSuggestion[]> => {
    const requestParams: Record<string, unknown> = {
      attendee_count: params.attendeeCount,
      duration_minutes: params.durationMinutes,
    }
    if (params.preferredTime) {
      requestParams.preferred_time = params.preferredTime
    }
    const response: ApiResponse<unknown[]> = await api.get('/farewell/suggest', { params: requestParams })
    return response.data.map((item) => transformHallSuggestionResponse(item))
  },
  createReservation: async (data: FarewellReservation): Promise<FarewellReservation> => {
    const requestData = {
      hall_id: data.hallId,
      receipt_id: data.receiptId,
      attendee_count: data.attendeeCount,
      duration_minutes: data.durationMinutes,
      start_time: data.startTime,
      end_time: data.endTime,
      family_name: data.familyName,
      family_phone: data.familyPhone,
    }
    const response: ApiResponse<unknown> = await api.post('/farewell/reservations', requestData)
    return transformFarewellReservationResponse(response.data)
  },
  updateReservation: async (id: string, data: Partial<FarewellReservation>): Promise<FarewellReservation> => {
    const requestData: Record<string, unknown> = {}
    if (data.hallId) requestData.hall_id = data.hallId
    if (data.attendeeCount) requestData.attendee_count = data.attendeeCount
    if (data.durationMinutes) requestData.duration_minutes = data.durationMinutes
    if (data.startTime) requestData.start_time = data.startTime
    if (data.endTime) requestData.end_time = data.endTime
    if (data.status) requestData.status = data.status
    const response: ApiResponse<unknown> = await api.put(`/farewell/reservations/${id}`, requestData)
    return transformFarewellReservationResponse(response.data)
  },
  cancelReservation: (id: string): Promise<void> => api.delete(`/farewell/reservations/${id}`),
}

export const cremationApi = {
  getFurnaces: async (): Promise<CremationFurnace[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/cremation/furnaces')
    return response.data.map((item) => transformCremationFurnaceResponse(item))
  },
  getTasks: async (params?: { status?: string }): Promise<CremationTask[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/cremation/tasks', { params })
    return response.data.map((item) => transformCremationTaskResponse(item))
  },
  generateQueue: async (): Promise<CremationTask[]> => {
    const response: ApiResponse<unknown[]> = await api.post('/cremation/tasks/generate-queue')
    return response.data.map((item) => transformCremationTaskResponse(item))
  },
  startTask: async (id: string): Promise<CremationTask> => {
    const response: ApiResponse<unknown> = await api.put(`/cremation/tasks/${id}/start`)
    return transformCremationTaskResponse(response.data)
  },
  completeTask: async (id: string): Promise<CremationTask> => {
    const response: ApiResponse<unknown> = await api.put(`/cremation/tasks/${id}/complete`)
    return transformCremationTaskResponse(response.data)
  },
  remindTask: (id: string): Promise<void> => api.post(`/cremation/tasks/${id}/remind`),
  reorderTasks: async (data: { orders: Array<{ id: string; queuePosition: number }> }): Promise<CremationTask[]> => {
    const requestData = {
      orders: data.orders.map(o => ({
        id: o.id,
        queue_position: o.queuePosition,
      })),
    }
    const response: ApiResponse<unknown[]> = await api.put('/cremation/tasks/reorder', requestData)
    return response.data.map((item) => transformCremationTaskResponse(item))
  },
}

export const storageApi = {
  getNiches: async (params?: { area?: string; status?: string }): Promise<StorageNiche[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/storage/niches', { params })
    return response.data.map((item) => transformStorageNicheResponse(item))
  },
  getNicheMap: async (params: { area: string }): Promise<StorageNiche[][]> => {
    const response: ApiResponse<unknown[][]> = await api.get('/storage/niches/map', { params })
    return response.data.map((row) => row.map((item) => transformStorageNicheResponse(item)))
  },
  matchNiche: async (params: { receiptId: string; type?: string }): Promise<NicheMatchResult[]> => {
    const requestParams = {
      receipt_id: params.receiptId,
      type: params.type,
    }
    const response: ApiResponse<{ receipt: unknown; matches: unknown[] }> = await api.get('/storage/niches/match', { params: requestParams })
    return response.data.matches.map((item) => transformNicheMatchResultResponse(item))
  },
  createContract: async (data: {
    nicheId: string
    receiptId: string
    familyName: string
    familyPhone: string
    familyIdCard: string
    startDate: string
    years: number
  }): Promise<StorageContract> => {
    const requestData = {
      niche_id: data.nicheId,
      receipt_id: data.receiptId,
      family_name: data.familyName,
      family_phone: data.familyPhone,
      family_id_card: data.familyIdCard,
      start_date: data.startDate,
      years: data.years,
    }
    const response: ApiResponse<unknown> = await api.post('/storage/contracts', requestData)
    return transformStorageContractResponse(response.data)
  },
  getCertificate: async (id: string): Promise<CertificateData> => {
    const response: ApiResponse<{
      certificate_no: string
      qr_code: string
      deceased_name: string
      niche_info: {
        area: string
        row: number
        col: number
        level: number
        type: string
      }
    }> = await api.get(`/storage/contracts/${id}/certificate`)
    const raw = response.data
    return {
      certificateNo: raw.certificate_no,
      qrCode: raw.qr_code,
      deceasedName: raw.deceased_name,
      nicheInfo: {
        area: raw.niche_info.area,
        row: raw.niche_info.row,
        col: raw.niche_info.col,
        level: raw.niche_info.level,
        type: raw.niche_info.type,
      },
    }
  },
  getContracts: async (): Promise<StorageContract[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/storage/contracts')
    return response.data.map((item) => transformStorageContractResponse(item))
  },
}

export const vehicleApi = {
  getList: async (params?: { status?: string }): Promise<Vehicle[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/vehicles', { params })
    return response.data.map((item) => transformVehicleResponse(item))
  },
  getDrivers: async (): Promise<DriverInfo[]> => {
    const response: ApiResponse<{ id: string; name: string; phone?: string }[]> = await api.get('/vehicles/drivers')
    return response.data
  },
  getTrack: async (id: string): Promise<{ trackLog: VehicleTask['trackLog'] }> => {
    const response: ApiResponse<{ track_log: string }> = await api.get(`/vehicles/${id}/track`)
    try {
      return {
        trackLog: JSON.parse(response.data.track_log),
      }
    } catch {
      return {
        trackLog: [],
      }
    }
  },
  getDispatchSuggest: async (params?: {
    originLat?: number
    originLng?: number
    destLat?: number
    destLng?: number
  }): Promise<DispatchSuggestion[]> => {
    const requestParams = {
      origin_lat: params?.originLat,
      origin_lng: params?.originLng,
      dest_lat: params?.destLat,
      dest_lng: params?.destLng,
    }
    const response: ApiResponse<unknown[]> = await api.get('/vehicles/dispatch-suggest', { params: requestParams })
    return response.data.map((item) => transformDispatchSuggestionResponse(item))
  },
  createTask: async (data: {
    vehicleId: string
    driverId: string
    taskType: 'pickup' | 'transfer' | 'delivery'
    origin: { address: string; lat: number; lng: number }
    destination: { address: string; lat: number; lng: number }
    scheduledTime: string
    estimatedDuration: number
    distanceKm: number
  }): Promise<VehicleTask> => {
    const requestData = {
      vehicle_id: data.vehicleId,
      driver_id: data.driverId,
      task_type: data.taskType,
      origin_address: data.origin.address,
      origin_lat: data.origin.lat,
      origin_lng: data.origin.lng,
      dest_address: data.destination.address,
      dest_lat: data.destination.lat,
      dest_lng: data.destination.lng,
      scheduled_time: data.scheduledTime,
      estimated_duration: data.estimatedDuration,
      distance_km: data.distanceKm,
    }
    const response: ApiResponse<unknown> = await api.post('/vehicles/tasks', requestData)
    return transformVehicleTaskResponse(response.data)
  },
  getTasks: async (): Promise<VehicleTask[]> => {
    const response: ApiResponse<unknown[]> = await api.get('/vehicles/tasks')
    return response.data.map((item) => transformVehicleTaskResponse(item))
  },
  updateTaskStatus: async (id: string, data: { status: string }): Promise<VehicleTask> => {
    const response: ApiResponse<unknown> = await api.put(`/vehicles/tasks/${id}/status`, data)
    return transformVehicleTaskResponse(response.data)
  },
  reportPosition: async (id: string, data: { lat: number; lng: number; timestamp: string }): Promise<void> => {
    await api.post(`/vehicles/tasks/${id}/track`, data)
  },
}

export const reportApi = {
  getDaily: async (params: { date: string; area?: string }): Promise<DailyReport> => {
    const response: ApiResponse<unknown> = await api.get('/reports/daily', { params })
    return transformDailyReportResponse(response.data)
  },
  getHallUsage: async (params: { startDate: string; endDate: string }): Promise<DailyReport['statistics']['farewellHalls']> => {
    const requestParams = {
      start_date: params.startDate,
      end_date: params.endDate,
    }
    const response: ApiResponse<unknown[]> = await api.get('/reports/hall-usage', { params: requestParams })
    return response.data.map((item) => convertKeysToCamelCase<DailyReport['statistics']['farewellHalls'][0]>(item))
  },
  getCremationRate: async (params: { startDate: string; endDate: string }): Promise<{ rate: number }> => {
    const requestParams = {
      start_date: params.startDate,
      end_date: params.endDate,
    }
    const response: ApiResponse<{ rate: number }> = await api.get('/reports/cremation-rate', { params: requestParams })
    return {
      rate: response.data.rate,
    }
  },
  getVehiclePunctuality: async (params: { startDate: string; endDate: string }): Promise<{ rate: number }> => {
    const requestParams = {
      start_date: params.startDate,
      end_date: params.endDate,
    }
    const response: ApiResponse<{ rate: number }> = await api.get('/reports/vehicle-punctuality', { params: requestParams })
    return {
      rate: response.data.rate,
    }
  },
  exportExcel: async (params: {
    type: 'daily' | 'hall-usage' | 'cremation-rate' | 'vehicle-punctuality'
    startDate: string
    endDate: string
    area?: string
  }): Promise<Blob> => {
    const requestParams = {
      type: params.type,
      start_date: params.startDate,
      end_date: params.endDate,
      area: params.area,
    }
    return api.get('/reports/export', { params: requestParams, responseType: 'blob' })
  },
}

export const notificationApi = {
  getList: async (params?: { type?: string; read?: boolean; keyword?: string }): Promise<Notification[]> => {
    const requestParams: Record<string, unknown> = {
      type: params?.type,
    }
    if (params?.read !== undefined) {
      requestParams.read = params.read ? 'true' : 'false'
    }
    if (params?.keyword) {
      requestParams.keyword = params.keyword
    }
    const response: ApiResponse<unknown[]> = await api.get('/notifications', { params: requestParams })
    return response.data.map((item) => transformNotificationResponse(item))
  },
  markAsRead: async (id: string): Promise<Notification> => {
    const response: ApiResponse<unknown> = await api.put(`/notifications/${id}/read`)
    return transformNotificationResponse(response.data)
  },
  markAllAsRead: (): Promise<void> => api.put('/notifications/read-all'),
  getStreamUrl: (): string => {
    const token = getToken()
    return `/api/notifications/stream${token ? `?token=${token}` : ''}`
  },
}

export { api, getToken, setToken, removeToken }
export default api

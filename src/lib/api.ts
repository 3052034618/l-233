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
  code: number
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
    return response.data
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
  login: (data: LoginRequest): Promise<LoginResponse> => api.post('/auth/login', data),
  logout: (): Promise<void> => api.post('/auth/logout'),
}

export const receiptApi = {
  getList: (params?: { status?: string; keyword?: string }): Promise<DeceasedInfo[]> =>
    api.get('/receipts', { params }),
  create: (data: DeceasedInfo): Promise<DeceasedInfo> => api.post('/receipts', data),
  getDetail: (id: string): Promise<DeceasedInfo> => api.get(`/receipts/${id}`),
  verify: (id: string): Promise<DeceasedInfo> => api.put(`/receipts/${id}/verify`),
  reject: (id: string, data: { reason: string }): Promise<DeceasedInfo> =>
    api.put(`/receipts/${id}/reject`, data),
  assignEmbalming: (id: string, data: { taskType: string; priority?: string }): Promise<EmbalmingTask> =>
    api.post(`/receipts/${id}/assign-embalming`, data),
}

export const embalmingApi = {
  getTasks: (params?: { status?: string }): Promise<EmbalmingTask[]> =>
    api.get('/embalming/tasks', { params }),
  createTask: (data: Partial<EmbalmingTask>): Promise<EmbalmingTask> =>
    api.post('/embalming/tasks', data),
  updateStatus: (id: string, data: { status: string }): Promise<EmbalmingTask> =>
    api.put(`/embalming/tasks/${id}/status`, data),
  assignTask: (id: string, data: { assigneeId: string }): Promise<EmbalmingTask> =>
    api.put(`/embalming/tasks/${id}/assign`, data),
}

export const farewellApi = {
  getHalls: (): Promise<FarewellHall[]> => api.get('/farewell/halls'),
  getHallSchedule: (id: string, params: { date: string }): Promise<FarewellReservation[]> =>
    api.get(`/farewell/halls/${id}/schedule`, { params }),
  getSuggestion: (params: {
    attendeeCount: number
    startTime?: string
    durationMinutes?: number
  }): Promise<HallSuggestion[]> => api.get('/farewell/suggest', { params }),
  createReservation: (data: FarewellReservation): Promise<FarewellReservation> =>
    api.post('/farewell/reservations', data),
  updateReservation: (id: string, data: Partial<FarewellReservation>): Promise<FarewellReservation> =>
    api.put(`/farewell/reservations/${id}`, data),
  cancelReservation: (id: string): Promise<void> => api.delete(`/farewell/reservations/${id}`),
}

export const cremationApi = {
  getFurnaces: (): Promise<CremationFurnace[]> => api.get('/cremation/furnaces'),
  getTasks: (params?: { status?: string }): Promise<CremationTask[]> =>
    api.get('/cremation/tasks', { params }),
  generateQueue: (): Promise<CremationTask[]> => api.post('/cremation/tasks/generate-queue'),
  startTask: (id: string): Promise<CremationTask> => api.put(`/cremation/tasks/${id}/start`),
  completeTask: (id: string): Promise<CremationTask> => api.put(`/cremation/tasks/${id}/complete`),
  remindTask: (id: string): Promise<void> => api.post(`/cremation/tasks/${id}/remind`),
  reorderTasks: (data: { taskIds: string[] }): Promise<CremationTask[]> =>
    api.put('/cremation/tasks/reorder', data),
}

export const storageApi = {
  getNiches: (params?: { area?: string; status?: string }): Promise<StorageNiche[]> =>
    api.get('/storage/niches', { params }),
  getNicheMap: (params: { area: string }): Promise<StorageNiche[][]> =>
    api.get('/storage/niches/map', { params }),
  matchNiche: (params: { receiptId: string; type?: string }): Promise<StorageNiche[]> =>
    api.get('/storage/match', { params }),
  createContract: (data: StorageContract): Promise<StorageContract> =>
    api.post('/storage/contracts', data),
  getCertificate: (id: string): Promise<{ certificateNo: string; qrCode: string }> =>
    api.get(`/storage/contracts/${id}/certificate`),
}

export const vehicleApi = {
  getList: (params?: { status?: string }): Promise<Vehicle[]> => api.get('/vehicles', { params }),
  getTrack: (id: string): Promise<{ trackLog: VehicleTask['trackLog'] }> =>
    api.get(`/vehicles/${id}/track`),
  getDispatchSuggest: (params?: { origin?: string; destination?: string }): Promise<DispatchSuggestion[]> =>
    api.get('/vehicles/dispatch-suggest', { params }),
  createTask: (data: VehicleTask): Promise<VehicleTask> => api.post('/vehicles/tasks', data),
  updateTaskStatus: (id: string, data: { status: string }): Promise<VehicleTask> =>
    api.put(`/vehicles/tasks/${id}/status`, data),
  reportPosition: (id: string, data: { lat: number; lng: number; timestamp: string }): Promise<void> =>
    api.post(`/vehicles/tasks/${id}/track`, data),
}

export const reportApi = {
  getDaily: (params: { date: string; area?: string }): Promise<DailyReport> =>
    api.get('/reports/daily', { params }),
  getHallUsage: (params: { startDate: string; endDate: string }): Promise<DailyReport['statistics']['farewellHalls']> =>
    api.get('/reports/hall-usage', { params }),
  getCremationRate: (params: { startDate: string; endDate: string }): Promise<{ rate: number }> =>
    api.get('/reports/cremation-rate', { params }),
  getVehiclePunctuality: (params: { startDate: string; endDate: string }): Promise<{ rate: number }> =>
    api.get('/reports/vehicle-punctuality', { params }),
  exportExcel: (params: {
    type: 'daily' | 'hall-usage' | 'cremation-rate' | 'vehicle-punctuality'
    startDate: string
    endDate: string
    area?: string
  }): Promise<Blob> =>
    api.get('/reports/export', { params, responseType: 'blob' }),
}

export const notificationApi = {
  getList: (params?: { type?: string; read?: boolean }): Promise<Notification[]> =>
    api.get('/notifications', { params }),
  markAsRead: (id: string): Promise<Notification> => api.put(`/notifications/${id}/read`),
  markAllAsRead: (): Promise<void> => api.put('/notifications/read-all'),
  getStreamUrl: (): string => {
    const token = getToken()
    return `/api/notifications/stream${token ? `?token=${token}` : ''}`
  },
}

export { api, getToken, setToken, removeToken }
export default api

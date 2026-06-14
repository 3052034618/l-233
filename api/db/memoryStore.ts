export interface User {
  id: string
  username: string
  password: string
  name: string
  role: 'admin' | 'dispatcher' | 'embalmer' | 'cremator' | 'driver' | 'family'
  phone?: string
  avatar?: string
  created_at?: string
}

export interface Receipt {
  id: string
  deceased_name: string
  deceased_gender: string
  deceased_age: number
  deceased_id_card: string
  date_of_death: string
  cause_of_death: string
  death_certificate_no: string
  police_record_no: string
  status: 'pending' | 'verified' | 'rejected' | 'processing'
  family_name: string
  family_phone: string
  family_relation: string
  receipt_time?: string
  verification_result?: string
  created_at?: string
  updated_at?: string
}

export interface EmbalmingTask {
  id: string
  receipt_id: string
  body_condition: string
  task_type: string
  assignee_id?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  estimated_duration: number
  start_time?: string
  end_time?: string
  notes?: string
  created_at?: string
}

export interface FarewellHall {
  id: string
  name: string
  capacity: number
  facilities?: string
  floor: number
  status: 'available' | 'maintenance'
}

export interface FarewellReservation {
  id: string
  hall_id: string
  receipt_id: string
  attendee_count: number
  duration_minutes: number
  start_time: string
  end_time: string
  status: 'reserved' | 'in_progress' | 'completed' | 'cancelled'
  family_name: string
  family_phone: string
  created_at?: string
}

export interface CremationFurnace {
  id: string
  name: string
  type: string
  fuel_type: string
  fuel_level: number
  status: 'idle' | 'running' | 'maintenance'
  current_task_id?: string
  estimated_finish_time?: string
}

export interface CremationTask {
  id: string
  receipt_id: string
  furnace_id?: string
  furnace_type: string
  queue_position: number
  scheduled_time: string
  start_time?: string
  end_time?: string
  status: 'queued' | 'pending' | 'in_progress' | 'completed' | 'overdue'
  estimated_duration: number
  overdue: number
  created_at?: string
}

export interface StorageNiche {
  id: string
  area: string
  row_num: number
  col_num: number
  level_num: number
  type: 'single' | 'double' | 'family'
  price: number
  status: 'available' | 'occupied' | 'reserved' | 'maintenance'
}

export interface StorageContract {
  id: string
  niche_id: string
  receipt_id: string
  family_name: string
  family_phone: string
  family_id_card: string
  start_date: string
  end_date: string
  years: number
  status: 'active' | 'expired' | 'transferred'
  certificate_no: string
  created_at?: string
}

export interface Vehicle {
  id: string
  plate_no: string
  model: string
  type: 'sedan' | 'van' | 'luxury'
  capacity: number
  current_load: number
  fuel_level: number
  status: 'idle' | 'in_transit' | 'maintenance'
  driver_id?: string
  driver_name?: string
  current_lat?: number
  current_lng?: number
  current_address?: string
  current_task_id?: string
  estimated_arrival_time?: string
}

export interface VehicleTask {
  id: string
  vehicle_id: string
  driver_id: string
  receipt_id?: string
  task_type: 'pickup' | 'transfer' | 'delivery'
  origin_address: string
  origin_lat: number
  origin_lng: number
  dest_address: string
  dest_lat: number
  dest_lng: number
  scheduled_time: string
  estimated_duration: number
  distance_km: number
  status: 'pending' | 'in_progress' | 'completed' | 'delayed'
  route?: string
  track_log?: string
  created_at?: string
}

export interface Notification {
  id: string
  type: 'receipt' | 'embalming' | 'farewell' | 'cremation' | 'storage' | 'vehicle' | 'system'
  priority: 'low' | 'normal' | 'high' | 'urgent'
  title: string
  content: string
  related_id?: string
  related_type?: string
  recipient_id: string
  recipient_role: string
  is_read: number
  created_at?: string
}

export interface DailyReport {
  id: string
  report_date: string
  area?: string
  data: string
  generated_at?: string
}

let idCounter = 0
export function generateId(prefix: string): string {
  idCounter++
  return `${prefix}_${Date.now()}_${idCounter}_${Math.random().toString(36).slice(2, 8)}`
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

const today = new Date()
function daysAgo(n: number): Date {
  const d = new Date(today)
  d.setDate(d.getDate() - n)
  return d
}
function hoursAgo(n: number): Date {
  const d = new Date(today)
  d.setHours(d.getHours() - n)
  return d
}
function hoursLater(n: number): Date {
  const d = new Date(today)
  d.setHours(d.getHours() + n)
  return d
}
function daysLater(n: number): Date {
  const d = new Date(today)
  d.setDate(d.getDate() + n)
  return d
}

export interface MemoryStore<T extends { id: string }> {
  create: (data: Omit<T, 'id'> & { id?: string }) => Promise<{ lastID: number; changes: number }>
  getById: (id: string) => Promise<T | undefined>
  getAll: () => Promise<T[]>
  update: (id: string, data: Partial<T>) => Promise<{ lastID: number; changes: number }>
  delete: (id: string) => Promise<{ lastID: number; changes: number }>
  filter: (queryFn: (item: T) => boolean) => Promise<T[]>
  findOne: (queryFn: (item: T) => boolean) => Promise<T | undefined>
  _data: T[]
}

function createMemoryStore<T extends { id: string }>(initialData: T[] = []): MemoryStore<T> {
  const data: T[] = [...initialData]

  return {
    _data: data,
    async create(item) {
      const newItem = { ...item } as T
      if (!newItem.id) {
        newItem.id = generateId('item')
      }
      data.push(newItem)
      return { lastID: data.length, changes: 1 }
    },
    async getById(id) {
      return data.find((item) => item.id === id)
    },
    async getAll() {
      return [...data]
    },
    async update(id, updates) {
      const index = data.findIndex((item) => item.id === id)
      if (index === -1) {
        return { lastID: 0, changes: 0 }
      }
      data[index] = { ...data[index], ...updates } as T
      return { lastID: index, changes: 1 }
    },
    async delete(id) {
      const index = data.findIndex((item) => item.id === id)
      if (index === -1) {
        return { lastID: 0, changes: 0 }
      }
      data.splice(index, 1)
      return { lastID: index, changes: 1 }
    },
    async filter(queryFn) {
      return data.filter(queryFn)
    },
    async findOne(queryFn) {
      return data.find(queryFn)
    },
  }
}

const PASSWORD_HASH = '123456'

function initUsers(): User[] {
  return [
    { id: 'user_admin', username: 'admin', password: PASSWORD_HASH, name: '系统管理员', role: 'admin', phone: '13800000001', created_at: formatDate(daysAgo(30)) },
    { id: 'user_dispatcher', username: 'dispatcher', password: PASSWORD_HASH, name: '调度员李华', role: 'dispatcher', phone: '13800000002', created_at: formatDate(daysAgo(30)) },
    { id: 'user_embalmer', username: 'embalmer', password: PASSWORD_HASH, name: '防腐师王芳', role: 'embalmer', phone: '13800000003', created_at: formatDate(daysAgo(30)) },
    { id: 'user_cremator', username: 'cremator', password: PASSWORD_HASH, name: '火化师张强', role: 'cremator', phone: '13800000004', created_at: formatDate(daysAgo(30)) },
    { id: 'user_driver1', username: 'driver1', password: PASSWORD_HASH, name: '司机赵军', role: 'driver', phone: '13800000005', created_at: formatDate(daysAgo(30)) },
    { id: 'user_driver2', username: 'driver2', password: PASSWORD_HASH, name: '司机钱伟', role: 'driver', phone: '13800000007', created_at: formatDate(daysAgo(25)) },
    { id: 'user_driver3', username: 'driver3', password: PASSWORD_HASH, name: '司机孙明', role: 'driver', phone: '13800000008', created_at: formatDate(daysAgo(20)) },
    { id: 'user_family', username: 'family', password: PASSWORD_HASH, name: '家属陈先生', role: 'family', phone: '13800000006', created_at: formatDate(daysAgo(30)) },
  ]
}

function initReceipts(): Receipt[] {
  const deceasedNames = [
    { name: '张建国', gender: 'male', age: 78 },
    { name: '李秀英', gender: 'female', age: 85 },
    { name: '王德福', gender: 'male', age: 62 },
    { name: '陈美玲', gender: 'female', age: 58 },
    { name: '刘志强', gender: 'male', age: 71 },
    { name: '赵桂芳', gender: 'female', age: 92 },
    { name: '孙文博', gender: 'male', age: 45 },
    { name: '周淑华', gender: 'female', age: 76 },
    { name: '吴明远', gender: 'male', age: 68 },
    { name: '郑丽娟', gender: 'female', age: 81 },
  ]
  const causes = ['心力衰竭', '肺癌晚期', '脑溢血', '心肌梗塞', '糖尿病并发症', '自然衰老', '交通事故', '胃癌', '肾衰竭', '中风']
  const statuses: ('pending' | 'verified' | 'rejected' | 'processing')[] = ['pending', 'verified', 'verified', 'processing', 'verified', 'verified', 'pending', 'rejected', 'verified', 'processing']
  const relations = ['儿子', '女儿', '配偶', '弟弟', '孙女', '侄子', '女儿', '儿子', '配偶', '外孙']
  const familyNames = ['张伟', '李娜', '王军', '陈刚', '刘洋', '赵磊', '孙丽', '周明', '吴芳', '郑华']

  const receipts: Receipt[] = []
  for (let i = 0; i < deceasedNames.length; i++) {
    const d = deceasedNames[i]
    const id = `receipt_${i + 1}`
    const receiptTime = daysAgo(Math.floor(Math.random() * 7))
    const verificationResult = statuses[i] === 'rejected'
      ? JSON.stringify({ deathCertValid: false, policeRecordValid: true, issues: ['死亡证明信息不全，需补充医院公章'] })
      : statuses[i] === 'pending'
        ? undefined
        : JSON.stringify({ deathCertValid: true, policeRecordValid: true, issues: [] })

    receipts.push({
      id,
      deceased_name: d.name,
      deceased_gender: d.gender,
      deceased_age: d.age,
      deceased_id_card: `110101${1940 + Math.floor(Math.random() * 50)}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      date_of_death: formatDate(daysAgo(Math.floor(Math.random() * 10) + 1)),
      cause_of_death: causes[i],
      death_certificate_no: `DC${Date.now()}${i}`,
      police_record_no: `PR${Date.now()}${i}`,
      status: statuses[i],
      family_name: familyNames[i],
      family_phone: `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      family_relation: relations[i],
      receipt_time: formatDate(receiptTime),
      verification_result: verificationResult,
      created_at: formatDate(receiptTime),
      updated_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))),
    })
  }
  return receipts
}

function initEmbalmingTasks(receiptIds: string[]): EmbalmingTask[] {
  const bodyConditions: ('normal' | 'damaged' | 'advanced_decay')[] = ['normal', 'normal', 'damaged', 'normal', 'advanced_decay']
  const taskTypes: ('preservation' | 'cosmetics' | 'both')[] = ['both', 'cosmetics', 'both', 'preservation', 'both']
  const priorities: ('low' | 'normal' | 'high' | 'urgent')[] = ['normal', 'high', 'urgent', 'normal', 'high']
  const statuses: ('pending' | 'in_progress' | 'completed')[] = ['completed', 'completed', 'in_progress', 'pending', 'in_progress']
  const assignees: (string | null)[] = ['user_embalmer', 'user_embalmer', 'user_embalmer', null, 'user_embalmer']

  const tasks: EmbalmingTask[] = []
  for (let i = 0; i < 5; i++) {
    const id = `embalming_${i + 1}`
    const start = statuses[i] === 'pending' ? undefined : formatDate(hoursAgo(Math.floor(Math.random() * 24) + 1))
    const end = statuses[i] === 'completed' ? formatDate(hoursAgo(Math.floor(Math.random() * 12))) : undefined

    tasks.push({
      id,
      receipt_id: receiptIds[i],
      body_condition: bodyConditions[i],
      task_type: taskTypes[i],
      assignee_id: assignees[i] ?? undefined,
      status: statuses[i],
      priority: priorities[i],
      estimated_duration: 60 + Math.floor(Math.random() * 120),
      start_time: start,
      end_time: end,
      notes: i === 2 ? '遗体有明显外伤，需重点修复面部' : undefined,
      created_at: formatDate(daysAgo(Math.floor(Math.random() * 5))),
    })
  }
  return tasks
}

function initFarewellHalls(): FarewellHall[] {
  return [
    { id: 'hall_1', name: '永怀厅', capacity: 200, facilities: JSON.stringify(['音响系统', '投影设备', '空调', '鲜花台', '休息区']), floor: 1, status: 'available' },
    { id: 'hall_2', name: '追思厅', capacity: 120, facilities: JSON.stringify(['音响系统', '空调', '鲜花台']), floor: 1, status: 'available' },
    { id: 'hall_3', name: '安详厅', capacity: 80, facilities: JSON.stringify(['音响系统', '空调']), floor: 2, status: 'available' },
    { id: 'hall_4', name: '贵宾厅', capacity: 50, facilities: JSON.stringify(['高级音响', '独立休息室', '空调', '礼宾服务']), floor: 2, status: 'maintenance' },
  ]
}

function initFarewellReservations(receiptIds: string[], hallIds: string[]): FarewellReservation[] {
  const data = [
    { hall: 0, receipt: 0, attendees: 150, duration: 90, dayOffset: 0, hour: 9, status: 'completed' as const, family: '张伟' },
    { hall: 1, receipt: 1, attendees: 80, duration: 60, dayOffset: 0, hour: 10, status: 'in_progress' as const, family: '李娜' },
    { hall: 0, receipt: 2, attendees: 120, duration: 90, dayOffset: 1, hour: 9, status: 'reserved' as const, family: '王军' },
    { hall: 2, receipt: 3, attendees: 60, duration: 60, dayOffset: 1, hour: 14, status: 'reserved' as const, family: '陈刚' },
    { hall: 1, receipt: 4, attendees: 100, duration: 90, dayOffset: 2, hour: 9, status: 'reserved' as const, family: '刘洋' },
    { hall: 0, receipt: 5, attendees: 180, duration: 120, dayOffset: 3, hour: 9, status: 'reserved' as const, family: '赵磊' },
    { hall: 2, receipt: 6, attendees: 50, duration: 60, dayOffset: 0, hour: 14, status: 'cancelled' as const, family: '孙丽' },
    { hall: 1, receipt: 8, attendees: 90, duration: 90, dayOffset: 4, hour: 10, status: 'reserved' as const, family: '吴芳' },
  ]

  const reservations: FarewellReservation[] = []
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    const id = `reservation_${i + 1}`
    const startDate = daysLater(d.dayOffset)
    startDate.setHours(d.hour, 0, 0, 0)
    const endDate = new Date(startDate)
    endDate.setMinutes(endDate.getMinutes() + d.duration)

    reservations.push({
      id,
      hall_id: hallIds[d.hall],
      receipt_id: receiptIds[d.receipt],
      attendee_count: d.attendees,
      duration_minutes: d.duration,
      start_time: formatDate(startDate),
      end_time: formatDate(endDate),
      status: d.status,
      family_name: d.family,
      family_phone: `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      created_at: formatDate(daysAgo(Math.floor(Math.random() * 3) + 1)),
    })
  }
  return reservations
}

function initCremationFurnaces(): CremationFurnace[] {
  return [
    { id: 'furnace_1', name: '1号炉', type: 'standard', fuel_type: 'gas', fuel_level: 85, status: 'idle', current_task_id: undefined, estimated_finish_time: undefined },
    { id: 'furnace_2', name: '2号炉', type: 'premium', fuel_type: 'gas', fuel_level: 92, status: 'running', current_task_id: 'cremation_3', estimated_finish_time: formatDate(hoursLater(1)) },
    { id: 'furnace_3', name: '3号炉', type: 'environmental', fuel_type: 'electric', fuel_level: 100, status: 'idle', current_task_id: undefined, estimated_finish_time: undefined },
    { id: 'furnace_4', name: '4号炉', type: 'standard', fuel_type: 'oil', fuel_level: 45, status: 'maintenance', current_task_id: undefined, estimated_finish_time: undefined },
  ]
}

function initCremationTasks(receiptIds: string[], furnaceIds: string[]): CremationTask[] {
  const data = [
    { receipt: 0, furnace: 0, position: 0, type: 'standard', status: 'completed' as const, overdue: 0, dayOffset: -2, hour: 14 },
    { receipt: 1, furnace: 0, position: 0, type: 'standard', status: 'completed' as const, overdue: 0, dayOffset: -1, hour: 10 },
    { receipt: 2, furnace: 1, position: 1, type: 'premium', status: 'in_progress' as const, overdue: 0, dayOffset: 0, hour: 9 },
    { receipt: 3, furnace: 2, position: 2, type: 'environmental', status: 'queued' as const, overdue: 0, dayOffset: 0, hour: 11 },
    { receipt: 4, furnace: 0, position: 3, type: 'standard', status: 'queued' as const, overdue: 0, dayOffset: 0, hour: 14 },
    { receipt: 5, furnace: 2, position: 4, type: 'environmental', status: 'pending' as const, overdue: 0, dayOffset: 1, hour: 9 },
    { receipt: 8, furnace: 1, position: 5, type: 'premium', status: 'queued' as const, overdue: 1, dayOffset: 0, hour: 8 },
    { receipt: 9, furnace: 0, position: 6, type: 'standard', status: 'pending' as const, overdue: 0, dayOffset: 2, hour: 10 },
  ]

  const tasks: CremationTask[] = []
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    const id = `cremation_${i + 1}`
    const scheduled = d.dayOffset < 0 ? daysAgo(Math.abs(d.dayOffset)) : daysLater(d.dayOffset)
    scheduled.setHours(d.hour, 0, 0, 0)
    const start = d.status === 'in_progress' || d.status === 'completed' ? formatDate(scheduled) : undefined
    const end = d.status === 'completed' ? formatDate(new Date(scheduled.getTime() + (60 + Math.floor(Math.random() * 60)) * 60000)) : undefined

    tasks.push({
      id,
      receipt_id: receiptIds[d.receipt],
      furnace_id: d.status !== 'pending' && d.status !== 'completed' ? furnaceIds[d.furnace] : (d.status === 'completed' ? furnaceIds[d.furnace] : undefined),
      furnace_type: d.type,
      queue_position: d.position,
      scheduled_time: formatDate(scheduled),
      start_time: start,
      end_time: end,
      status: d.status,
      estimated_duration: 60 + Math.floor(Math.random() * 60),
      overdue: d.overdue,
      created_at: formatDate(daysAgo(Math.floor(Math.random() * 4) + 1)),
    })
  }
  return tasks
}

function initStorageNiches(): StorageNiche[] {
  const areas = ['A', 'B', 'C']
  const nicheTypes: ('single' | 'double' | 'family')[] = ['single', 'double', 'family']
  const prices = { single: 8000, double: 15000, family: 25000 }
  const niches: StorageNiche[] = []

  for (const area of areas) {
    for (let row = 1; row <= 5; row++) {
      for (let col = 1; col <= 5; col++) {
        for (let level = 1; level <= 3; level++) {
          const id = `niche_${area}_${row}_${col}_${level}`
          const typeIdx = Math.floor((row + col + level) % 3)
          const type = nicheTypes[typeIdx]
          const price = prices[type]
          const statusRoll = Math.random()
          let status: 'available' | 'occupied' | 'reserved' | 'maintenance'
          if (statusRoll < 0.4) status = 'occupied'
          else if (statusRoll < 0.55) status = 'reserved'
          else if (statusRoll < 0.58) status = 'maintenance'
          else status = 'available'

          niches.push({ id, area, row_num: row, col_num: col, level_num: level, type, price, status })
        }
      }
    }
  }
  return niches
}

function initStorageContracts(receiptIds: string[], nicheIds: string[]): StorageContract[] {
  const occupiedNiches = nicheIds.filter((_, i) => i % 5 === 0).slice(0, 5)
  const familyNames = ['张伟', '李娜', '王军', '刘洋', '吴芳']
  const receiptIdx = [0, 1, 4, 5, 8]

  const contracts: StorageContract[] = []
  for (let i = 0; i < 5; i++) {
    const id = `contract_${i + 1}`
    const startDate = daysAgo(Math.floor(Math.random() * 365))
    const years = [5, 10, 20, 5, 10][i]
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + years)

    contracts.push({
      id,
      niche_id: occupiedNiches[i],
      receipt_id: receiptIds[receiptIdx[i]],
      family_name: familyNames[i],
      family_phone: `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      family_id_card: `110101${1960 + Math.floor(Math.random() * 40)}${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
      start_date: formatDate(startDate).slice(0, 10),
      end_date: formatDate(endDate).slice(0, 10),
      years,
      status: i === 3 ? 'expired' : 'active',
      certificate_no: `CERT${String(i + 1).padStart(6, '0')}`,
      created_at: formatDate(startDate),
    })
  }
  return contracts
}

function initVehicles(): Vehicle[] {
  return [
    { id: 'vehicle_1', plate_no: '京A·88888', model: '奔驰威霆', type: 'luxury', capacity: 7, current_load: 0, fuel_level: 90, status: 'idle', driver_id: 'user_driver1', current_lat: 39.9042, current_lng: 116.4074, current_address: '北京市东城区殡仪馆' },
    { id: 'vehicle_2', plate_no: '京A·66666', model: '别克GL8', type: 'van', capacity: 7, current_load: 2, fuel_level: 65, status: 'in_transit', driver_id: 'user_driver2', current_lat: 39.9142, current_lng: 116.4274, current_address: '北京市朝阳区建国路' },
    { id: 'vehicle_3', plate_no: '京A·55555', model: '大众帕萨特', type: 'sedan', capacity: 5, current_load: 0, fuel_level: 80, status: 'idle', driver_id: undefined, current_lat: 39.9042, current_lng: 116.4074, current_address: '北京市东城区殡仪馆' },
    { id: 'vehicle_4', plate_no: '京A·33333', model: '丰田考斯特', type: 'van', capacity: 17, current_load: 0, fuel_level: 55, status: 'maintenance', driver_id: undefined, current_lat: 39.9042, current_lng: 116.4074, current_address: '北京市东城区殡仪馆' },
    { id: 'vehicle_5', plate_no: '京A·22222', model: '奔驰S级', type: 'luxury', capacity: 5, current_load: 0, fuel_level: 95, status: 'idle', driver_id: 'user_driver3', current_lat: 39.9042, current_lng: 116.4074, current_address: '北京市东城区殡仪馆' },
    { id: 'vehicle_6', plate_no: '京A·11111', model: '奥迪A6L', type: 'sedan', capacity: 5, current_load: 3, fuel_level: 72, status: 'in_transit', driver_id: 'user_driver1', current_lat: 39.8942, current_lng: 116.3974, current_address: '北京市东城区前门大街' },
  ]
}

function initVehicleTasks(receiptIds: string[], vehicleIds: string[]): VehicleTask[] {
  const data = [
    { vehicle: 1, driver: 'user_driver1', receipt: 0, type: 'pickup' as const, origin: '北京市海淀区中关村大街1号', oLat: 39.9842, oLng: 116.3074, dest: '北京市东城区殡仪馆', dLat: 39.9042, dLng: 116.4074, distance: 15.5, duration: 45, status: 'completed' as const, hourOffset: -26 },
    { vehicle: 1, driver: 'user_driver2', receipt: 2, type: 'delivery' as const, origin: '北京市东城区殡仪馆', oLat: 39.9042, oLng: 116.4074, dest: '北京市西城区八宝山公墓', dLat: 39.9087, dLng: 116.2287, distance: 18.2, duration: 50, status: 'in_progress' as const, hourOffset: -1 },
    { vehicle: 5, driver: 'user_driver3', receipt: 3, type: 'pickup' as const, origin: '北京市朝阳区望京SOHO', oLat: 39.9942, oLng: 116.4774, dest: '北京市东城区殡仪馆', dLat: 39.9042, dLng: 116.4074, distance: 12.8, duration: 40, status: 'pending' as const, hourOffset: 3 },
    { vehicle: 2, driver: 'user_driver2', receipt: 5, type: 'transfer' as const, origin: '北京市东城区殡仪馆', oLat: 39.9042, oLng: 116.4074, dest: '北京市昌平区天寿陵园', dLat: 40.2242, dLng: 116.2074, distance: 42.3, duration: 90, status: 'pending' as const, hourOffset: 6 },
    { vehicle: 0, driver: 'user_driver1', receipt: null, type: 'transfer' as const, origin: '北京市东城区殡仪馆', oLat: 39.9042, oLng: 116.4074, dest: '北京市丰台区南苑机场', dLat: 39.7842, dLng: 116.3874, distance: 16.5, duration: 45, status: 'delayed' as const, hourOffset: -3 },
  ]

  const tasks: VehicleTask[] = []
  for (let i = 0; i < data.length; i++) {
    const d = data[i]
    const id = `vtask_${i + 1}`
    const scheduled = hoursAgo(Math.abs(d.hourOffset))
    if (d.hourOffset > 0) {
      scheduled.setHours(today.getHours() + d.hourOffset)
    }

    const route = JSON.stringify([
      { lat: d.oLat, lng: d.oLng },
      { lat: (d.oLat + d.dLat) / 2, lng: (d.oLng + d.dLng) / 2 },
      { lat: d.dLat, lng: d.dLng },
    ])
    const trackLog = d.status === 'completed'
      ? JSON.stringify([
          { lat: d.oLat, lng: d.oLng, timestamp: formatDate(scheduled) },
          { lat: (d.oLat + d.dLat) / 2, lng: (d.oLng + d.dLng) / 2, timestamp: formatDate(new Date(scheduled.getTime() + (d.duration * 60000) / 2)) },
          { lat: d.dLat, lng: d.dLng, timestamp: formatDate(new Date(scheduled.getTime() + d.duration * 60000)) },
        ])
      : d.status === 'in_progress'
        ? JSON.stringify([
            { lat: d.oLat, lng: d.oLng, timestamp: formatDate(scheduled) },
            { lat: (d.oLat + d.dLat) / 2, lng: (d.oLng + d.dLng) / 2, timestamp: formatDate(hoursAgo(0)) },
          ])
        : undefined

    tasks.push({
      id,
      vehicle_id: vehicleIds[d.vehicle],
      driver_id: d.driver,
      receipt_id: d.receipt !== null ? receiptIds[d.receipt] : undefined,
      task_type: d.type,
      origin_address: d.origin,
      origin_lat: d.oLat,
      origin_lng: d.oLng,
      dest_address: d.dest,
      dest_lat: d.dLat,
      dest_lng: d.dLng,
      scheduled_time: formatDate(scheduled),
      estimated_duration: d.duration,
      distance_km: d.distance,
      status: d.status,
      route,
      track_log: trackLog,
      created_at: formatDate(daysAgo(Math.floor(Math.random() * 3))),
    })
  }
  return tasks
}

function initNotifications(): Notification[] {
  return [
    { id: 'notif_1', type: 'receipt', priority: 'high', title: '新的遗体接收登记', content: '张伟提交了张建国的遗体接收申请，请及时审核。', related_id: 'receipt_1', related_type: 'receipt', recipient_id: 'user_dispatcher', recipient_role: 'dispatcher', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_2', type: 'embalming', priority: 'urgent', title: '紧急防腐整容任务', content: '王德福遗体有明显外伤，需立即处理面部修复。', related_id: 'embalming_3', related_type: 'embalming_task', recipient_id: 'user_embalmer', recipient_role: 'embalmer', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_3', type: 'cremation', priority: 'high', title: '火化任务超时预警', content: '火化任务 cremation_7 已超过预计完成时间，请催办。', related_id: 'cremation_7', related_type: 'cremation_task', recipient_id: 'user_cremator', recipient_role: 'cremator', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_4', type: 'farewell', priority: 'normal', title: '告别预约提醒', content: '明天 09:00 永怀厅有告别仪式预约（王德福）。', related_id: 'reservation_3', related_type: 'farewell_reservation', recipient_id: 'user_dispatcher', recipient_role: 'dispatcher', is_read: 1, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_5', type: 'vehicle', priority: 'normal', title: '灵车出车任务', content: '京A·66666 前往西城区八宝山公墓执行送葬任务。', related_id: 'vtask_2', related_type: 'vehicle_task', recipient_id: 'user_driver', recipient_role: 'driver', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_6', type: 'storage', priority: 'normal', title: '存放合同即将到期', content: '张伟先生的存放合同还有30天到期，请提醒续费。', related_id: 'contract_4', related_type: 'storage_contract', recipient_id: 'user_dispatcher', recipient_role: 'dispatcher', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_7', type: 'receipt', priority: 'normal', title: '接收登记已通过审核', content: '李秀英的遗体接收登记已通过审核。', related_id: 'receipt_2', related_type: 'receipt', recipient_id: 'user_family', recipient_role: 'family', is_read: 1, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_8', type: 'system', priority: 'low', title: '系统维护通知', content: '本周六凌晨2:00-4:00将进行系统维护，届时服务可能中断。', related_id: undefined, related_type: undefined, recipient_id: 'user_admin', recipient_role: 'admin', is_read: 1, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_9', type: 'embalming', priority: 'high', title: '防腐任务分配', content: '您被分配了赵桂芳的防腐整容任务。', related_id: 'embalming_5', related_type: 'embalming_task', recipient_id: 'user_embalmer', recipient_role: 'embalmer', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_10', type: 'cremation', priority: 'normal', title: '火化任务完成', content: '张建国的火化任务已完成。', related_id: 'cremation_1', related_type: 'cremation_task', recipient_id: 'user_dispatcher', recipient_role: 'dispatcher', is_read: 1, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_11', type: 'vehicle', priority: 'high', title: '车辆延误提醒', content: '京A·88888 出车任务出现延误，请联系司机。', related_id: 'vtask_5', related_type: 'vehicle_task', recipient_id: 'user_dispatcher', recipient_role: 'dispatcher', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_12', type: 'farewell', priority: 'high', title: '告别仪式进行中', content: '追思厅告别仪式正在进行（李秀英）。', related_id: 'reservation_2', related_type: 'farewell_reservation', recipient_id: 'user_dispatcher', recipient_role: 'dispatcher', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_13', type: 'receipt', priority: 'high', title: '接收登记被退回', content: '周淑华的接收登记被退回，请补充死亡证明信息。', related_id: 'receipt_8', related_type: 'receipt', recipient_id: 'user_family', recipient_role: 'family', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_14', type: 'storage', priority: 'normal', title: '新存放合同已签署', content: '李娜女士的存放合同已成功签署。', related_id: 'contract_2', related_type: 'storage_contract', recipient_id: 'user_admin', recipient_role: 'admin', is_read: 1, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
    { id: 'notif_15', type: 'system', priority: 'urgent', title: '火化炉燃料不足', content: '4号炉燃油量低于50%，请及时补充。', related_id: 'furnace_4', related_type: 'cremation_furnace', recipient_id: 'user_cremator', recipient_role: 'cremator', is_read: 0, created_at: formatDate(hoursAgo(Math.floor(Math.random() * 48))) },
  ]
}

const usersStore = createMemoryStore<User>(initUsers())
const receiptsData = initReceipts()
const receiptsStore = createMemoryStore<Receipt>(receiptsData)
const embalmingTasksStore = createMemoryStore<EmbalmingTask>(initEmbalmingTasks(receiptsData.map((r) => r.id)))
const farewellHallsData = initFarewellHalls()
const farewellHallsStore = createMemoryStore<FarewellHall>(farewellHallsData)
const farewellReservationsStore = createMemoryStore<FarewellReservation>(initFarewellReservations(receiptsData.map((r) => r.id), farewellHallsData.map((h) => h.id)))
const cremationFurnacesData = initCremationFurnaces()
const cremationFurnacesStore = createMemoryStore<CremationFurnace>(cremationFurnacesData)
const cremationTasksStore = createMemoryStore<CremationTask>(initCremationTasks(receiptsData.map((r) => r.id), cremationFurnacesData.map((f) => f.id)))
const storageNichesData = initStorageNiches()
const storageNichesStore = createMemoryStore<StorageNiche>(storageNichesData)
const storageContractsStore = createMemoryStore<StorageContract>(initStorageContracts(receiptsData.map((r) => r.id), storageNichesData.map((n) => n.id)))
const vehiclesData = initVehicles()
const vehiclesStore = createMemoryStore<Vehicle>(vehiclesData)
const vehicleTasksStore = createMemoryStore<VehicleTask>(initVehicleTasks(receiptsData.map((r) => r.id), vehiclesData.map((v) => v.id)))
const notificationsStore = createMemoryStore<Notification>(initNotifications())
const dailyReportsStore = createMemoryStore<DailyReport>([])

export const users = {
  ...usersStore,
  async getAll(): Promise<User[]> {
    return (await usersStore.getAll()).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  },
  async getByUsername(username: string): Promise<User | undefined> {
    return usersStore.findOne((u) => u.username === username)
  },
  async getByRole(role: string): Promise<User[]> {
    return usersStore.filter((u) => u.role === role)
  },
}

export const receipts = {
  ...receiptsStore,
  async getAll(filters?: { status?: string; keyword?: string }): Promise<Receipt[]> {
    let list = await receiptsStore.getAll()
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status)
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase()
      list = list.filter(
        (r) =>
          r.deceased_name.toLowerCase().includes(kw) ||
          r.family_name.toLowerCase().includes(kw) ||
          r.death_certificate_no.toLowerCase().includes(kw) ||
          r.police_record_no.toLowerCase().includes(kw) ||
          r.family_phone.toLowerCase().includes(kw),
      )
    }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  },
}

export const embalmingTasks = {
  ...embalmingTasksStore,
  async getAll(filters?: { status?: string }): Promise<EmbalmingTask[]> {
    let list = await embalmingTasksStore.getAll()
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status)
    }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  },
  async getByReceiptId(receiptId: string): Promise<EmbalmingTask[]> {
    return embalmingTasksStore.filter((t) => t.receipt_id === receiptId)
  },
}

export const farewellHalls = {
  ...farewellHallsStore,
  async getAll(): Promise<FarewellHall[]> {
    return (await farewellHallsStore.getAll()).sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name))
  },
}

export const farewellReservations = {
  ...farewellReservationsStore,
  async getAll(filters?: { hallId?: string; status?: string }): Promise<FarewellReservation[]> {
    let list = await farewellReservationsStore.getAll()
    if (filters?.hallId) {
      list = list.filter((r) => r.hall_id === filters.hallId)
    }
    if (filters?.status) {
      list = list.filter((r) => r.status === filters.status)
    }
    return list.sort((a, b) => b.start_time.localeCompare(a.start_time))
  },
  async getByHallIdAndDate(hallId: string, date: string): Promise<FarewellReservation[]> {
    const list = await farewellReservationsStore.getAll()
    return list
      .filter((r) => r.hall_id === hallId && r.start_time.slice(0, 10) === date)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
  },
}

export const cremationFurnaces = {
  ...cremationFurnacesStore,
  async getAll(): Promise<CremationFurnace[]> {
    return (await cremationFurnacesStore.getAll()).sort((a, b) => a.name.localeCompare(b.name))
  },
}

export const cremationTasks = {
  ...cremationTasksStore,
  async getAll(filters?: { status?: string }): Promise<CremationTask[]> {
    let list = await cremationTasksStore.getAll()
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status)
    }
    return list.sort((a, b) => a.queue_position - b.queue_position || a.scheduled_time.localeCompare(b.scheduled_time))
  },
  async getByFurnaceId(furnaceId: string): Promise<CremationTask[]> {
    const list = await cremationTasksStore.getAll()
    return list.filter((t) => t.furnace_id === furnaceId).sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time))
  },
}

export const storageNiches = {
  ...storageNichesStore,
  async getAll(filters?: { area?: string; status?: string; type?: string }): Promise<StorageNiche[]> {
    let list = await storageNichesStore.getAll()
    if (filters?.area) {
      list = list.filter((n) => n.area === filters.area)
    }
    if (filters?.status) {
      list = list.filter((n) => n.status === filters.status)
    }
    if (filters?.type) {
      list = list.filter((n) => n.type === filters.type)
    }
    return list.sort((a, b) => a.area.localeCompare(b.area) || a.row_num - b.row_num || a.col_num - b.col_num || a.level_num - b.level_num)
  },
  async getByPosition(area: string, row: number, col: number, level: number): Promise<StorageNiche | undefined> {
    return storageNichesStore.findOne((n) => n.area === area && n.row_num === row && n.col_num === col && n.level_num === level)
  },
}

export const storageContracts = {
  ...storageContractsStore,
  async getAll(filters?: { status?: string }): Promise<StorageContract[]> {
    let list = await storageContractsStore.getAll()
    if (filters?.status) {
      list = list.filter((c) => c.status === filters.status)
    }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  },
  async getByNicheId(nicheId: string): Promise<StorageContract[]> {
    const list = await storageContractsStore.getAll()
    return list.filter((c) => c.niche_id === nicheId).sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  },
}

export const vehicles = {
  ...vehiclesStore,
  async getAll(filters?: { status?: string }): Promise<Vehicle[]> {
    let list = await vehiclesStore.getAll()
    if (filters?.status) {
      list = list.filter((v) => v.status === filters.status)
    }
    return list.sort((a, b) => a.plate_no.localeCompare(b.plate_no))
  },
}

export const vehicleTasks = {
  ...vehicleTasksStore,
  async getAll(filters?: { status?: string; driverId?: string; vehicleId?: string }): Promise<VehicleTask[]> {
    let list = await vehicleTasksStore.getAll()
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status)
    }
    if (filters?.driverId) {
      list = list.filter((t) => t.driver_id === filters.driverId)
    }
    if (filters?.vehicleId) {
      list = list.filter((t) => t.vehicle_id === filters.vehicleId)
    }
    return list.sort((a, b) => b.scheduled_time.localeCompare(a.scheduled_time))
  },
}

export const notifications = {
  ...notificationsStore,
  async getAll(filters?: { type?: string; isRead?: number; recipientId?: string; keyword?: string }): Promise<Notification[]> {
    let list = await notificationsStore.getAll()
    if (filters?.type) {
      list = list.filter((n) => n.type === filters.type)
    }
    if (filters?.isRead !== undefined) {
      list = list.filter((n) => n.is_read === filters.isRead)
    }
    if (filters?.recipientId) {
      list = list.filter((n) => n.recipient_id === filters.recipientId)
    }
    if (filters?.keyword) {
      const kw = filters.keyword.toLowerCase()
      list = list.filter(
        (n) =>
          n.title.toLowerCase().includes(kw) ||
          n.content.toLowerCase().includes(kw),
      )
    }
    return list.sort((a, b) => (b.created_at || '').localeCompare(a.created_at || ''))
  },
  async markAllRead(recipientId: string): Promise<{ lastID: number; changes: number }> {
    const list = await notificationsStore.getAll()
    const unread = list.filter((n) => n.recipient_id === recipientId && n.is_read === 0)
    for (const n of unread) {
      await notificationsStore.update(n.id, { is_read: 1 })
    }
    return { lastID: 0, changes: unread.length }
  },
}

export const dailyReports = {
  ...dailyReportsStore,
  async getAll(): Promise<DailyReport[]> {
    return (await dailyReportsStore.getAll()).sort((a, b) => b.report_date.localeCompare(a.report_date))
  },
  async getByDate(date: string): Promise<DailyReport | undefined> {
    return dailyReportsStore.findOne((r) => r.report_date === date)
  },
}

export function createTables(): Promise<void> {
  console.log('Memory store initialized')
  return Promise.resolve()
}

export function initMockData(): Promise<void> {
  console.log('Mock data initialized in memory')
  return Promise.resolve()
}

import type {
  Receipt,
  EmbalmingTask,
  FarewellHall,
  FarewellReservation,
  CremationFurnace,
  CremationTask,
  StorageNiche,
  StorageContract,
  Vehicle,
  VehicleTask,
  Notification,
} from '../db/memoryStore.js'

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function transformToCamel<T>(obj: any): T {
  if (obj === null || obj === undefined) {
    return obj as T
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => transformToCamel<Record<string, any>>(item)) as unknown as T
  }

  if (typeof obj === 'object' && obj.constructor === Object) {
    const result: Record<string, any> = {}
    for (const key of Object.keys(obj)) {
      const camelKey = toCamelCase(key)
      result[camelKey] = transformToCamel<Record<string, any>>(obj[key])
    }
    return result as T
  }

  return obj as T
}

export function transformReceipt(receipt: Receipt): {
  id: string
  name: string
  gender: string
  age: number
  idCard: string
  dateOfDeath: string
  causeOfDeath: string
  deathCertificateNo: string
  policeRecordNo: string
  status: string
  familyName: string
  familyPhone: string
  familyRelation: string
  receiptTime: string
  verificationResult: string
  createdAt: string
  updatedAt: string
} {
  const camel = transformToCamel<Record<string, any>>(receipt)
  return {
    id: camel.id,
    name: camel.deceasedName,
    gender: camel.deceasedGender,
    age: camel.deceasedAge,
    idCard: camel.deceasedIdCard,
    dateOfDeath: camel.dateOfDeath,
    causeOfDeath: camel.causeOfDeath,
    deathCertificateNo: camel.deathCertificateNo,
    policeRecordNo: camel.policeRecordNo,
    status: camel.status,
    familyName: camel.familyName,
    familyPhone: camel.familyPhone,
    familyRelation: camel.familyRelation,
    receiptTime: camel.receiptTime,
    verificationResult: camel.verificationResult,
    createdAt: camel.createdAt,
    updatedAt: camel.updatedAt,
  }
}

export function transformEmbalmingTask(task: EmbalmingTask, extra?: { deceasedName?: string; assigneeName?: string }): {
  id: string
  receiptId: string
  deceasedName: string
  bodyCondition: string
  taskType: string
  assigneeId: string
  assigneeName?: string
  status: string
  priority: string
  estimatedDuration: number
  startTime?: string
  endTime?: string
  notes: string
  createdAt: string
} {
  const camel = transformToCamel<Record<string, any>>(task)
  return {
    id: camel.id,
    receiptId: camel.receiptId,
    deceasedName: extra?.deceasedName || '',
    bodyCondition: camel.bodyCondition,
    taskType: camel.taskType,
    assigneeId: camel.assigneeId,
    assigneeName: extra?.assigneeName,
    status: camel.status,
    priority: camel.priority,
    estimatedDuration: camel.estimatedDuration,
    startTime: camel.startTime,
    endTime: camel.endTime,
    notes: camel.notes,
    createdAt: camel.createdAt,
  }
}

export function transformFarewellHall(hall: FarewellHall): {
  id: string
  name: string
  capacity: number
  facilities: string[]
  floor: number
  status: string
} {
  const camel = transformToCamel<Record<string, any>>(hall)
  return {
    id: camel.id,
    name: camel.name,
    capacity: camel.capacity,
    facilities: typeof camel.facilities === 'string' ? JSON.parse(camel.facilities) : camel.facilities || [],
    floor: camel.floor,
    status: camel.status,
  }
}

export function transformFarewellReservation(reservation: FarewellReservation, extra?: { hallName?: string; deceasedName?: string }): {
  id: string
  hallId: string
  hallName?: string
  receiptId: string
  deceasedName: string
  attendeeCount: number
  durationMinutes: number
  startTime: string
  endTime: string
  status: string
  familyName: string
  familyPhone: string
  createdAt: string
} {
  const camel = transformToCamel<Record<string, any>>(reservation)
  return {
    id: camel.id,
    hallId: camel.hallId,
    hallName: extra?.hallName,
    receiptId: camel.receiptId,
    deceasedName: extra?.deceasedName || '',
    attendeeCount: camel.attendeeCount,
    durationMinutes: camel.durationMinutes,
    startTime: camel.startTime,
    endTime: camel.endTime,
    status: camel.status,
    familyName: camel.familyName,
    familyPhone: camel.familyPhone,
    createdAt: camel.createdAt,
  }
}

export function transformCremationFurnace(furnace: CremationFurnace): {
  id: string
  name: string
  type: string
  fuelType: string
  fuelLevel: number
  status: string
  currentTaskId?: string
  estimatedFinishTime?: string
} {
  const camel = transformToCamel<Record<string, any>>(furnace)
  return {
    id: camel.id,
    name: camel.name,
    type: camel.type,
    fuelType: camel.fuelType,
    fuelLevel: camel.fuelLevel,
    status: camel.status,
    currentTaskId: camel.currentTaskId,
    estimatedFinishTime: camel.estimatedFinishTime,
  }
}

export function transformCremationTask(task: CremationTask, extra?: { deceasedName?: string; furnaceName?: string }): {
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
  status: string
  estimatedDuration: number
  overdue: number
  createdAt?: string
} {
  const camel = transformToCamel<Record<string, any>>(task)
  return {
    id: camel.id,
    receiptId: camel.receiptId,
    deceasedName: extra?.deceasedName || '',
    furnaceId: camel.furnaceId,
    furnaceName: extra?.furnaceName,
    furnaceType: camel.furnaceType,
    queuePosition: camel.queuePosition,
    scheduledTime: camel.scheduledTime,
    startTime: camel.startTime,
    endTime: camel.endTime,
    status: camel.status,
    estimatedDuration: camel.estimatedDuration,
    overdue: camel.overdue,
    createdAt: camel.createdAt,
  }
}

export function transformStorageNiche(niche: StorageNiche): {
  id: string
  area: string
  row: number
  col: number
  level: number
  type: string
  price: number
  status: string
} {
  const camel = transformToCamel<Record<string, any>>(niche)
  return {
    id: camel.id,
    area: camel.area,
    row: camel.rowNum,
    col: camel.colNum,
    level: camel.levelNum,
    type: camel.type,
    price: camel.price,
    status: camel.status,
  }
}

export function transformStorageContract(contract: StorageContract, extra?: { deceasedName?: string; nicheInfo?: unknown; qrCode?: string }): {
  id: string
  nicheId: string
  nicheInfo?: unknown
  receiptId: string
  deceasedName: string
  familyName: string
  familyPhone: string
  familyIdCard: string
  startDate: string
  endDate: string
  years: number
  status: string
  certificateNo: string
  qrCode?: string
  createdAt: string
} {
  const camel = transformToCamel<Record<string, any>>(contract)
  return {
    id: camel.id,
    nicheId: camel.nicheId,
    nicheInfo: extra?.nicheInfo,
    receiptId: camel.receiptId,
    deceasedName: extra?.deceasedName || '',
    familyName: camel.familyName,
    familyPhone: camel.familyPhone,
    familyIdCard: camel.familyIdCard,
    startDate: camel.startDate,
    endDate: camel.endDate,
    years: camel.years,
    status: camel.status,
    certificateNo: camel.certificateNo,
    qrCode: extra?.qrCode,
    createdAt: camel.createdAt,
  }
}

export function transformVehicle(vehicle: Vehicle): {
  id: string
  plateNo: string
  model: string
  type: string
  capacity: number
  currentLoad: number
  fuelLevel: number
  status: string
  driverId?: string
  driverName?: string
  currentLat?: number
  currentLng?: number
  currentTaskId?: string
  estimatedArrivalTime?: string
} {
  const camel = transformToCamel<Record<string, any>>(vehicle)
  return {
    id: camel.id,
    plateNo: camel.plateNo,
    model: camel.model,
    type: camel.type,
    capacity: camel.capacity,
    currentLoad: camel.currentLoad,
    fuelLevel: camel.fuelLevel,
    status: camel.status,
    driverId: camel.driverId,
    driverName: camel.driverName,
    currentLat: camel.currentLat,
    currentLng: camel.currentLng,
    currentTaskId: camel.currentTaskId,
    estimatedArrivalTime: camel.estimatedArrivalTime,
  }
}

export function transformVehicleTask(task: VehicleTask, extra?: { plateNo?: string; driverName?: string }): {
  id: string
  vehicleId: string
  plateNo?: string
  driverId: string
  driverName?: string
  receiptId?: string
  taskType: string
  originAddress: string
  originLat: number
  originLng: number
  destAddress: string
  destLat: number
  destLng: number
  scheduledTime: string
  estimatedDuration: number
  distanceKm: number
  status: string
  route?: string
  trackLog?: string
  createdAt?: string
} {
  const camel = transformToCamel<Record<string, any>>(task)
  return {
    id: camel.id,
    vehicleId: camel.vehicleId,
    plateNo: extra?.plateNo,
    driverId: camel.driverId,
    driverName: extra?.driverName,
    receiptId: camel.receiptId,
    taskType: camel.taskType,
    originAddress: camel.originAddress,
    originLat: camel.originLat,
    originLng: camel.originLng,
    destAddress: camel.destAddress,
    destLat: camel.destLat,
    destLng: camel.destLng,
    scheduledTime: camel.scheduledTime,
    estimatedDuration: camel.estimatedDuration,
    distanceKm: camel.distanceKm,
    status: camel.status,
    route: camel.route,
    trackLog: camel.trackLog,
    createdAt: camel.createdAt,
  }
}

export function transformNotification(notification: Notification): {
  id: string
  type: string
  priority: string
  title: string
  content: string
  relatedId?: string
  relatedType?: string
  recipientId: string
  recipientRole: string
  read: boolean
  createdAt: string
} {
  const camel = transformToCamel<Record<string, any>>(notification)
  return {
    id: camel.id,
    type: camel.type,
    priority: camel.priority,
    title: camel.title,
    content: camel.content,
    relatedId: camel.relatedId,
    relatedType: camel.relatedType,
    recipientId: camel.recipientId,
    recipientRole: camel.recipientRole,
    read: camel.isRead === 1 || camel.isRead === true,
    createdAt: camel.createdAt,
  }
}

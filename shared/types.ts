/**
 * 用户角色类型
 * admin: 管理员
 * dispatcher: 调度员
 * embalmer: 防腐整容师
 * cremator: 火化操作员
 * driver: 司机
 * family: 家属
 */
export type UserRole = 'admin' | 'dispatcher' | 'embalmer' | 'cremator' | 'driver' | 'family';

/**
 * 用户信息
 */
export interface User {
  /** 用户唯一标识 */
  id: string;
  /** 登录用户名 */
  username: string;
  /** 用户姓名 */
  name: string;
  /** 用户角色 */
  role: UserRole;
  /** 联系电话 */
  phone?: string;
  /** 头像地址 */
  avatar?: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 登录请求
 */
export interface LoginRequest {
  /** 用户名 */
  username: string;
  /** 密码 */
  password: string;
}

/**
 * 登录响应
 */
export interface LoginResponse {
  /** JWT 认证令牌 */
  token: string;
  /** 用户信息 */
  user: User;
}

/**
 * 遗体接收状态
 * pending: 待校验
 * verified: 已校验通过
 * rejected: 已退回补正
 * processing: 处理中
 */
export type ReceiptStatus = 'pending' | 'verified' | 'rejected' | 'processing';

/**
 * 校验结果
 */
export interface VerificationResult {
  /** 死亡证明是否有效 */
  deathCertValid: boolean;
  /** 公安备案是否有效 */
  policeRecordValid: boolean;
  /** 存在的问题列表 */
  issues: string[];
}

/**
 * 逝者信息 / 遗体接收登记
 */
export interface DeceasedInfo {
  /** 记录唯一标识 */
  id?: string;
  /** 逝者姓名 */
  name: string;
  /** 性别 */
  gender: 'male' | 'female';
  /** 年龄 */
  age: number;
  /** 身份证号 */
  idCard: string;
  /** 死亡日期 */
  dateOfDeath: string;
  /** 死亡原因 */
  causeOfDeath: string;
  /** 死亡证明编号 */
  deathCertificateNo: string;
  /** 公安备案编号 */
  policeRecordNo: string;
  /** 接收状态 */
  status: ReceiptStatus;
  /** 家属姓名 */
  familyName: string;
  /** 家属联系电话 */
  familyPhone: string;
  /** 与逝者关系 */
  familyRelation: string;
  /** 接收时间 */
  receiptTime?: string;
  /** 校验结果 */
  verificationResult?: VerificationResult;
  /** 创建时间 */
  createdAt?: string;
  /** 更新时间 */
  updatedAt?: string;
}

/**
 * 遗体接收记录（与 DeceasedInfo 同义，便于业务区分）
 */
export type Receipt = DeceasedInfo;

/**
 * 遗体状态
 * normal: 正常
 * damaged: 有损伤
 * advanced_decay: 高度腐败
 */
export type BodyCondition = 'normal' | 'damaged' | 'advanced_decay';

/**
 * 防腐整容任务类型
 * preservation: 防腐
 * cosmetics: 整容
 * both: 防腐+整容
 */
export type EmbalmingTaskType = 'preservation' | 'cosmetics' | 'both';

/**
 * 任务优先级
 * low: 低
 * normal: 普通
 * high: 高
 * urgent: 紧急
 */
export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent';

/**
 * 任务状态
 * pending: 待处理
 * in_progress: 进行中
 * completed: 已完成
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed';

/**
 * 防腐整容任务
 */
export interface EmbalmingTask {
  /** 任务唯一标识 */
  id: string;
  /** 关联接收记录ID */
  receiptId: string;
  /** 逝者姓名 */
  deceasedName: string;
  /** 遗体状态 */
  bodyCondition: BodyCondition;
  /** 任务类型 */
  taskType: EmbalmingTaskType;
  /** 分配人员ID */
  assigneeId?: string;
  /** 分配人员姓名 */
  assigneeName?: string;
  /** 任务状态 */
  status: TaskStatus;
  /** 优先级 */
  priority: TaskPriority;
  /** 预估耗时（分钟） */
  estimatedDuration: number;
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 备注 */
  notes?: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 告别厅状态
 * available: 可用
 * maintenance: 维护中
 */
export type HallStatus = 'available' | 'maintenance';

/**
 * 告别厅
 */
export interface FarewellHall {
  /** 厅室唯一标识 */
  id: string;
  /** 厅室名称 */
  name: string;
  /** 容纳人数 */
  capacity: number;
  /** 配套设施列表 */
  facilities: string[];
  /** 所在楼层 */
  floor: number;
  /** 厅室状态 */
  status: HallStatus;
}

/**
 * 预约状态
 * reserved: 已预约
 * in_progress: 进行中
 * completed: 已完成
 * cancelled: 已取消
 */
export type ReservationStatus = 'reserved' | 'in_progress' | 'completed' | 'cancelled';

/**
 * 告别厅预约
 */
export interface FarewellReservation {
  /** 预约唯一标识 */
  id?: string;
  /** 厅室ID */
  hallId: string;
  /** 厅室名称 */
  hallName?: string;
  /** 关联接收记录ID */
  receiptId: string;
  /** 逝者姓名 */
  deceasedName: string;
  /** 参加人数 */
  attendeeCount: number;
  /** 持续时长（分钟） */
  durationMinutes: number;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 预约状态 */
  status: ReservationStatus;
  /** 家属姓名 */
  familyName: string;
  /** 家属联系电话 */
  familyPhone: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 时间段
 */
export interface TimeSlot {
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
}

/**
 * 冲突时间段
 */
export interface ConflictSlot extends TimeSlot {
  /** 冲突原因 */
  reason: string;
}

/**
 * 厅室推荐结果
 */
export interface HallSuggestion {
  /** 厅室ID */
  hallId: string;
  /** 厅室名称 */
  hallName: string;
  /** 容纳人数 */
  capacity: number;
  /** 推荐可用时段列表 */
  suggestedSlots: TimeSlot[];
  /** 冲突时段列表 */
  conflictSlots: ConflictSlot[];
  /** 替代时段列表 */
  alternativeSlots: TimeSlot[];
}

/**
 * 火化炉类型
 * standard: 标准
 * premium: 高档
 * environmental: 环保
 */
export type FurnaceType = 'standard' | 'premium' | 'environmental';

/**
 * 燃料类型
 * gas: 燃气
 * oil: 燃油
 * electric: 电力
 */
export type FuelType = 'gas' | 'oil' | 'electric';

/**
 * 火化炉状态
 * idle: 空闲
 * running: 运行中
 * maintenance: 维护中
 */
export type FurnaceStatus = 'idle' | 'running' | 'maintenance';

/**
 * 火化炉
 */
export interface CremationFurnace {
  /** 火化炉唯一标识 */
  id: string;
  /** 火化炉名称 */
  name: string;
  /** 火化炉类型 */
  type: FurnaceType;
  /** 燃料类型 */
  fuelType: FuelType;
  /** 燃料量（0-100） */
  fuelLevel: number;
  /** 状态 */
  status: FurnaceStatus;
  /** 当前执行的任务ID */
  currentTaskId?: string;
  /** 预计完成时间 */
  estimatedFinishTime?: string;
}

/**
 * 火化任务状态
 * queued: 排队中
 * pending: 待开始
 * in_progress: 进行中
 * completed: 已完成
 * overdue: 已超时
 */
export type CremationTaskStatus = 'queued' | 'pending' | 'in_progress' | 'completed' | 'overdue';

/**
 * 火化任务
 */
export interface CremationTask {
  /** 任务唯一标识 */
  id: string;
  /** 关联接收记录ID */
  receiptId: string;
  /** 逝者姓名 */
  deceasedName: string;
  /** 火化炉ID */
  furnaceId?: string;
  /** 火化炉名称 */
  furnaceName?: string;
  /** 火化炉类型 */
  furnaceType: string;
  /** 队列位置 */
  queuePosition: number;
  /** 计划时间 */
  scheduledTime: string;
  /** 开始时间 */
  startTime?: string;
  /** 结束时间 */
  endTime?: string;
  /** 任务状态 */
  status: CremationTaskStatus;
  /** 预估耗时（分钟） */
  estimatedDuration: number;
  /** 是否超时 */
  overdue: boolean;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 格位类型
 * single: 单人
 * double: 双人
 * family: 家庭
 */
export type NicheType = 'single' | 'double' | 'family';

/**
 * 格位状态
 * available: 可用
 * occupied: 已占用
 * reserved: 已预订
 * maintenance: 维护中
 */
export type NicheStatus = 'available' | 'occupied' | 'reserved' | 'maintenance';

/**
 * 骨灰格位
 */
export interface StorageNiche {
  /** 格位唯一标识 */
  id: string;
  /** 所属区域 */
  area: string;
  /** 行号 */
  row: number;
  /** 列号 */
  col: number;
  /** 层数 */
  level: number;
  /** 格位类型 */
  type: NicheType;
  /** 价格 */
  price: number;
  /** 状态 */
  status: NicheStatus;
}

/**
 * 格位简要信息
 */
export interface NicheInfo {
  /** 所属区域 */
  area: string;
  /** 行号 */
  row: number;
  /** 列号 */
  col: number;
  /** 层数 */
  level: number;
  /** 格位类型 */
  type: string;
}

/**
 * 合同状态
 * active: 有效
 * expired: 已过期
 * transferred: 已转存
 */
export type ContractStatus = 'active' | 'expired' | 'transferred';

/**
 * 骨灰存放合同
 */
export interface StorageContract {
  /** 合同唯一标识 */
  id?: string;
  /** 格位ID */
  nicheId: string;
  /** 格位信息 */
  nicheInfo?: NicheInfo;
  /** 关联接收记录ID */
  receiptId: string;
  /** 逝者姓名 */
  deceasedName: string;
  /** 家属姓名 */
  familyName: string;
  /** 家属联系电话 */
  familyPhone: string;
  /** 家属身份证号 */
  familyIdCard: string;
  /** 存放开始日期 */
  startDate: string;
  /** 存放结束日期 */
  endDate: string;
  /** 存放年限 */
  years: number;
  /** 合同状态 */
  status: ContractStatus;
  /** 凭证编号 */
  certificateNo: string;
  /** 二维码（Base64或URL） */
  qrCode?: string;
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 车辆类型
 * sedan: 轿车
 * van: 面包车
 * luxury: 豪华车
 */
export type VehicleType = 'sedan' | 'van' | 'luxury';

/**
 * 车辆状态
 * idle: 空闲
 * in_transit: 运输中
 * maintenance: 维护中
 */
export type VehicleStatus = 'idle' | 'in_transit' | 'maintenance';

/**
 * 地理位置信息
 */
export interface Location {
  /** 地址文本 */
  address: string;
  /** 纬度 */
  lat: number;
  /** 经度 */
  lng: number;
}

/**
 * 轨迹点
 */
export interface TrackPoint {
  /** 纬度 */
  lat: number;
  /** 经度 */
  lng: number;
  /** 时间戳 */
  timestamp: string;
}

/**
 * 灵车
 */
export interface Vehicle {
  /** 车辆唯一标识 */
  id: string;
  /** 车牌号 */
  plateNo: string;
  /** 车型 */
  model: string;
  /** 车辆类型 */
  type: VehicleType;
  /** 核载人数 */
  capacity: number;
  /** 当前载客数 */
  currentLoad: number;
  /** 油量（0-100） */
  fuelLevel: number;
  /** 车辆状态 */
  status: VehicleStatus;
  /** 司机ID */
  driverId?: string;
  /** 司机姓名 */
  driverName?: string;
  /** 当前位置 */
  currentLocation: Location;
}

/**
 * 出车任务类型
 * pickup: 接运
 * transfer: 转运
 * delivery: 送返
 */
export type VehicleTaskType = 'pickup' | 'transfer' | 'delivery';

/**
 * 出车任务状态
 * pending: 待出发
 * in_progress: 进行中
 * completed: 已完成
 * delayed: 已延误
 */
export type VehicleTaskStatus = 'pending' | 'in_progress' | 'completed' | 'delayed';

/**
 * 出车任务
 */
export interface VehicleTask {
  /** 任务唯一标识 */
  id?: string;
  /** 车辆ID */
  vehicleId: string;
  /** 车牌号 */
  vehiclePlate?: string;
  /** 司机ID */
  driverId: string;
  /** 司机姓名 */
  driverName?: string;
  /** 关联接收记录ID */
  receiptId?: string;
  /** 任务类型 */
  taskType: VehicleTaskType;
  /** 出发地 */
  origin: Location;
  /** 目的地 */
  destination: Location;
  /** 计划出发时间 */
  scheduledTime: string;
  /** 预估耗时（分钟） */
  estimatedDuration: number;
  /** 距离（公里） */
  distanceKm: number;
  /** 任务状态 */
  status: VehicleTaskStatus;
  /** 规划路线坐标点列表 */
  route: { lat: number; lng: number }[];
  /** 当前实时位置 */
  currentPosition?: TrackPoint;
  /** 行驶轨迹日志 */
  trackLog: TrackPoint[];
  /** 创建时间 */
  createdAt?: string;
}

/**
 * 车辆调度推荐
 */
export interface DispatchSuggestion {
  /** 车辆ID */
  vehicleId: string;
  /** 车牌号 */
  vehiclePlate: string;
  /** 司机姓名 */
  driverName: string;
  /** 距离（公里） */
  distanceKm: number;
  /** 预计到达时间 */
  estimatedArrival: string;
  /** 当前载客数 */
  currentLoad: number;
  /** 综合评分（越高越推荐） */
  score: number;
}

/**
 * 通知类型
 * receipt: 遗体接收
 * embalming: 防腐整容
 * farewell: 告别厅
 * cremation: 火化
 * storage: 骨灰存放
 * vehicle: 灵车调度
 * system: 系统通知
 */
export type NotificationType = 'receipt' | 'embalming' | 'farewell' | 'cremation' | 'storage' | 'vehicle' | 'system';

/**
 * 通知消息
 */
export interface Notification {
  /** 消息唯一标识 */
  id: string;
  /** 通知类型 */
  type: NotificationType;
  /** 优先级 */
  priority: TaskPriority;
  /** 标题 */
  title: string;
  /** 内容 */
  content: string;
  /** 关联业务ID */
  relatedId?: string;
  /** 关联业务类型 */
  relatedType?: string;
  /** 接收人ID */
  recipientId: string;
  /** 接收人角色 */
  recipientRole: string;
  /** 是否已读 */
  read: boolean;
  /** 创建时间 */
  createdAt: string;
}

/**
 * 告别厅使用统计
 */
export interface HallUsageStat {
  /** 厅室ID */
  hallId: string;
  /** 厅室名称 */
  hallName: string;
  /** 使用率（0-100） */
  usageRate: number;
  /** 预约次数 */
  reservations: number;
}

/**
 * 日报统计数据
 */
export interface DailyStatistics {
  /** 接收登记数量 */
  receiptCount: number;
  /** 已完成防腐整容数量 */
  embalmingCompleted: number;
  /** 防腐整容总任务数 */
  embalmingTotal: number;
  /** 告别厅使用统计列表 */
  farewellHalls: HallUsageStat[];
  /** 火化总任务数 */
  cremationTotal: number;
  /** 已完成火化数量 */
  cremationCompleted: number;
  /** 火化完成率（0-100） */
  cremationRate: number;
  /** 出车总任务数 */
  vehicleTotal: number;
  /** 准点出车数量 */
  vehicleOnTime: number;
  /** 车辆准点率（0-100） */
  vehicleOnTimeRate: number;
  /** 新增存放合同数量 */
  storageNew: number;
}

/**
 * 日报
 */
export interface DailyReport {
  /** 报表日期 */
  date: string;
  /** 统计区域（可选） */
  area?: string;
  /** 统计数据 */
  statistics: DailyStatistics;
  /** 生成时间 */
  generatedAt?: string;
}

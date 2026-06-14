import { Router, type Request, type Response } from 'express'
import { vehicles, vehicleTasks, type Vehicle, type VehicleTask } from '../db/index.js'

const router = Router()

function haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query
    const filters: { status?: string } = {}
    if (status && typeof status === 'string') {
      filters.status = status
    }
    const list = await vehicles.getAll(filters)
    res.json({
      success: true,
      data: list,
      message: '获取车辆列表成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取车辆列表失败',
    })
  }
})

router.get('/:id/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const vehicle = await vehicles.getById(id)
    if (!vehicle) {
      res.status(404).json({
        success: false,
        data: null,
        message: '车辆不存在',
      })
      return
    }
    const tasks = await vehicleTasks.getAll({ vehicleId: id })
    const latestTask = tasks[0]
    const trackLogs: Array<{ lat: number; lng: number; time: string; address?: string }> = []
    if (latestTask?.track_log) {
      try {
        const parsed = JSON.parse(latestTask.track_log)
        if (Array.isArray(parsed)) {
          trackLogs.push(...parsed)
        }
      } catch {
      }
    }
    if (vehicle.current_lat && vehicle.current_lng) {
      trackLogs.push({
        lat: vehicle.current_lat,
        lng: vehicle.current_lng,
        time: new Date().toISOString(),
        address: vehicle.current_address,
      })
    }
    res.json({
      success: true,
      data: {
        vehicle,
        currentTask: latestTask || null,
        track: trackLogs,
      },
      message: '获取车辆轨迹成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取车辆轨迹失败',
    })
  }
})

router.get('/dispatch-suggest', async (req: Request, res: Response): Promise<void> => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query
    if (!originLat || !originLng || !destLat || !destLng) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数: originLat, originLng, destLat, destLng',
      })
      return
    }
    const oLat = parseFloat(originLat as string)
    const oLng = parseFloat(originLng as string)
    const dLat = parseFloat(destLat as string)
    const dLng = parseFloat(destLng as string)
    if ([oLat, oLng, dLat, dLng].some((v) => isNaN(v))) {
      res.status(400).json({
        success: false,
        data: null,
        message: '坐标参数格式错误',
      })
      return
    }
    const allVehicles = await vehicles.getAll()
    const totalDistance = haversineDistance(oLat, oLng, dLat, dLng)
    const scored = allVehicles.map((v: Vehicle) => {
      const vLat = v.current_lat ?? 0
      const vLng = v.current_lng ?? 0
      const distanceToOrigin = haversineDistance(vLat, vLng, oLat, oLng)
      let score = 0
      if (v.status === 'idle') {
        score += 50
      } else if (v.status === 'in_transit') {
        score += 10
      }
      if (distanceToOrigin <= 5) {
        score += 30
      } else if (distanceToOrigin <= 15) {
        score += 20
      } else if (distanceToOrigin <= 30) {
        score += 10
      } else {
        score += 5
      }
      if (v.fuel_level >= 50) {
        score += 10
      } else if (v.fuel_level >= 20) {
        score += 5
      }
      score += Math.max(0, 10 - distanceToOrigin / 5)
      return {
        ...v,
        distanceToOrigin: Number(distanceToOrigin.toFixed(2)),
        totalDistance: Number(totalDistance.toFixed(2)),
        score: Number(score.toFixed(2)),
      }
    })
    scored.sort((a, b) => b.score - a.score)
    res.json({
      success: true,
      data: scored,
      message: '获取调度推荐成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取调度推荐失败',
    })
  }
})

router.post('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as Partial<VehicleTask>
    const requiredFields = ['vehicle_id', 'driver_id', 'task_type', 'origin_address', 'origin_lat', 'origin_lng', 'dest_address', 'dest_lat', 'dest_lng', 'scheduled_time', 'estimated_duration', 'distance_km'] as const
    const missing = requiredFields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '')
    if (missing.length > 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: `缺少必要字段: ${missing.join(', ')}`,
      })
      return
    }
    const id = `vt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const taskData: Omit<VehicleTask, 'created_at'> = {
      id,
      vehicle_id: body.vehicle_id!,
      driver_id: body.driver_id!,
      receipt_id: body.receipt_id,
      task_type: body.task_type! as 'pickup' | 'transfer' | 'delivery',
      origin_address: body.origin_address!,
      origin_lat: Number(body.origin_lat),
      origin_lng: Number(body.origin_lng),
      dest_address: body.dest_address!,
      dest_lat: Number(body.dest_lat),
      dest_lng: Number(body.dest_lng),
      scheduled_time: body.scheduled_time!,
      estimated_duration: Number(body.estimated_duration),
      distance_km: Number(body.distance_km),
      status: body.status || 'pending',
      route: body.route,
      track_log: body.track_log,
    }
    await vehicleTasks.create(taskData)
    if (taskData.status === 'in_progress') {
      await vehicles.update(taskData.vehicle_id, { status: 'in_transit' })
    }
    const created = await vehicleTasks.getById(id)
    res.json({
      success: true,
      data: created,
      message: '创建出车任务成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '创建出车任务失败',
    })
  }
})

router.put('/tasks/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body as { status?: string }
    if (!status) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少 status 参数',
      })
      return
    }
    const validStatuses = ['pending', 'in_progress', 'completed', 'delayed']
    if (!validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        data: null,
        message: `status 必须是以下值之一: ${validStatuses.join(', ')}`,
      })
      return
    }
    const task = await vehicleTasks.getById(id)
    if (!task) {
      res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在',
      })
      return
    }
    await vehicleTasks.update(id, { status: status as VehicleTask['status'] })
    if (status === 'in_progress') {
      await vehicles.update(task.vehicle_id, { status: 'in_transit' })
    } else if (status === 'completed') {
      await vehicles.update(task.vehicle_id, { status: 'idle' })
    }
    const updated = await vehicleTasks.getById(id)
    res.json({
      success: true,
      data: updated,
      message: '更新任务状态成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '更新任务状态失败',
    })
  }
})

router.post('/tasks/:id/track', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { lat, lng, address } = req.body as { lat?: number; lng?: number; address?: string }
    if (lat === undefined || lng === undefined) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数: lat, lng',
      })
      return
    }
    const task = await vehicleTasks.getById(id)
    if (!task) {
      res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在',
      })
      return
    }
    let trackLogs: Array<{ lat: number; lng: number; time: string; address?: string }> = []
    if (task.track_log) {
      try {
        const parsed = JSON.parse(task.track_log)
        if (Array.isArray(parsed)) {
          trackLogs = parsed
        }
      } catch {
      }
    }
    const newPoint = {
      lat: Number(lat),
      lng: Number(lng),
      time: new Date().toISOString(),
      address,
    }
    trackLogs.push(newPoint)
    await vehicleTasks.update(id, { track_log: JSON.stringify(trackLogs) })
    await vehicles.update(task.vehicle_id, {
      current_lat: Number(lat),
      current_lng: Number(lng),
      current_address: address,
    })
    res.json({
      success: true,
      data: newPoint,
      message: '上报位置成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '上报位置失败',
    })
  }
})

export default router

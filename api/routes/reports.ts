import { Router, type Request, type Response } from 'express'
import * as XLSX from 'xlsx'
import {
  receipts,
  farewellReservations,
  farewellHalls,
  cremationTasks,
  vehicleTasks,
  embalmingTasks,
} from '../db/index.js'

const router = Router()

router.get('/daily', async (req: Request, res: Response): Promise<void> => {
  try {
    const { date, area } = req.query
    const targetDate = (date as string) || new Date().toISOString().slice(0, 10)
    const allReceipts = await receipts.getAll()
    const dayReceipts = allReceipts.filter((r) => r.created_at?.slice(0, 10) === targetDate)
    const allEmbalming = await embalmingTasks.getAll()
    const dayEmbalming = allEmbalming.filter((t) => t.created_at?.slice(0, 10) === targetDate)
    const allFarewell = await farewellReservations.getAll()
    const dayFarewell = allFarewell.filter((r) => r.start_time.slice(0, 10) === targetDate)
    const allCremation = await cremationTasks.getAll()
    const dayCremation = allCremation.filter((t) => t.scheduled_time.slice(0, 10) === targetDate)
    const allVehicleTasks = await vehicleTasks.getAll()
    const dayVehicleTasks = allVehicleTasks.filter((t) => t.scheduled_time.slice(0, 10) === targetDate)
    const data = {
      date: targetDate,
      area: area || null,
      summary: {
        receiptCount: dayReceipts.length,
        receiptPending: dayReceipts.filter((r) => r.status === 'pending').length,
        receiptVerified: dayReceipts.filter((r) => r.status === 'verified').length,
        embalmingCount: dayEmbalming.length,
        embalmingCompleted: dayEmbalming.filter((t) => t.status === 'completed').length,
        farewellCount: dayFarewell.length,
        farewellCompleted: dayFarewell.filter((r) => r.status === 'completed').length,
        cremationCount: dayCremation.length,
        cremationCompleted: dayCremation.filter((t) => t.status === 'completed').length,
        vehicleTaskCount: dayVehicleTasks.length,
        vehicleTaskCompleted: dayVehicleTasks.filter((t) => t.status === 'completed').length,
      },
      receipts: dayReceipts,
      embalmingTasks: dayEmbalming,
      farewellReservations: dayFarewell,
      cremationTasks: dayCremation,
      vehicleTasks: dayVehicleTasks,
    }
    res.json({
      success: true,
      data,
      message: '获取日报数据成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取日报数据失败',
    })
  }
})

router.get('/hall-usage', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数: startDate, endDate',
      })
      return
    }
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        data: null,
        message: '日期格式错误',
      })
      return
    }
    const halls = await farewellHalls.getAll()
    const allReservations = await farewellReservations.getAll()
    const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
    const totalAvailableMinutes = days * 8 * 60
    const usageData = halls.map((hall) => {
      const hallReservations = allReservations.filter((r) => {
        const rDate = new Date(r.start_time)
        return r.hall_id === hall.id &&
          rDate >= start &&
          rDate <= end &&
          r.status !== 'cancelled'
      })
      const usedMinutes = hallReservations.reduce((sum, r) => sum + r.duration_minutes, 0)
      const usageRate = totalAvailableMinutes > 0 ? (usedMinutes / totalAvailableMinutes) * 100 : 0
      return {
        hallId: hall.id,
        hallName: hall.name,
        capacity: hall.capacity,
        floor: hall.floor,
        reservationCount: hallReservations.length,
        usedMinutes,
        totalAvailableMinutes,
        usageRate: Number(usageRate.toFixed(2)),
        reservations: hallReservations,
      }
    })
    const totalUsed = usageData.reduce((sum, h) => sum + h.usedMinutes, 0)
    const totalAvailable = usageData.reduce((sum, h) => sum + h.totalAvailableMinutes, 0)
    const overallRate = totalAvailable > 0 ? (totalUsed / totalAvailable) * 100 : 0
    res.json({
      success: true,
      data: {
        startDate: (startDate as string),
        endDate: (endDate as string),
        days,
        overallUsageRate: Number(overallRate.toFixed(2)),
        halls: usageData,
      },
      message: '获取厅室使用率成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取厅室使用率失败',
    })
  }
})

router.get('/cremation-rate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数: startDate, endDate',
      })
      return
    }
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        data: null,
        message: '日期格式错误',
      })
      return
    }
    const allTasks = await cremationTasks.getAll()
    const periodTasks = allTasks.filter((t) => {
      const tDate = new Date(t.scheduled_time)
      return tDate >= start && tDate <= end
    })
    const total = periodTasks.length
    const completed = periodTasks.filter((t) => t.status === 'completed').length
    const inProgress = periodTasks.filter((t) => t.status === 'in_progress').length
    const queued = periodTasks.filter((t) => t.status === 'queued' || t.status === 'pending').length
    const overdue = periodTasks.filter((t) => t.status === 'overdue').length
    const completionRate = total > 0 ? (completed / total) * 100 : 0
    const dailyStats: Array<{ date: string; total: number; completed: number; rate: number }> = []
    const cur = new Date(start)
    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10)
      const dayTasks = periodTasks.filter((t) => t.scheduled_time.slice(0, 10) === dateStr)
      const dayTotal = dayTasks.length
      const dayCompleted = dayTasks.filter((t) => t.status === 'completed').length
      dailyStats.push({
        date: dateStr,
        total: dayTotal,
        completed: dayCompleted,
        rate: dayTotal > 0 ? Number(((dayCompleted / dayTotal) * 100).toFixed(2)) : 0,
      })
      cur.setDate(cur.getDate() + 1)
    }
    res.json({
      success: true,
      data: {
        startDate: (startDate as string),
        endDate: (endDate as string),
        total,
        completed,
        inProgress,
        queued,
        overdue,
        completionRate: Number(completionRate.toFixed(2)),
        dailyStats,
      },
      message: '获取火化完成率成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取火化完成率失败',
    })
  }
})

router.get('/vehicle-punctuality', async (req: Request, res: Response): Promise<void> => {
  try {
    const { startDate, endDate } = req.query
    if (!startDate || !endDate) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数: startDate, endDate',
      })
      return
    }
    const start = new Date(startDate as string)
    const end = new Date(endDate as string)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      res.status(400).json({
        success: false,
        data: null,
        message: '日期格式错误',
      })
      return
    }
    const allTasks = await vehicleTasks.getAll()
    const periodTasks = allTasks.filter((t) => {
      const tDate = new Date(t.scheduled_time)
      return tDate >= start && tDate <= end
    })
    const total = periodTasks.length
    const completed = periodTasks.filter((t) => t.status === 'completed').length
    const delayed = periodTasks.filter((t) => t.status === 'delayed').length
    const inProgress = periodTasks.filter((t) => t.status === 'in_progress').length
    const pending = periodTasks.filter((t) => t.status === 'pending').length
    const onTime = completed - delayed > 0 ? completed - delayed : 0
    const punctualityRate = completed > 0 ? (onTime / completed) * 100 : total > 0 ? ((completed - delayed) / total) * 100 : 0
    const dailyStats: Array<{ date: string; total: number; completed: number; delayed: number; rate: number }> = []
    const cur = new Date(start)
    while (cur <= end) {
      const dateStr = cur.toISOString().slice(0, 10)
      const dayTasks = periodTasks.filter((t) => t.scheduled_time.slice(0, 10) === dateStr)
      const dayTotal = dayTasks.length
      const dayCompleted = dayTasks.filter((t) => t.status === 'completed').length
      const dayDelayed = dayTasks.filter((t) => t.status === 'delayed').length
      const dayOnTime = dayCompleted - dayDelayed > 0 ? dayCompleted - dayDelayed : 0
      dailyStats.push({
        date: dateStr,
        total: dayTotal,
        completed: dayCompleted,
        delayed: dayDelayed,
        rate: dayCompleted > 0 ? Number(((dayOnTime / dayCompleted) * 100).toFixed(2)) : 0,
      })
      cur.setDate(cur.getDate() + 1)
    }
    res.json({
      success: true,
      data: {
        startDate: (startDate as string),
        endDate: (endDate as string),
        total,
        completed,
        delayed,
        inProgress,
        pending,
        onTime,
        punctualityRate: Number(Math.max(0, punctualityRate).toFixed(2)),
        dailyStats,
      },
      message: '获取灵车准点率成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取灵车准点率失败',
    })
  }
})

router.get('/export', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, startDate, endDate, area } = req.query
    if (!type) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数: type',
      })
      return
    }
    const validTypes = ['daily', 'hall-usage', 'cremation-rate', 'vehicle-punctuality']
    if (!validTypes.includes(type as string)) {
      res.status(400).json({
        success: false,
        data: null,
        message: `type 必须是以下值之一: ${validTypes.join(', ')}`,
      })
      return
    }
    let wb: XLSX.WorkBook
    let fileName = ''
    if (type === 'daily') {
      const targetDate = (startDate as string) || new Date().toISOString().slice(0, 10)
      const allReceipts = await receipts.getAll()
      const dayReceipts = allReceipts.filter((r) => r.created_at?.slice(0, 10) === targetDate)
      const allEmbalming = await embalmingTasks.getAll()
      const dayEmbalming = allEmbalming.filter((t) => t.created_at?.slice(0, 10) === targetDate)
      const allFarewell = await farewellReservations.getAll()
      const dayFarewell = allFarewell.filter((r) => r.start_time.slice(0, 10) === targetDate)
      const allCremation = await cremationTasks.getAll()
      const dayCremation = allCremation.filter((t) => t.scheduled_time.slice(0, 10) === targetDate)
      const allVehicleTasks = await vehicleTasks.getAll()
      const dayVehicleTasks = allVehicleTasks.filter((t) => t.scheduled_time.slice(0, 10) === targetDate)
      wb = XLSX.utils.book_new()
      const summarySheet = XLSX.utils.json_to_sheet([{
        日期: targetDate,
        区域: area || '全部',
        接运单数: dayReceipts.length,
        待审核: dayReceipts.filter((r) => r.status === 'pending').length,
        已审核: dayReceipts.filter((r) => r.status === 'verified').length,
        防腐任务: dayEmbalming.length,
        已完成防腐: dayEmbalming.filter((t) => t.status === 'completed').length,
        告别预约: dayFarewell.length,
        已完成告别: dayFarewell.filter((r) => r.status === 'completed').length,
        火化任务: dayCremation.length,
        已完成火化: dayCremation.filter((t) => t.status === 'completed').length,
        出车任务: dayVehicleTasks.length,
        已完成出车: dayVehicleTasks.filter((t) => t.status === 'completed').length,
      }])
      XLSX.utils.book_append_sheet(wb, summarySheet, '汇总')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dayReceipts.map((r) => ({
        ID: r.id,
        逝者姓名: r.deceased_name,
        性别: r.deceased_gender,
        年龄: r.deceased_age,
        状态: r.status,
        家属姓名: r.family_name,
        家属电话: r.family_phone,
        创建时间: r.created_at,
      }))), '接运登记')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dayEmbalming.map((t) => ({
        ID: t.id,
        接运单ID: t.receipt_id,
        任务类型: t.task_type,
        状态: t.status,
        优先级: t.priority,
        预计时长: t.estimated_duration,
        开始时间: t.start_time,
        结束时间: t.end_time,
      }))), '防腐任务')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dayFarewell.map((r) => ({
        ID: r.id,
        厅室ID: r.hall_id,
        状态: r.status,
        参加人数: r.attendee_count,
        时长: r.duration_minutes,
        开始时间: r.start_time,
        结束时间: r.end_time,
        家属姓名: r.family_name,
      }))), '告别预约')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dayCremation.map((t) => ({
        ID: t.id,
        接运单ID: t.receipt_id,
        炉型: t.furnace_type,
        排队位置: t.queue_position,
        状态: t.status,
        预计时长: t.estimated_duration,
        计划时间: t.scheduled_time,
        开始时间: t.start_time,
        结束时间: t.end_time,
      }))), '火化任务')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dayVehicleTasks.map((t) => ({
        ID: t.id,
        车辆ID: t.vehicle_id,
        司机ID: t.driver_id,
        任务类型: t.task_type,
        状态: t.status,
        起点: t.origin_address,
        终点: t.dest_address,
        '距离(km)': t.distance_km,
        预计时长: t.estimated_duration,
        计划时间: t.scheduled_time,
      }))), '出车任务')
      fileName = `日报_${targetDate}`
    } else if (type === 'hall-usage') {
      const start = new Date(startDate as string)
      const end = new Date(endDate as string)
      const halls = await farewellHalls.getAll()
      const allReservations = await farewellReservations.getAll()
      const days = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
      const totalAvailable = days * 8 * 60
      const rows = halls.map((hall) => {
        const hallReservations = allReservations.filter((r) => {
          const rDate = new Date(r.start_time)
          return r.hall_id === hall.id && rDate >= start && rDate <= end && r.status !== 'cancelled'
        })
        const used = hallReservations.reduce((sum, r) => sum + r.duration_minutes, 0)
        return {
          厅室名称: hall.name,
          楼层: hall.floor,
          容量: hall.capacity,
          预约次数: hallReservations.length,
          '使用时长(分钟)': used,
          '可用时长(分钟)': totalAvailable,
          使用率: `${Number(((used / totalAvailable) * 100).toFixed(2))}%`,
        }
      })
      wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), '厅室使用率')
      fileName = `厅室使用率_${startDate}_${endDate}`
    } else if (type === 'cremation-rate') {
      const start = new Date(startDate as string)
      const end = new Date(endDate as string)
      const allTasks = await cremationTasks.getAll()
      const periodTasks = allTasks.filter((t) => {
        const tDate = new Date(t.scheduled_time)
        return tDate >= start && tDate <= end
      })
      const dailyRows: Array<Record<string, any>> = []
      const cur = new Date(start)
      while (cur <= end) {
        const dateStr = cur.toISOString().slice(0, 10)
        const dayTasks = periodTasks.filter((t) => t.scheduled_time.slice(0, 10) === dateStr)
        const dayCompleted = dayTasks.filter((t) => t.status === 'completed').length
        dailyRows.push({
          日期: dateStr,
          总数: dayTasks.length,
          已完成: dayCompleted,
          完成率: dayTasks.length > 0 ? `${Number(((dayCompleted / dayTasks.length) * 100).toFixed(2))}%` : '0%',
        })
        cur.setDate(cur.getDate() + 1)
      }
      const total = periodTasks.length
      const completed = periodTasks.filter((t) => t.status === 'completed').length
      wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
        开始日期: startDate,
        结束日期: endDate,
        总任务数: total,
        已完成: completed,
        超时: periodTasks.filter((t) => t.status === 'overdue').length,
        总完成率: total > 0 ? `${Number(((completed / total) * 100).toFixed(2))}%` : '0%',
      }]), '汇总')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), '每日统计')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(periodTasks.map((t) => ({
        ID: t.id,
        接运单ID: t.receipt_id,
        炉型: t.furnace_type,
        状态: t.status,
        计划时间: t.scheduled_time,
        开始时间: t.start_time || '',
        结束时间: t.end_time || '',
        预计时长: t.estimated_duration,
      }))), '任务明细')
      fileName = `火化完成率_${startDate}_${endDate}`
    } else {
      const start = new Date(startDate as string)
      const end = new Date(endDate as string)
      const allTasks = await vehicleTasks.getAll()
      const periodTasks = allTasks.filter((t) => {
        const tDate = new Date(t.scheduled_time)
        return tDate >= start && tDate <= end
      })
      const dailyRows: Array<Record<string, any>> = []
      const cur = new Date(start)
      while (cur <= end) {
        const dateStr = cur.toISOString().slice(0, 10)
        const dayTasks = periodTasks.filter((t) => t.scheduled_time.slice(0, 10) === dateStr)
        const dayCompleted = dayTasks.filter((t) => t.status === 'completed').length
        const dayDelayed = dayTasks.filter((t) => t.status === 'delayed').length
        const dayOnTime = dayCompleted - dayDelayed > 0 ? dayCompleted - dayDelayed : 0
        dailyRows.push({
          日期: dateStr,
          总数: dayTasks.length,
          已完成: dayCompleted,
          延误: dayDelayed,
          准点率: dayCompleted > 0 ? `${Number(((dayOnTime / dayCompleted) * 100).toFixed(2))}%` : '0%',
        })
        cur.setDate(cur.getDate() + 1)
      }
      const total = periodTasks.length
      const completed = periodTasks.filter((t) => t.status === 'completed').length
      const delayed = periodTasks.filter((t) => t.status === 'delayed').length
      const onTime = completed - delayed > 0 ? completed - delayed : 0
      wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([{
        开始日期: startDate,
        结束日期: endDate,
        总任务数: total,
        已完成: completed,
        延误: delayed,
        准点: onTime,
        准点率: completed > 0 ? `${Number(((onTime / completed) * 100).toFixed(2))}%` : '0%',
      }]), '汇总')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(dailyRows), '每日统计')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(periodTasks.map((t) => ({
        ID: t.id,
        车辆ID: t.vehicle_id,
        司机ID: t.driver_id,
        任务类型: t.task_type,
        状态: t.status,
        起点: t.origin_address,
        终点: t.dest_address,
        '距离(km)': t.distance_km,
        计划时间: t.scheduled_time,
      }))), '任务明细')
      fileName = `灵车准点率_${startDate}_${endDate}`
    }
    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}.xlsx"`)
    res.send(buffer)
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '导出Excel失败',
    })
  }
})

export default router

import { Router, type Request, type Response } from 'express'
import {
  cremationFurnaces,
  cremationTasks,
  receipts,
  type CremationTask,
  type CremationFurnace,
} from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function parseDateTime(dt: string): Date {
  return new Date(dt.replace(' ', 'T'))
}

router.get('/furnaces', async (req: Request, res: Response): Promise<void> => {
  try {
    const furnaces = await cremationFurnaces.getAll()
    res.json({
      success: true,
      data: furnaces,
      message: '获取火化炉列表成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取火化炉列表失败: ${(error as Error).message}`,
    })
  }
})

router.get('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string
    const filters = status ? { status } : undefined
    const tasks = await cremationTasks.getAll(filters)
    res.json({
      success: true,
      data: tasks,
      message: '获取任务队列成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取任务队列失败: ${(error as Error).message}`,
    })
  }
})

router.post('/tasks/generate-queue', async (req: Request, res: Response): Promise<void> => {
  try {
    const allReceipts = await receipts.getAll({ status: 'verified' })
    const existingTasks = await cremationTasks.getAll()
    const existingReceiptIds = new Set(existingTasks.map((t) => t.receipt_id))

    const pendingReceipts = allReceipts.filter((r) => !existingReceiptIds.has(r.id))

    if (pendingReceipts.length === 0) {
      res.json({
        success: true,
        data: [],
        message: '没有需要生成排程的遗体接收记录',
      })
      return
    }

    const furnaces = await cremationFurnaces.getAll()
    const idleFurnaces = furnaces.filter((f) => f.status === 'idle')

    if (idleFurnaces.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: '没有可用的空闲火化炉',
      })
      return
    }

    const queuedTasks = existingTasks.filter((t) => t.status === 'queued' || t.status === 'pending')
    let nextPosition = queuedTasks.length > 0 ? Math.max(...queuedTasks.map((t) => t.queue_position)) + 1 : 0

    const createdTasks: CremationTask[] = []
    let furnaceIndex = 0
    let scheduledDate = new Date()
    scheduledDate.setHours(8, 0, 0, 0)

    for (let i = 0; i < pendingReceipts.length; i++) {
      const receipt = pendingReceipts[i]
      const furnace = idleFurnaces[furnaceIndex % idleFurnaces.length]

      if (i > 0 && i % idleFurnaces.length === 0) {
        scheduledDate = new Date(scheduledDate.getTime() + 24 * 60 * 60 * 1000)
        scheduledDate.setHours(8, 0, 0, 0)
      }

      const slotOffset = Math.floor(i / idleFurnaces.length)
      const taskTime = new Date(scheduledDate.getTime() + slotOffset * 90 * 60 * 1000)

      const id = generateId('cremation')
      const task: Omit<CremationTask, 'created_at'> = {
        id,
        receipt_id: receipt.id,
        furnace_id: furnace.id,
        furnace_type: furnace.type,
        queue_position: nextPosition,
        scheduled_time: formatDateTime(taskTime),
        estimated_duration: 60 + Math.floor(Math.random() * 60),
        status: 'queued',
        overdue: 0,
      }

      await cremationTasks.create(task)
      const created = await cremationTasks.getById(id)
      if (created) {
        createdTasks.push(created)
      }

      nextPosition++
      furnaceIndex++
    }

    res.status(201).json({
      success: true,
      data: createdTasks,
      message: `成功生成 ${createdTasks.length} 条火化排程任务`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `生成排程队列失败: ${(error as Error).message}`,
    })
  }
})

router.put('/tasks/:id/start', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const task = await cremationTasks.getById(id)

    if (!task) {
      res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在',
      })
      return
    }

    if (task.status === 'completed') {
      res.status(400).json({
        success: false,
        data: null,
        message: '任务已完成，无法开始',
      })
      return
    }

    if (task.status === 'in_progress') {
      res.json({
        success: true,
        data: task,
        message: '任务已在进行中',
      })
      return
    }

    let furnaceId = task.furnace_id
    if (!furnaceId) {
      const furnaces = await cremationFurnaces.getAll()
      const idleFurnace = furnaces.find((f) => f.status === 'idle')
      if (!idleFurnace) {
        res.status(400).json({
          success: false,
          data: null,
          message: '没有可用的空闲火化炉',
        })
        return
      }
      furnaceId = idleFurnace.id
    }

    const furnace = await cremationFurnaces.getById(furnaceId)
    if (!furnace) {
      res.status(404).json({
        success: false,
        data: null,
        message: '指定的火化炉不存在',
      })
      return
    }

    if (furnace.status !== 'idle') {
      res.status(400).json({
        success: false,
        data: null,
        message: `火化炉当前状态为 ${furnace.status}，无法开始任务`,
      })
      return
    }

    const startTime = new Date()
    const estimatedFinish = new Date(startTime.getTime() + task.estimated_duration * 60 * 1000)

    await cremationTasks.update(id, {
      furnace_id: furnaceId,
      status: 'in_progress',
      start_time: formatDateTime(startTime),
    })

    await cremationFurnaces.update(furnaceId, {
      status: 'running',
      current_task_id: id,
      estimated_finish_time: formatDateTime(estimatedFinish),
    })

    const updated = await cremationTasks.getById(id)

    res.json({
      success: true,
      data: updated,
      message: '火化任务已开始',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `开始火化失败: ${(error as Error).message}`,
    })
  }
})

router.put('/tasks/:id/complete', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const task = await cremationTasks.getById(id)

    if (!task) {
      res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在',
      })
      return
    }

    if (task.status === 'completed') {
      res.json({
        success: true,
        data: task,
        message: '任务已完成',
      })
      return
    }

    if (task.status !== 'in_progress') {
      res.status(400).json({
        success: false,
        data: null,
        message: `任务当前状态为 ${task.status}，无法完成`,
      })
      return
    }

    const endTime = new Date()

    await cremationTasks.update(id, {
      status: 'completed',
      end_time: formatDateTime(endTime),
    })

    if (task.furnace_id) {
      await cremationFurnaces.update(task.furnace_id, {
        status: 'idle',
        current_task_id: null,
        estimated_finish_time: null,
      })
    }

    const updated = await cremationTasks.getById(id)

    res.json({
      success: true,
      data: updated,
      message: '火化任务已完成',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `完成火化失败: ${(error as Error).message}`,
    })
  }
})

router.post('/tasks/:id/remind', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const task = await cremationTasks.getById(id)

    if (!task) {
      res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在',
      })
      return
    }

    const now = new Date()
    let isOverdue = false

    if (task.status === 'in_progress' && task.start_time) {
      const startTime = parseDateTime(task.start_time)
      const expectedEnd = new Date(startTime.getTime() + task.estimated_duration * 60 * 1000)
      isOverdue = now > expectedEnd
    } else if (task.status === 'queued' || task.status === 'pending') {
      const scheduledTime = parseDateTime(task.scheduled_time)
      isOverdue = now > scheduledTime
    }

    if (!isOverdue) {
      res.json({
        success: true,
        data: {
          task,
          reminded: false,
          message: '任务未超时，无需催办',
        },
        message: '任务未超时',
      })
      return
    }

    await cremationTasks.update(id, {
      overdue: task.overdue + 1,
      status: task.status === 'in_progress' ? 'in_progress' : 'overdue',
    })

    const updated = await cremationTasks.getById(id)

    res.json({
      success: true,
      data: {
        task: updated,
        reminded: true,
        overdueCount: updated?.overdue || 0,
      },
      message: `已催办，当前超次数: ${updated?.overdue || 0}`,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `催办失败: ${(error as Error).message}`,
    })
  }
})

router.put('/tasks/reorder', async (req: Request, res: Response): Promise<void> => {
  try {
    const { orders }: { orders: Array<{ id: string; queue_position: number }> } = req.body

    if (!Array.isArray(orders) || orders.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: '请提供排序数组',
      })
      return
    }

    for (const order of orders) {
      if (!order.id || order.queue_position === undefined) {
        res.status(400).json({
          success: false,
          data: null,
          message: '排序数据格式错误',
        })
        return
      }

      const task = await cremationTasks.getById(order.id)
      if (!task) {
        res.status(404).json({
          success: false,
          data: null,
          message: `任务 ${order.id} 不存在`,
        })
        return
      }

      if (task.status === 'completed' || task.status === 'in_progress') {
        res.status(400).json({
          success: false,
          data: null,
          message: `任务 ${order.id} 状态为 ${task.status}，无法重新排序`,
        })
        return
      }
    }

    for (const order of orders) {
      await cremationTasks.update(order.id, {
        queue_position: order.queue_position,
      })
    }

    const allTasks = await cremationTasks.getAll()
    const reordered = allTasks
      .filter((t) => orders.some((o) => o.id === t.id))
      .sort((a, b) => a.queue_position - b.queue_position)

    res.json({
      success: true,
      data: reordered,
      message: '重新排序成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `重新排序失败: ${(error as Error).message}`,
    })
  }
})

export default router

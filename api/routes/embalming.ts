import { Router, type Request, type Response } from 'express'
import { embalmingTasks, receipts, users, type EmbalmingTask } from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

router.get('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query as { status?: string }
    const filters: { status?: string } = {}
    if (status) filters.status = status

    const tasks = await embalmingTasks.getAll(filters)

    const enrichedTasks = await Promise.all(
      tasks.map(async (task) => {
        const receipt = task.receipt_id ? await receipts.getById(task.receipt_id) : null
        const assignee = task.assignee_id ? await users.getById(task.assignee_id) : null
        return {
          ...task,
          deceased_name: receipt?.deceased_name,
          assignee_name: assignee?.name,
        }
      }),
    )

    res.json({
      success: true,
      data: enrichedTasks,
      message: '获取成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

router.post('/tasks', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      receipt_id,
      body_condition,
      task_type,
      assignee_id,
      priority = 'normal',
      estimated_duration = 60,
      notes,
    } = req.body

    if (!receipt_id || !body_condition || !task_type) {
      res.status(400).json({
        success: false,
        data: null,
        message: '接收记录ID、遗体状态、任务类型为必填项',
      })
      return
    }

    const receipt = await receipts.getById(receipt_id)
    if (!receipt) {
      res.status(404).json({
        success: false,
        data: null,
        message: '关联的接收记录不存在',
      })
      return
    }

    const id = generateId('embalming')
    const newTask: Omit<EmbalmingTask, 'created_at'> = {
      id,
      receipt_id,
      body_condition,
      task_type,
      assignee_id,
      status: 'pending',
      priority,
      estimated_duration,
      notes,
    }

    await embalmingTasks.create(newTask)

    res.status(201).json({
      success: true,
      data: newTask,
      message: '创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

router.put('/tasks/:id/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status } = req.body as { status: string }

    if (!status || !['pending', 'in_progress', 'completed'].includes(status)) {
      res.status(400).json({
        success: false,
        data: null,
        message: '无效的状态值，必须是 pending、in_progress 或 completed',
      })
      return
    }

    const task = await embalmingTasks.getById(id)
    if (!task) {
      res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在',
      })
      return
    }

    const updates: Partial<EmbalmingTask> = { status: status as 'pending' | 'in_progress' | 'completed' }

    if (status === 'in_progress' && !task.start_time) {
      updates.start_time = formatDate(new Date())
    }

    if (status === 'completed') {
      updates.end_time = formatDate(new Date())
      if (!task.start_time) {
        updates.start_time = formatDate(new Date())
      }
    }

    await embalmingTasks.update(id, updates)

    const updated = await embalmingTasks.getById(id)

    res.json({
      success: true,
      data: updated,
      message: '状态更新成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

router.put('/tasks/:id/assign', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { assignee_id } = req.body as { assignee_id: string }

    if (!assignee_id) {
      res.status(400).json({
        success: false,
        data: null,
        message: '分配人员ID不能为空',
      })
      return
    }

    const task = await embalmingTasks.getById(id)
    if (!task) {
      res.status(404).json({
        success: false,
        data: null,
        message: '任务不存在',
      })
      return
    }

    const assignee = await users.getById(assignee_id)
    if (!assignee) {
      res.status(404).json({
        success: false,
        data: null,
        message: '分配人员不存在',
      })
      return
    }

    await embalmingTasks.update(id, { assignee_id })

    const updated = await embalmingTasks.getById(id)

    res.json({
      success: true,
      data: {
        ...updated,
        assignee_name: assignee.name,
      },
      message: '分配成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

export default router

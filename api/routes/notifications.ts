import { Router, type Request, type Response } from 'express'
import { notifications, type Notification } from '../db/index.js'
import { transformNotification } from '../utils/transform.js'

const router = Router()

const mockNotificationTemplates: Array<Omit<Notification, 'id' | 'recipient_id' | 'recipient_role' | 'is_read' | 'created_at'>> = [
  {
    type: 'receipt',
    priority: 'high',
    title: '新的接运登记',
    content: '有新的接运登记单需要审核，请及时处理。',
    related_type: 'receipt',
  },
  {
    type: 'embalming',
    priority: 'normal',
    title: '防腐任务提醒',
    content: '您有一条新的防腐任务已分配。',
    related_type: 'embalming_task',
  },
  {
    type: 'farewell',
    priority: 'normal',
    title: '告别仪式预约',
    content: '明天有一场告别仪式需要准备。',
    related_type: 'farewell_reservation',
  },
  {
    type: 'cremation',
    priority: 'high',
    title: '火化任务开始',
    content: '火化炉#1已启动，请关注进度。',
    related_type: 'cremation_task',
  },
  {
    type: 'storage',
    priority: 'low',
    title: '存放合同即将到期',
    content: '有3份存放合同将在7天内到期。',
    related_type: 'storage_contract',
  },
  {
    type: 'vehicle',
    priority: 'urgent',
    title: '车辆调度通知',
    content: '紧急出车任务已分配，请立即出发。',
    related_type: 'vehicle_task',
  },
  {
    type: 'system',
    priority: 'normal',
    title: '系统公告',
    content: '系统将于今晚22:00进行维护升级。',
    related_type: 'system',
  },
]

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { type, read, is_read, keyword } = req.query
    const filters: { type?: string; isRead?: number; keyword?: string } = {}
    if (type && typeof type === 'string') {
      filters.type = type
    }
    const readParam = read !== undefined && read !== null ? read : is_read
    if (readParam !== undefined && readParam !== null) {
      filters.isRead = readParam === 'true' || readParam === '1' ? 1 : 0
    }
    if (keyword && typeof keyword === 'string') {
      filters.keyword = keyword
    }
    const list = await notifications.getAll(filters)
    const transformedList = list.map(item => transformNotification(item))
    res.json({
      success: true,
      data: transformedList,
      message: '获取通知列表成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '获取通知列表失败',
    })
  }
})

router.put('/:id/read', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const notification = await notifications.getById(id)
    if (!notification) {
      res.status(404).json({
        success: false,
        data: null,
        message: '通知不存在',
      })
      return
    }
    await notifications.update(id, { is_read: 1 })
    const updated = await notifications.getById(id)
    res.json({
      success: true,
      data: transformNotification(updated!),
      message: '标记已读成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '标记已读失败',
    })
  }
})

router.put('/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientId } = req.body as { recipientId?: string }
    if (recipientId) {
      const result = await notifications.markAllRead(recipientId)
      res.json({
        success: true,
        data: { markedCount: result.changes },
        message: `已将 ${result.changes} 条通知标记为已读`,
      })
    } else {
      const all = await notifications.getAll({ isRead: 0 })
      let count = 0
      for (const n of all) {
        await notifications.update(n.id, { is_read: 1 })
        count++
      }
      res.json({
        success: true,
        data: { markedCount: count },
        message: `已将 ${count} 条通知标记为已读`,
      })
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: error instanceof Error ? error.message : '全部标记已读失败',
    })
  }
})

router.get('/stream', (req: Request, res: Response): void => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()
  let messageCount = 0
  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\n`)
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }
  sendEvent('connected', {
    success: true,
    message: 'SSE 连接已建立',
    timestamp: new Date().toISOString(),
  })
  const interval = setInterval(() => {
    messageCount++
    if (messageCount % 3 === 0) {
      const template = mockNotificationTemplates[Math.floor(Math.random() * mockNotificationTemplates.length)]
      const mockNotification: Notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        ...template,
        related_id: `rel_${Date.now()}`,
        recipient_id: 'system',
        recipient_role: 'admin',
        is_read: 0,
        created_at: new Date().toISOString(),
      }
      sendEvent('notification', {
        success: true,
        data: transformNotification(mockNotification),
        message: '新通知',
        timestamp: new Date().toISOString(),
      })
    } else {
      sendEvent('heartbeat', {
        success: true,
        data: { count: messageCount },
        message: 'heartbeat',
        timestamp: new Date().toISOString(),
      })
    }
  }, 30000)
  req.on('close', () => {
    clearInterval(interval)
    res.end()
  })
})

export default router

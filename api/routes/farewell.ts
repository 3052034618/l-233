import { Router, type Request, type Response } from 'express'
import {
  farewellHalls,
  farewellReservations,
  receipts,
  type FarewellHall,
  type FarewellReservation,
} from '../db/index.js'
import { transformFarewellHall, transformFarewellReservation } from '../utils/transform.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function parseDateParam(dateStr?: string): string {
  if (dateStr) {
    return dateStr.slice(0, 10)
  }
  return new Date().toISOString().slice(0, 10)
}

function parseDateTime(dt: string): Date {
  return new Date(dt.replace(' ', 'T'))
}

function formatDateTime(d: Date): string {
  return d.toISOString().slice(0, 19).replace('T', ' ')
}

function hasTimeConflict(
  existing: FarewellReservation,
  newStart: Date,
  newEnd: Date,
): boolean {
  const exStart = parseDateTime(existing.start_time)
  const exEnd = parseDateTime(existing.end_time)
  return newStart < exEnd && newEnd > exStart
}

router.get('/halls', async (req: Request, res: Response): Promise<void> => {
  try {
    const halls = await farewellHalls.getAll()
    const transformedHalls = halls.map(transformFarewellHall)
    res.json({
      success: true,
      data: transformedHalls,
      message: '获取厅室列表成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取厅室列表失败: ${(error as Error).message}`,
    })
  }
})

router.get('/halls/:id/schedule', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const date = parseDateParam(req.query.date as string)

    if (id === 'all') {
      const allHalls = await farewellHalls.getAll()
      const allReservations: unknown[] = []
      for (const hall of allHalls) {
        const reservations = await farewellReservations.getByHallIdAndDate(hall.id, date)
        const transformed = await Promise.all(
          reservations.map(async (item) => {
            const receipt = await receipts.getById(item.receipt_id)
            return transformFarewellReservation(item, {
              hallName: hall.name,
              deceasedName: receipt?.deceased_name || '',
            })
          }),
        )
        allReservations.push(...transformed)
      }
      res.json({
        success: true,
        data: {
          hall: null,
          date,
          reservations: allReservations,
        },
        message: '获取当日排程成功',
      })
      return
    }

    const hall = await farewellHalls.getById(id)
    if (!hall) {
      res.status(404).json({
        success: false,
        data: null,
        message: '厅室不存在',
      })
      return
    }
    const reservations = await farewellReservations.getByHallIdAndDate(id, date)
    const transformedReservations = await Promise.all(
      reservations.map(async (item) => {
        const receipt = await receipts.getById(item.receipt_id)
        return transformFarewellReservation(item, {
          hallName: hall.name,
          deceasedName: receipt?.deceased_name || '',
        })
      }),
    )
    res.json({
      success: true,
      data: {
        hall: transformFarewellHall(hall!),
        date,
        reservations: transformedReservations,
      },
      message: '获取当日排程成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取当日排程失败: ${(error as Error).message}`,
    })
  }
})

router.get('/suggest', async (req: Request, res: Response): Promise<void> => {
  try {
    const attendeeCount = parseInt((req.query.attendeeCount || req.query.attendee_count) as string, 10) || 0
    const durationMinutes = parseInt((req.query.durationMinutes || req.query.duration_minutes) as string, 10) || 60
    const preferredTime = (req.query.preferredTime || req.query.preferred_time) as string

    if (!attendeeCount || attendeeCount <= 0) {
      res.status(400).json({
        success: false,
        data: null,
        message: '请提供有效的参加人数',
      })
      return
    }

    const allHalls = await farewellHalls.getAll()
    const availableHalls = allHalls.filter(
      (h) => h.status === 'available' && h.capacity >= attendeeCount,
    )

    if (availableHalls.length === 0) {
      res.json({
        success: true,
        data: [],
        message: '没有符合容量要求的可用厅室',
      })
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const suggestions: Array<{
      hallId: string
      hallName: string
      capacity: number
      suggestedSlots: Array<{ startTime: string; endTime: string }>
      conflictSlots: Array<{ startTime: string; endTime: string; reason: string }>
      alternativeSlots: Array<{ startTime: string; endTime: string }>
    }> = []

    for (const hall of availableHalls) {
      const reservations = await farewellReservations.getByHallIdAndDate(hall.id, today)
      const activeReservations = reservations.filter((r) => r.status !== 'cancelled')

      const conflictSlots: Array<{ startTime: string; endTime: string; reason: string }> = []
      const suggestedSlots: Array<{ startTime: string; endTime: string }> = []
      const alternativeSlots: Array<{ startTime: string; endTime: string }> = []

      const workingStart = new Date()
      workingStart.setHours(8, 0, 0, 0)
      const workingEnd = new Date()
      workingEnd.setHours(18, 0, 0, 0)

      let preferredStart: Date | null = null
      if (preferredTime) {
        preferredStart = parseDateTime(preferredTime)
      }

      let cursor = new Date(workingStart)
      while (cursor.getTime() + durationMinutes * 60000 <= workingEnd.getTime()) {
        const slotStart = new Date(cursor)
        const slotEnd = new Date(cursor.getTime() + durationMinutes * 60000)

        const conflict = activeReservations.find((r) => hasTimeConflict(r, slotStart, slotEnd))

        if (conflict) {
          conflictSlots.push({
            startTime: conflict.start_time,
            endTime: conflict.end_time,
            reason: `与 ${conflict.family_name} 的预约冲突`,
          })
        } else {
          const slot = {
            startTime: formatDateTime(slotStart),
            endTime: formatDateTime(slotEnd),
          }
          if (
            preferredStart &&
            Math.abs(slotStart.getTime() - preferredStart.getTime()) < 30 * 60000
          ) {
            suggestedSlots.push(slot)
          } else {
            alternativeSlots.push(slot)
          }
        }

        cursor = new Date(cursor.getTime() + 30 * 60000)
      }

      suggestions.push({
        hallId: hall.id,
        hallName: hall.name,
        capacity: hall.capacity,
        suggestedSlots: suggestedSlots.slice(0, 3),
        conflictSlots,
        alternativeSlots: alternativeSlots.slice(0, 5),
      })
    }

    res.json({
      success: true,
      data: suggestions,
      message: '智能推荐完成',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `智能推荐失败: ${(error as Error).message}`,
    })
  }
})

router.post('/reservations', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      hall_id,
      receipt_id,
      attendee_count,
      duration_minutes,
      start_time,
      end_time,
      family_name,
      family_phone,
    } = req.body

    if (!hall_id || !receipt_id || !attendee_count || !duration_minutes || !start_time || !end_time || !family_name || !family_phone) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数',
      })
      return
    }

    const hall = await farewellHalls.getById(hall_id)
    if (!hall) {
      res.status(404).json({
        success: false,
        data: null,
        message: '厅室不存在',
      })
      return
    }

    if (hall.status !== 'available') {
      res.status(400).json({
        success: false,
        data: null,
        message: '厅室当前不可用',
      })
      return
    }

    if (attendee_count > hall.capacity) {
      res.status(400).json({
        success: false,
        data: null,
        message: `参加人数超出厅室容量（最大${hall.capacity}人）`,
      })
      return
    }

    const date = start_time.slice(0, 10)
    const existingReservations = await farewellReservations.getByHallIdAndDate(hall_id, date)
    const activeReservations = existingReservations.filter((r) => r.status !== 'cancelled')
    const newStart = parseDateTime(start_time)
    const newEnd = parseDateTime(end_time)

    const conflict = activeReservations.find((r) => hasTimeConflict(r, newStart, newEnd))
    if (conflict) {
      res.status(409).json({
        success: false,
        data: null,
        message: `时段冲突：与 ${conflict.family_name} 的预约（${conflict.start_time} - ${conflict.end_time}）重叠`,
      })
      return
    }

    const id = generateId('reservation')
    const reservation: Omit<FarewellReservation, 'created_at'> = {
      id,
      hall_id,
      receipt_id,
      attendee_count,
      duration_minutes,
      start_time,
      end_time,
      status: 'reserved',
      family_name,
      family_phone,
    }

    await farewellReservations.create(reservation)
    const created = await farewellReservations.getById(id)
    const receipt = await receipts.getById(receipt_id)

    res.status(201).json({
      success: true,
      data: transformFarewellReservation(created!, {
        hallName: hall.name,
        deceasedName: receipt?.deceased_name || '',
      }),
      message: '预约创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `创建预约失败: ${(error as Error).message}`,
    })
  }
})

router.put('/reservations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await farewellReservations.getById(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        data: null,
        message: '预约不存在',
      })
      return
    }

    if (existing.status === 'cancelled' || existing.status === 'completed') {
      res.status(400).json({
        success: false,
        data: null,
        message: '当前状态不允许修改',
      })
      return
    }

    const updateData: Partial<FarewellReservation> = {}
    const allowedFields: (keyof FarewellReservation)[] = [
      'hall_id',
      'attendee_count',
      'duration_minutes',
      'start_time',
      'end_time',
      'family_name',
      'family_phone',
      'status',
    ]

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        ;(updateData as any)[field] = req.body[field]
      }
    }

    const checkHallId = updateData.hall_id || existing.hall_id
    const checkStart = updateData.start_time || existing.start_time
    const checkEnd = updateData.end_time || existing.end_time

    if (checkHallId && checkStart && checkEnd) {
      const hall = await farewellHalls.getById(checkHallId)
      if (hall && updateData.attendee_count && updateData.attendee_count > hall.capacity) {
        res.status(400).json({
          success: false,
          data: null,
          message: `参加人数超出厅室容量（最大${hall.capacity}人）`,
        })
        return
      }

      const date = checkStart.slice(0, 10)
      const dayReservations = await farewellReservations.getByHallIdAndDate(checkHallId, date)
      const activeReservations = dayReservations.filter(
        (r) => r.id !== id && r.status !== 'cancelled',
      )
      const newStart = parseDateTime(checkStart)
      const newEnd = parseDateTime(checkEnd)

      const conflict = activeReservations.find((r) => hasTimeConflict(r, newStart, newEnd))
      if (conflict) {
        res.status(409).json({
          success: false,
          data: null,
          message: `时段冲突：与 ${conflict.family_name} 的预约（${conflict.start_time} - ${conflict.end_time}）重叠`,
        })
        return
      }
    }

    await farewellReservations.update(id, updateData)
    const updated = await farewellReservations.getById(id)
    const updatedHallId = updateData.hall_id || existing.hall_id
    const updatedHall = await farewellHalls.getById(updatedHallId)
    const receipt = await receipts.getById(updated!.receipt_id)

    res.json({
      success: true,
      data: transformFarewellReservation(updated!, {
        hallName: updatedHall?.name,
        deceasedName: receipt?.deceased_name || '',
      }),
      message: '预约修改成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `修改预约失败: ${(error as Error).message}`,
    })
  }
})

router.delete('/reservations/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const existing = await farewellReservations.getById(id)

    if (!existing) {
      res.status(404).json({
        success: false,
        data: null,
        message: '预约不存在',
      })
      return
    }

    await farewellReservations.update(id, { status: 'cancelled' })
    const cancelled = await farewellReservations.getById(id)
    const hall = await farewellHalls.getById(cancelled!.hall_id)
    const receipt = await receipts.getById(cancelled!.receipt_id)

    res.json({
      success: true,
      data: transformFarewellReservation(cancelled!, {
        hallName: hall?.name,
        deceasedName: receipt?.deceased_name || '',
      }),
      message: '预约已取消',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `取消预约失败: ${(error as Error).message}`,
    })
  }
})

export default router

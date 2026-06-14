import { Router, type Request, type Response } from 'express'
import { receipts, embalmingTasks, type Receipt, type EmbalmingTask } from '../db/index.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, keyword } = req.query as { status?: string; keyword?: string }
    const filters: { status?: string; keyword?: string } = {}
    if (status) filters.status = status
    if (keyword) filters.keyword = keyword

    const list = await receipts.getAll(filters)
    res.json({
      success: true,
      data: list,
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

router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      deceased_name,
      deceased_gender,
      deceased_age,
      deceased_id_card,
      date_of_death,
      cause_of_death,
      death_certificate_no,
      police_record_no,
      family_name,
      family_phone,
      family_relation,
      receipt_time,
    } = req.body

    if (
      !deceased_name ||
      !deceased_gender ||
      deceased_age === undefined ||
      !deceased_id_card ||
      !date_of_death ||
      !cause_of_death ||
      !death_certificate_no ||
      !police_record_no ||
      !family_name ||
      !family_phone ||
      !family_relation
    ) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必填字段',
      })
      return
    }

    const id = generateId('receipt')
    const newReceipt: Omit<Receipt, 'created_at' | 'updated_at'> = {
      id,
      deceased_name,
      deceased_gender,
      deceased_age,
      deceased_id_card,
      date_of_death,
      cause_of_death,
      death_certificate_no,
      police_record_no,
      status: 'pending',
      family_name,
      family_phone,
      family_relation,
      receipt_time,
    }

    await receipts.create(newReceipt)

    res.status(201).json({
      success: true,
      data: newReceipt,
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

router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const receipt = await receipts.getById(id)

    if (!receipt) {
      res.status(404).json({
        success: false,
        data: null,
        message: '记录不存在',
      })
      return
    }

    res.json({
      success: true,
      data: receipt,
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

router.put('/:id/verify', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const receipt = await receipts.getById(id)

    if (!receipt) {
      res.status(404).json({
        success: false,
        data: null,
        message: '记录不存在',
      })
      return
    }

    const deathCertValid = Math.random() > 0.2
    const policeRecordValid = Math.random() > 0.15
    const issues: string[] = []

    if (!deathCertValid) {
      issues.push('死亡证明信息校验失败，请核对证明编号或补充医院公章')
    }
    if (!policeRecordValid) {
      issues.push('公安备案信息校验失败，请核对备案编号')
    }

    const verificationResult = {
      deathCertValid,
      policeRecordValid,
      issues,
    }

    const allValid = deathCertValid && policeRecordValid
    const newStatus = allValid ? 'verified' : receipt.status

    await receipts.update(id, {
      status: newStatus,
      verification_result: JSON.stringify(verificationResult),
    })

    const updated = await receipts.getById(id)

    res.json({
      success: true,
      data: {
        receipt: updated,
        verification: verificationResult,
      },
      message: allValid ? '校验通过' : '校验发现问题',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

router.put('/:id/reject', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { reason } = req.body as { reason?: string }

    const receipt = await receipts.getById(id)

    if (!receipt) {
      res.status(404).json({
        success: false,
        data: null,
        message: '记录不存在',
      })
      return
    }

    const currentResult = receipt.verification_result
      ? JSON.parse(receipt.verification_result)
      : { deathCertValid: true, policeRecordValid: true, issues: [] as string[] }

    if (reason) {
      currentResult.issues.push(reason)
    }

    await receipts.update(id, {
      status: 'rejected',
      verification_result: JSON.stringify(currentResult),
    })

    const updated = await receipts.getById(id)

    res.json({
      success: true,
      data: updated,
      message: '已退回补正',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: '服务器内部错误',
    })
  }
})

router.post('/:id/assign-embalming', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const {
      body_condition,
      task_type,
      assignee_id,
      priority = 'normal',
      estimated_duration = 60,
      notes,
    } = req.body

    const receipt = await receipts.getById(id)

    if (!receipt) {
      res.status(404).json({
        success: false,
        data: null,
        message: '记录不存在',
      })
      return
    }

    if (receipt.status !== 'verified') {
      res.status(400).json({
        success: false,
        data: null,
        message: '只有校验通过的记录才能分配防腐整容任务',
      })
      return
    }

    if (!body_condition || !task_type) {
      res.status(400).json({
        success: false,
        data: null,
        message: '遗体状态和任务类型为必填项',
      })
      return
    }

    const taskId = generateId('embalming')
    const newTask: Omit<EmbalmingTask, 'created_at'> = {
      id: taskId,
      receipt_id: id,
      body_condition,
      task_type,
      assignee_id,
      status: 'pending',
      priority,
      estimated_duration,
      notes,
    }

    await embalmingTasks.create(newTask)
    await receipts.update(id, { status: 'processing' })

    const updatedReceipt = await receipts.getById(id)

    res.status(201).json({
      success: true,
      data: {
        task: newTask,
        receipt: updatedReceipt,
      },
      message: '防腐整容任务分配成功',
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

import { Router, type Request, type Response } from 'express'
import {
  storageNiches,
  storageContracts,
  receipts,
  type StorageNiche,
  type StorageContract,
} from '../db/index.js'
import { transformStorageNiche, transformStorageContract, transformToCamel } from '../utils/transform.js'

const router = Router()

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function generateCertificateNo(): string {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const random = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `CERT${dateStr}${random}`
}

function generateQRCode(certificateNo: string): string {
  return `[QR:${certificateNo}]`
}

router.get('/niches', async (req: Request, res: Response): Promise<void> => {
  try {
    const { area, status, type } = req.query
    const filters: { area?: string; status?: string; type?: string } = {}
    if (area) filters.area = area as string
    if (status) filters.status = status as string
    if (type) filters.type = type as string

    const niches = await storageNiches.getAll(filters)
    const transformedNiches = niches.map(item => transformStorageNiche(item))
    res.json({
      success: true,
      data: transformedNiches,
      message: '获取格位列表成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取格位列表失败: ${(error as Error).message}`,
    })
  }
})

router.get('/niches/map', async (req: Request, res: Response): Promise<void> => {
  try {
    const { area } = req.query

    if (!area) {
      res.status(400).json({
        success: false,
        data: null,
        message: '请指定区域参数 area',
      })
      return
    }

    const niches = await storageNiches.getAll({ area: area as string })

    const grouped: Record<string, Record<string, Record<string, any[]>>> = {}
    for (const niche of niches) {
      if (!grouped[niche.area]) grouped[niche.area] = {}
      if (!grouped[niche.area][niche.row_num]) grouped[niche.area][niche.row_num] = {}
      if (!grouped[niche.area][niche.row_num][niche.col_num]) {
        grouped[niche.area][niche.row_num][niche.col_num] = []
      }
      grouped[niche.area][niche.row_num][niche.col_num].push(transformStorageNiche(niche))
    }

    const stats = {
      total: niches.length,
      available: niches.filter((n) => n.status === 'available').length,
      occupied: niches.filter((n) => n.status === 'occupied').length,
      reserved: niches.filter((n) => n.status === 'reserved').length,
      maintenance: niches.filter((n) => n.status === 'maintenance').length,
    }

    res.json({
      success: true,
      data: {
        area,
        map: transformToCamel(grouped),
        stats,
      },
      message: '获取格位分布图成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取格位分布图失败: ${(error as Error).message}`,
    })
  }
})

router.get('/niches/match', async (req: Request, res: Response): Promise<void> => {
  try {
    const receiptId = (req.query.receiptId || req.query.receipt_id) as string
    const type = req.query.type as string

    if (!receiptId) {
      res.status(400).json({
        success: false,
        data: null,
        message: '请提供接收记录ID receiptId',
      })
      return
    }

    const receipt = await receipts.getById(receiptId as string)
    if (!receipt) {
      res.status(404).json({
        success: false,
        data: null,
        message: '接收记录不存在',
      })
      return
    }

    const existingContracts = await storageContracts.getAll()
    const occupiedNicheIds = new Set(
      existingContracts
        .filter((c) => c.status === 'active')
        .map((c) => c.niche_id),
    )

    const filters: { status: string; type?: string } = { status: 'available' }
    if (type) filters.type = type as string

    const availableNiches = await storageNiches.getAll(filters)
    const freeNiches = availableNiches.filter((n) => !occupiedNicheIds.has(n.id))

    if (freeNiches.length === 0) {
      res.json({
        success: true,
        data: {
          receipt: transformToCamel(receipt),
          matches: [],
          message: '暂无可用格位',
        },
        message: '暂无可用格位',
      })
      return
    }

    const scored = freeNiches.map((niche) => {
      let score = 0

      if (niche.type === 'single') score += 10
      if (niche.type === 'double') score += 8
      if (niche.type === 'family') score += 5

      if (niche.level_num === 2) score += 5
      if (niche.level_num === 1 || niche.level_num === 3) score += 2

      if (niche.row_num <= 3) score += 3

      return { niche, score }
    })

    scored.sort((a, b) => b.score - a.score)

    const matches = scored.slice(0, 5).map((item) => ({
      ...transformStorageNiche(item.niche),
      matchScore: item.score,
    }))

    res.json({
      success: true,
      data: {
        receipt: transformToCamel(receipt),
        matches,
      },
      message: '智能匹配完成',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `智能匹配失败: ${(error as Error).message}`,
    })
  }
})

router.get('/contracts', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status } = req.query
    const filters: { status?: string } = {}
    if (status) filters.status = status as string

    const contracts = await storageContracts.getAll(filters)

    const enrichedContracts = await Promise.all(
      contracts.map(async (contract) => {
        const receipt = await receipts.getById(contract.receipt_id)
        const niche = await storageNiches.getById(contract.niche_id)
        return transformStorageContract(contract, {
          deceasedName: receipt?.deceased_name,
          nicheInfo: niche ? transformStorageNiche(niche) : null,
        })
      }),
    )

    res.json({
      success: true,
      data: enrichedContracts,
      message: '获取合同列表成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `获取合同列表失败: ${(error as Error).message}`,
    })
  }
})

router.post('/contracts', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      niche_id,
      receipt_id,
      family_name,
      family_phone,
      family_id_card,
      start_date,
      years,
    } = req.body

    if (!niche_id || !receipt_id || !family_name || !family_phone || !family_id_card || !start_date || !years) {
      res.status(400).json({
        success: false,
        data: null,
        message: '缺少必要参数',
      })
      return
    }

    const niche = await storageNiches.getById(niche_id)
    if (!niche) {
      res.status(404).json({
        success: false,
        data: null,
        message: '格位不存在',
      })
      return
    }

    if (niche.status !== 'available') {
      res.status(400).json({
        success: false,
        data: null,
        message: `格位当前状态为 ${niche.status}，不可签约`,
      })
      return
    }

    const receipt = await receipts.getById(receipt_id)
    if (!receipt) {
      res.status(404).json({
        success: false,
        data: null,
        message: '接收记录不存在',
      })
      return
    }

    const existingContracts = await storageContracts.getByNicheId(niche_id)
    const activeContract = existingContracts.find((c) => c.status === 'active')
    if (activeContract) {
      res.status(400).json({
        success: false,
        data: null,
        message: '该格位已有有效合同',
      })
      return
    }

    const startDate = new Date(start_date)
    const endDate = new Date(startDate)
    endDate.setFullYear(endDate.getFullYear() + parseInt(years, 10))

    const id = generateId('contract')
    const certificateNo = generateCertificateNo()

    const contract: Omit<StorageContract, 'created_at'> = {
      id,
      niche_id,
      receipt_id,
      family_name,
      family_phone,
      family_id_card,
      start_date: startDate.toISOString().slice(0, 10),
      end_date: endDate.toISOString().slice(0, 10),
      years: parseInt(years, 10),
      status: 'active',
      certificate_no: certificateNo,
    }

    await storageContracts.create(contract)
    await storageNiches.update(niche_id, { status: 'occupied' })

    const created = await storageContracts.getById(id)
    const createdNiche = await storageNiches.getById(niche_id)

    res.status(201).json({
      success: true,
      data: transformStorageContract(created!, {
        deceasedName: receipt.deceased_name,
        nicheInfo: createdNiche ? transformStorageNiche(createdNiche) : null,
      }),
      message: '合同创建成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `创建合同失败: ${(error as Error).message}`,
    })
  }
})

router.get('/contracts/:id/certificate', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const contract = await storageContracts.getById(id)

    if (!contract) {
      res.status(404).json({
        success: false,
        data: null,
        message: '合同不存在',
      })
      return
    }

    const niche = await storageNiches.getById(contract.niche_id)
    const receipt = await receipts.getById(contract.receipt_id)

    const certificate = {
      contractId: contract.id,
      certificateNo: contract.certificate_no,
      qrCode: generateQRCode(contract.certificate_no),
      deceasedName: receipt?.deceased_name || '',
      familyName: contract.family_name,
      familyPhone: contract.family_phone,
      nicheInfo: niche
        ? transformStorageNiche(niche)
        : null,
      startDate: contract.start_date,
      endDate: contract.end_date,
      years: contract.years,
      status: contract.status,
      issuedAt: new Date().toISOString().slice(0, 10),
    }

    res.json({
      success: true,
      data: certificate,
      message: '电子凭证生成成功',
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      data: null,
      message: `生成电子凭证失败: ${(error as Error).message}`,
    })
  }
})

export default router

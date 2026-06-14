import { useState, useMemo } from 'react'
import {
  Box,
  MapPin,
  Users,
  Search,
  FileText,
  QrCode,
  Printer,
  User,
  Phone,
  CreditCard,
  Calendar,
  Check,
  X,
  ChevronRight,
  Sparkles,
} from 'lucide-react'
import Modal from '@/components/ui/Modal'
import StatusBadge from '@/components/ui/StatusBadge'
import { cn } from '@/lib/utils'
import type { StorageNiche, StorageContract } from '@/lib/api'

type AreaTab = 'A' | 'B' | 'C'

interface NicheMatch extends StorageNiche {
  remainingYears: number
}

const generateMockNiches = (area: string): StorageNiche[] => {
  const niches: StorageNiche[] = []
  const types: Array<'single' | 'double' | 'family'> = ['single', 'double', 'family']
  const statuses: Array<'available' | 'occupied' | 'reserved' | 'maintenance'> = [
    'available',
    'occupied',
    'reserved',
    'maintenance',
  ]
  const typePriceMap = { single: 8000, double: 15000, family: 28000 }

  for (let row = 1; row <= 8; row++) {
    for (let col = 1; col <= 10; col++) {
      for (let level = 1; level <= 3; level++) {
        const rand = Math.random()
        let status: 'available' | 'occupied' | 'reserved' | 'maintenance'
        if (rand < 0.45) status = 'available'
        else if (rand < 0.85) status = 'occupied'
        else if (rand < 0.95) status = 'reserved'
        else status = 'maintenance'

        const typeIdx = Math.floor(Math.random() * 3)

        niches.push({
          id: `${area}-${row}-${col}-${level}`,
          area,
          row,
          col,
          level,
          type: types[typeIdx],
          price: typePriceMap[types[typeIdx]] + Math.floor(Math.random() * 2000),
          status,
        })
      }
    }
  }
  return niches
}

const nicheStatusColors: Record<string, string> = {
  available: 'bg-success-500 hover:bg-success-600 border-success-600',
  occupied: 'bg-slate-400 border-slate-500',
  reserved: 'bg-warning-500 hover:bg-warning-600 border-warning-600',
  maintenance: 'bg-slate-200 border-slate-300 cursor-not-allowed',
}

const nicheTypeLabels: Record<string, string> = {
  single: '单人位',
  double: '双人位',
  family: '家庭位',
}

export default function StoragePage() {
  const [activeArea, setActiveArea] = useState<AreaTab>('A')
  const [hoveredNiche, setHoveredNiche] = useState<StorageNiche | null>(null)
  const [hoverPosition, setHoverPosition] = useState({ x: 0, y: 0 })

  const [deceasedName, setDeceasedName] = useState('')
  const [preferredType, setPreferredType] = useState<string>('')

  const [contractModalOpen, setContractModalOpen] = useState(false)
  const [selectedNiche, setSelectedNiche] = useState<StorageNiche | null>(null)
  const [contractForm, setContractForm] = useState({
    familyName: '',
    familyPhone: '',
    familyIdCard: '',
    years: 20,
  })

  const [certificateModalOpen, setCertificateModalOpen] = useState(false)
  const [currentContract, setCurrentContract] = useState<StorageContract | null>(null)

  const niches = useMemo(() => generateMockNiches(activeArea), [activeArea])

  const matchedNiches = useMemo<NicheMatch[]>(() => {
    const available = niches.filter((n) => n.status === 'available')
    const filtered = preferredType ? available.filter((n) => n.type === preferredType) : available
    return filtered
      .slice(0, 6)
      .map((n) => ({ ...n, remainingYears: 20 + Math.floor(Math.random() * 10) }))
      .sort((a, b) => a.price - b.price)
  }, [niches, preferredType])

  const nicheGrid = useMemo(() => {
    const grid: Record<string, StorageNiche[]> = {}
    niches.forEach((n) => {
      const key = `${n.row}-${n.col}`
      if (!grid[key]) grid[key] = []
      grid[key].push(n)
    })
    return grid
  }, [niches])

  const handleNicheClick = (niche: StorageNiche) => {
    if (niche.status !== 'available') return
    setSelectedNiche(niche)
    setContractModalOpen(true)
  }

  const handleCreateContract = () => {
    if (!selectedNiche) return
    const startDate = new Date()
    const endDate = new Date()
    endDate.setFullYear(endDate.getFullYear() + contractForm.years)

    const contract: StorageContract = {
      id: 'CT' + Date.now(),
      nicheId: selectedNiche.id,
      nicheInfo: {
        area: selectedNiche.area,
        row: selectedNiche.row,
        col: selectedNiche.col,
        level: selectedNiche.level,
        type: selectedNiche.type,
      },
      receiptId: 'RC' + Date.now(),
      deceasedName: deceasedName || '张某某',
      familyName: contractForm.familyName,
      familyPhone: contractForm.familyPhone,
      familyIdCard: contractForm.familyIdCard,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      years: contractForm.years,
      status: 'active',
      certificateNo: `CERT-${selectedNiche.area}${Date.now().toString().slice(-8)}`,
    }
    setCurrentContract(contract)
    setContractModalOpen(false)
    setCertificateModalOpen(true)
  }

  const handlePrint = () => {
    window.print()
  }

  const QRCodeMock = ({ value }: { value: string }) => {
    const size = 21
    const pattern = useMemo(() => {
      const arr: boolean[][] = []
      let seed = 0
      for (let i = 0; i < value.length; i++) seed += value.charCodeAt(i)
      for (let r = 0; r < size; r++) {
        arr[r] = []
        for (let c = 0; c < size; c++) {
          seed = (seed * 9301 + 49297) % 233280
          arr[r][c] = seed / 233280 > 0.5
        }
      }
      for (let i = 0; i < 7; i++) {
        for (let j = 0; j < 7; j++) {
          const isFinder =
            (i === 0 || i === 6 || j === 0 || j === 6) ||
            (i >= 2 && i <= 4 && j >= 2 && j <= 4)
          arr[i][j] = isFinder
          arr[size - 7 + i][j] = isFinder
          arr[i][size - 7 + j] = isFinder
        }
      }
      return arr
    }, [value])

    return (
      <div className="inline-grid p-2 bg-white border border-slate-200 rounded-lg" style={{ gridTemplateColumns: `repeat(${size}, 1fr)` }}>
        {pattern.flatMap((row, ri) =>
          row.map((cell, ci) => (
            <div
              key={`${ri}-${ci}`}
              className={cn('w-2 h-2', cell ? 'bg-slate-900' : 'bg-white')}
            />
          ))
        )}
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="page-title flex items-center gap-2">
          <Box className="w-7 h-7 text-primary-600" />
          骨灰存放管理
        </h1>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-2 space-y-4">
          <div className="card p-4">
            <h3 className="section-title mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              区域选择
            </h3>
            <div className="flex flex-col gap-2">
              {(['A', 'B', 'C'] as AreaTab[]).map((area) => (
                <button
                  key={area}
                  onClick={() => setActiveArea(area)}
                  className={cn(
                    'px-4 py-3 rounded-lg font-medium text-left transition-all duration-150 flex items-center justify-between',
                    activeArea === area
                      ? 'bg-primary-700 text-white shadow-soft'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-sm font-bold">
                      {area}
                    </span>
                    {area}区
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-60" />
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <h3 className="section-title mb-3">图例说明</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-success-500 border border-success-600" />
                <span className="text-slate-600">可用</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-400 border border-slate-500" />
                <span className="text-slate-600">已占用</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-warning-500 border border-warning-600" />
                <span className="text-slate-600">已保留</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded bg-slate-200 border border-slate-300" />
                <span className="text-slate-600">维护中</span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-7">
          <div className="card p-6">
            <h3 className="section-title flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {activeArea}区 格位分布图
            </h3>

            <div className="relative">
              <div className="overflow-x-auto scrollbar-thin">
                <div className="inline-block min-w-full">
                  <div className="flex mb-2 ml-8">
                    {Array.from({ length: 10 }, (_, i) => (
                      <div
                        key={i}
                        className="w-14 text-center text-xs text-slate-400 font-medium"
                      >
                        {i + 1}列
                      </div>
                    ))}
                  </div>

                  {Array.from({ length: 8 }, (_, rowIdx) => (
                    <div key={rowIdx} className="flex items-center mb-1">
                      <div className="w-8 text-right pr-2 text-xs text-slate-400 font-medium">
                        {rowIdx + 1}行
                      </div>
                      {Array.from({ length: 10 }, (_, colIdx) => {
                        const key = `${rowIdx + 1}-${colIdx + 1}`
                        const stack = nicheGrid[key] || []
                        return (
                          <div
                            key={colIdx}
                            className="w-14 h-14 border border-slate-200 rounded-md bg-slate-50 p-0.5 flex flex-col gap-0.5 relative"
                          >
                            {stack
                              .sort((a, b) => a.level - b.level)
                              .map((niche) => (
                                <button
                                  key={niche.id}
                                  onClick={() => handleNicheClick(niche)}
                                  onMouseEnter={(e) => {
                                    setHoveredNiche(niche)
                                    const rect = (
                                      e.target as HTMLElement
                                    ).getBoundingClientRect()
                                    const parentRect = (
                                      e.currentTarget.closest('.card') as HTMLElement
                                    ).getBoundingClientRect()
                                    setHoverPosition({
                                      x: rect.left - parentRect.left + rect.width + 8,
                                      y: rect.top - parentRect.top,
                                    })
                                  }}
                                  onMouseLeave={() => setHoveredNiche(null)}
                                  className={cn(
                                    'flex-1 rounded-sm border transition-all duration-150',
                                    nicheStatusColors[niche.status],
                                    niche.status === 'available' &&
                                      'cursor-pointer hover:scale-105 hover:shadow-soft'
                                  )}
                                  title={`${niche.area}区 ${niche.row}行${niche.col}列 ${niche.level}层`}
                                />
                              ))}
                          </div>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {hoveredNiche && (
                <div
                  className="absolute z-10 bg-white rounded-lg shadow-hover border border-slate-100 p-3 w-56 text-sm pointer-events-none animate-fade-in"
                  style={{ left: hoverPosition.x, top: hoverPosition.y }}
                >
                  <div className="font-semibold text-slate-800 mb-2">
                    {hoveredNiche.area}区 {hoveredNiche.row}行{hoveredNiche.col}列{' '}
                    {hoveredNiche.level}层
                  </div>
                  <div className="space-y-1 text-slate-600">
                    <div className="flex justify-between">
                      <span>类型：</span>
                      <span className="font-medium">{nicheTypeLabels[hoveredNiche.type]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>价格：</span>
                      <span className="font-medium text-primary-700">
                        ¥{hoveredNiche.price.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>状态：</span>
                      <StatusBadge status={hoveredNiche.status} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-sm">
              <div className="text-slate-500">
                总计：<span className="font-semibold text-slate-800">{niches.length}</span> 个格位
              </div>
              <div className="text-slate-500">
                可用：
                <span className="font-semibold text-success-600">
                  {niches.filter((n) => n.status === 'available').length}
                </span>
              </div>
              <div className="text-slate-500">
                已占用：
                <span className="font-semibold text-slate-700">
                  {niches.filter((n) => n.status === 'occupied').length}
                </span>
              </div>
              <div className="text-slate-500">
                已保留：
                <span className="font-semibold text-warning-600">
                  {niches.filter((n) => n.status === 'reserved').length}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="xl:col-span-3 space-y-4">
          <div className="card p-4">
            <h3 className="section-title mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary-600" />
              智能格位匹配
            </h3>

            <div className="space-y-3">
              <div>
                <label className="label-field flex items-center gap-1">
                  <User className="w-3 h-3" />
                  逝者姓名
                </label>
                <input
                  type="text"
                  value={deceasedName}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  placeholder="请输入逝者姓名"
                  className="input-field"
                />
              </div>

              <div>
                <label className="label-field flex items-center gap-1">
                  <Box className="w-3 h-3" />
                  格位类型偏好
                </label>
                <select
                  value={preferredType}
                  onChange={(e) => setPreferredType(e.target.value)}
                  className="input-field"
                >
                  <option value="">全部类型</option>
                  <option value="single">单人位</option>
                  <option value="double">双人位</option>
                  <option value="family">家庭位</option>
                </select>
              </div>
            </div>

            <div className="mt-4 space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
              {matchedNiches.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  暂无匹配的可用格位
                </div>
              ) : (
                matchedNiches.map((niche) => (
                  <div
                    key={niche.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-primary-50 hover:border-primary-200 transition-all duration-150 cursor-pointer group"
                    onClick={() => {
                      setSelectedNiche(niche)
                      setContractModalOpen(true)
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-slate-800">
                        {niche.area}区 {niche.row}行{niche.col}列 {niche.level}层
                      </span>
                      <StatusBadge status="available" />
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs text-slate-500">
                      <div>类型：{nicheTypeLabels[niche.type]}</div>
                      <div>剩余：{niche.remainingYears}年</div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-lg font-bold text-primary-700">
                        ¥{niche.price.toLocaleString()}
                      </span>
                      <span className="text-xs text-primary-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                        选择 <ChevronRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={contractModalOpen}
        onClose={() => setContractModalOpen(false)}
        title="签订存放合同"
        size="lg"
        footer={
          <>
            <button
              onClick={() => setContractModalOpen(false)}
              className="btn-secondary"
            >
              <X className="w-4 h-4 mr-1" />
              取消
            </button>
            <button onClick={handleCreateContract} className="btn-primary">
              <FileText className="w-4 h-4 mr-1" />
              生成合同
            </button>
          </>
        }
      >
        {selectedNiche && (
          <div className="space-y-5">
            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100">
              <div className="text-sm text-slate-500 mb-1">已选格位</div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-primary-800">
                    {selectedNiche.area}区 {selectedNiche.row}行{selectedNiche.col}列{' '}
                    {selectedNiche.level}层
                  </span>
                  <span className="ml-2 text-sm text-slate-600">
                    {nicheTypeLabels[selectedNiche.type]}
                  </span>
                </div>
                <span className="text-lg font-bold text-primary-700">
                  ¥{selectedNiche.price.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field flex items-center gap-1">
                  <Users className="w-3 h-3" />
                  逝者姓名
                </label>
                <input
                  type="text"
                  value={deceasedName || '张某某'}
                  onChange={(e) => setDeceasedName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field flex items-center gap-1">
                  <User className="w-3 h-3" />
                  家属姓名
                </label>
                <input
                  type="text"
                  value={contractForm.familyName}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, familyName: e.target.value })
                  }
                  placeholder="请输入家属姓名"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  联系电话
                </label>
                <input
                  type="tel"
                  value={contractForm.familyPhone}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, familyPhone: e.target.value })
                  }
                  placeholder="请输入联系电话"
                  className="input-field"
                />
              </div>
              <div>
                <label className="label-field flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  身份证号
                </label>
                <input
                  type="text"
                  value={contractForm.familyIdCard}
                  onChange={(e) =>
                    setContractForm({ ...contractForm, familyIdCard: e.target.value })
                  }
                  placeholder="请输入身份证号"
                  className="input-field"
                />
              </div>
            </div>

            <div>
              <label className="label-field flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                存放年限
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 20, 30].map((y) => (
                  <button
                    key={y}
                    onClick={() => setContractForm({ ...contractForm, years: y })}
                    className={cn(
                      'py-2 rounded-lg font-medium text-sm border transition-all duration-150',
                      contractForm.years === y
                        ? 'bg-primary-700 text-white border-primary-700'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-primary-400'
                    )}
                  >
                    {y}年
                  </button>
                ))}
              </div>
              <div className="mt-2 text-sm text-slate-500">
                合同期限：{new Date().toISOString().split('T')[0]} ~{' '}
                {(() => {
                  const d = new Date()
                  d.setFullYear(d.getFullYear() + contractForm.years)
                  return d.toISOString().split('T')[0]
                })()}
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600">格位费用</span>
                <span className="text-slate-800 font-medium">
                  ¥{selectedNiche.price.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="text-slate-600">存放年限</span>
                <span className="text-slate-800 font-medium">{contractForm.years} 年</span>
              </div>
              <div className="border-t border-slate-200 my-2" />
              <div className="flex items-center justify-between">
                <span className="text-slate-800 font-semibold">应付总计</span>
                <span className="text-xl font-bold text-primary-700">
                  ¥{(selectedNiche.price * contractForm.years * 0.05 + selectedNiche.price)
                    .toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={certificateModalOpen}
        onClose={() => setCertificateModalOpen(false)}
        title="电子存放凭证"
        size="md"
        footer={
          <button onClick={handlePrint} className="btn-primary">
            <Printer className="w-4 h-4 mr-1" />
            打印凭证
          </button>
        }
      >
        {currentContract && (
          <div className="space-y-5">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-primary-700 flex items-center justify-center mb-3">
                <QrCode className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-serif text-xl font-semibold text-slate-800">
                骨灰存放凭证
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                证书编号：{currentContract.certificateNo}
              </p>
            </div>

            <div className="flex justify-center py-4">
              <QRCodeMock value={currentContract.certificateNo} />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                <div className="text-slate-500 font-medium mb-1">逝者信息</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">姓名</span>
                  <span className="text-slate-800 font-medium">
                    {currentContract.deceasedName}
                  </span>
                </div>
              </div>
              <div className="space-y-2 p-4 bg-slate-50 rounded-lg">
                <div className="text-slate-500 font-medium mb-1">家属信息</div>
                <div className="flex justify-between">
                  <span className="text-slate-500">姓名</span>
                  <span className="text-slate-800 font-medium">
                    {currentContract.familyName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">电话</span>
                  <span className="text-slate-800 font-medium">
                    {currentContract.familyPhone}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-primary-50 rounded-lg border border-primary-100 space-y-2 text-sm">
              <div className="text-slate-600 font-medium mb-1">格位信息</div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">位置</span>
                  <span className="text-slate-800 font-medium">
                    {currentContract.nicheInfo?.area}区{' '}
                    {currentContract.nicheInfo?.row}行
                    {currentContract.nicheInfo?.col}列{' '}
                    {currentContract.nicheInfo?.level}层
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">类型</span>
                  <span className="text-slate-800 font-medium">
                    {nicheTypeLabels[currentContract.nicheInfo?.type || 'single']}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">有效期</span>
                  <span className="text-slate-800 font-medium">
                    {currentContract.years}年
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">状态</span>
                  <StatusBadge status={currentContract.status} />
                </div>
              </div>
              <div className="border-t border-primary-200 pt-2 mt-2 flex justify-between">
                <span className="text-slate-500">有效期限</span>
                <span className="text-slate-800 font-medium">
                  {currentContract.startDate} 至 {currentContract.endDate}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-success-50 rounded-lg text-success-700 text-sm">
              <Check className="w-5 h-5 flex-shrink-0" />
              凭证已生成，请妥善保管此电子凭证作为存放依据
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

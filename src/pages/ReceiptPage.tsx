import { useState, useEffect } from 'react'
import {
  Plus,
  Search,
  Eye,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  User,
  FileText,
  Building2,
  Save,
} from 'lucide-react'
import DataTable, { type Column } from '@/components/ui/DataTable'
import StatusBadge from '@/components/ui/StatusBadge'
import Modal from '@/components/ui/Modal'
import { receiptApi, type DeceasedInfo } from '@/lib/api'
import { toast } from '@/store/toast'
import { cn } from '@/lib/utils'

type TableRow = DeceasedInfo & Record<string, unknown>

const RECEIPT_STATUSES = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待校验' },
  { value: 'verified', label: '已校验' },
  { value: 'rejected', label: '已退回' },
  { value: 'processing', label: '处理中' },
]

const CORRECTION_ITEMS = [
  { id: 'deathCertificate', label: '死亡证明信息' },
  { id: 'policeRecord', label: '公安备案信息' },
  { id: 'idCard', label: '身份证信息' },
  { id: 'familyInfo', label: '家属信息' },
  { id: 'deceasedInfo', label: '逝者基本信息' },
]

const TASK_TYPES = [
  { value: 'preservation', label: '防腐' },
  { value: 'cosmetics', label: '整容' },
  { value: 'both', label: '防腐+整容' },
]

const PRIORITIES = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '普通' },
  { value: 'high', label: '高' },
  { value: 'urgent', label: '紧急' },
]

const EMPTY_FORM: Omit<DeceasedInfo, 'id' | 'status'> = {
  name: '',
  gender: 'male',
  age: 0,
  idCard: '',
  dateOfDeath: '',
  causeOfDeath: '',
  deathCertificateNo: '',
  policeRecordNo: '',
  familyName: '',
  familyPhone: '',
  familyRelation: '',
}

export default function ReceiptPage() {
  const [list, setList] = useState<DeceasedInfo[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [keyword, setKeyword] = useState('')

  const [detailOpen, setDetailOpen] = useState(false)
  const [detailMode, setDetailMode] = useState<'create' | 'view'>('view')
  const [currentRecord, setCurrentRecord] = useState<DeceasedInfo | null>(null)
  const [formData, setFormData] = useState<Omit<DeceasedInfo, 'id' | 'status'>>(EMPTY_FORM)

  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyResult, setVerifyResult] = useState<DeceasedInfo['verificationResult'] | null>(null)

  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectItems, setRejectItems] = useState<string[]>([])
  const [rejectReason, setRejectReason] = useState('')

  const [assignOpen, setAssignOpen] = useState(false)
  const [assignTaskType, setAssignTaskType] = useState('preservation')
  const [assignPriority, setAssignPriority] = useState('normal')

  const fetchList = async () => {
    setLoading(true)
    try {
      const data = await receiptApi.getList({
        status: statusFilter || undefined,
        keyword: keyword || undefined,
      })
      setList(data)
    } catch (e) {
      toast.error('获取接收记录失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchList()
  }, [statusFilter])

  const handleSearch = () => {
    fetchList()
  }

  const openCreate = () => {
    setDetailMode('create')
    setCurrentRecord(null)
    setFormData(EMPTY_FORM)
    setDetailOpen(true)
  }

  const openView = (record: DeceasedInfo) => {
    setDetailMode('view')
    setCurrentRecord(record)
    setFormData({
      name: record.name,
      gender: record.gender,
      age: record.age,
      idCard: record.idCard,
      dateOfDeath: record.dateOfDeath,
      causeOfDeath: record.causeOfDeath,
      deathCertificateNo: record.deathCertificateNo,
      policeRecordNo: record.policeRecordNo,
      familyName: record.familyName,
      familyPhone: record.familyPhone,
      familyRelation: record.familyRelation,
    })
    setDetailOpen(true)
  }

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast.warning('请填写逝者姓名')
      return
    }
    if (!formData.familyName.trim()) {
      toast.warning('请填写家属姓名')
      return
    }
    try {
      await receiptApi.create({
        ...formData,
        status: 'pending',
      })
      toast.success('新增接收记录成功')
      setDetailOpen(false)
      fetchList()
    } catch (e) {
      toast.error('新增接收记录失败')
    }
  }

  const handleVerify = async (record: DeceasedInfo) => {
    try {
      const data = await receiptApi.verify(record.id!)
      setVerifyResult(data.verification || null)
      setCurrentRecord(data.receipt)
      setVerifyOpen(true)
      fetchList()
    } catch (e) {
      toast.error('校验失败')
    }
  }

  const openReject = (record: DeceasedInfo) => {
    setCurrentRecord(record)
    setRejectItems([])
    setRejectReason('')
    setRejectOpen(true)
  }

  const handleReject = async () => {
    if (rejectItems.length === 0) {
      toast.warning('请选择补正事项')
      return
    }
    if (!rejectReason.trim()) {
      toast.warning('请填写退回原因')
      return
    }
    try {
      const reasonText = `补正事项：${rejectItems.join('、')}\n退回原因：${rejectReason}`
      await receiptApi.reject(currentRecord!.id!, { reason: reasonText })
      toast.success('退回补正成功')
      setRejectOpen(false)
      fetchList()
    } catch (e) {
      toast.error('退回失败')
    }
  }

  const openAssign = (record: DeceasedInfo) => {
    setCurrentRecord(record)
    setAssignTaskType('preservation')
    setAssignPriority('normal')
    setAssignOpen(true)
  }

  const handleAssign = async () => {
    try {
      await receiptApi.assignEmbalming(currentRecord!.id!, {
        taskType: assignTaskType,
        priority: assignPriority,
      })
      toast.success('分配防腐任务成功')
      setAssignOpen(false)
      fetchList()
    } catch (e) {
      toast.error('分配失败')
    }
  }

  const columns: Column<TableRow>[] = [
    { key: 'name', title: '逝者姓名', dataIndex: 'name', sortable: true, width: 100 },
    {
      key: 'gender',
      title: '性别',
      dataIndex: 'gender',
      width: 60,
      align: 'center',
      render: (r) => (r.gender === 'male' ? '男' : '女'),
    },
    { key: 'age', title: '年龄', dataIndex: 'age', width: 60, align: 'center', sortable: true },
    { key: 'deathCertificateNo', title: '死亡证明号', dataIndex: 'deathCertificateNo', width: 140 },
    { key: 'policeRecordNo', title: '公安备案号', dataIndex: 'policeRecordNo', width: 140 },
    { key: 'familyName', title: '家属姓名', dataIndex: 'familyName', width: 100 },
    { key: 'familyPhone', title: '联系电话', dataIndex: 'familyPhone', width: 130 },
    {
      key: 'status',
      title: '状态',
      width: 90,
      align: 'center',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'actions',
      title: '操作',
      width: 320,
      align: 'center',
      render: (r) => (
        <div className="flex items-center justify-center gap-1">
          <button className="btn-ghost" onClick={() => openView(r)}>
            <Eye className="w-4 h-4 mr-1" />
            查看
          </button>
          {r.status === 'pending' && (
            <button className="btn-ghost text-success-600 hover:text-success-700 hover:bg-success-50" onClick={() => handleVerify(r)}>
              <ShieldCheck className="w-4 h-4 mr-1" />
              校验
            </button>
          )}
          {(r.status === 'pending' || r.status === 'rejected') && (
            <button className="btn-ghost text-warning-600 hover:text-warning-700 hover:bg-warning-50" onClick={() => openReject(r)}>
              <RotateCcw className="w-4 h-4 mr-1" />
              退回
            </button>
          )}
          {r.status === 'verified' && (
            <button className="btn-ghost text-primary-600 hover:text-primary-700 hover:bg-primary-50" onClick={() => openAssign(r)}>
              <Sparkles className="w-4 h-4 mr-1" />
              分配防腐
            </button>
          )}
        </div>
      ),
    },
  ]

  const toggleRejectItem = (id: string) => {
    setRejectItems((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="page-title">遗体接收管理</h1>
      </div>

      <div className="card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">状态：</label>
            <select
              className="input-field w-36"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {RECEIPT_STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[280px] max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                className="input-field pl-9"
                placeholder="搜索逝者姓名、家属姓名、死亡证明号、公安备案号、联系电话..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <button className="btn-secondary" onClick={handleSearch}>
              搜索
            </button>
          </div>
          <div className="ml-auto">
            <button className="btn-primary" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-1.5" />
              新增接收
            </button>
          </div>
        </div>
      </div>

      <DataTable<TableRow> columns={columns} data={list as TableRow[]} loading={loading} />

      <Modal
        isOpen={detailOpen}
        onClose={() => setDetailOpen(false)}
        title={detailMode === 'create' ? '新增接收登记' : '接收记录详情'}
        size="lg"
        footer={
          detailMode === 'create' ? (
            <>
              <button className="btn-secondary" onClick={() => setDetailOpen(false)}>
                取消
              </button>
              <button className="btn-primary" onClick={handleSubmit}>
                <Save className="w-4 h-4 mr-1.5" />
                保存
              </button>
            </>
          ) : (
            <button className="btn-secondary" onClick={() => setDetailOpen(false)}>
              关闭
            </button>
          )
        }
      >
        <div className="space-y-6">
          <section>
            <h4 className="section-title flex items-center gap-2 mb-3">
              <User className="w-5 h-5 text-primary-500" />
              逝者信息
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">逝者姓名 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入逝者姓名"
                  value={formData.name}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label-field">性别</label>
                  <select
                    className="input-field"
                    value={formData.gender}
                    disabled={detailMode === 'view'}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value as 'male' | 'female' })
                    }
                  >
                    <option value="male">男</option>
                    <option value="female">女</option>
                  </select>
                </div>
                <div>
                  <label className="label-field">年龄</label>
                  <input
                    type="number"
                    className="input-field"
                    placeholder="年龄"
                    value={formData.age}
                    readOnly={detailMode === 'view'}
                    onChange={(e) => setFormData({ ...formData, age: Number(e.target.value) })}
                  />
                </div>
              </div>
              <div className="col-span-2">
                <label className="label-field">身份证号</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入身份证号"
                  value={formData.idCard}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, idCard: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">死亡日期</label>
                <input
                  type="date"
                  className="input-field"
                  value={formData.dateOfDeath}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, dateOfDeath: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">死亡原因</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入死亡原因"
                  value={formData.causeOfDeath}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, causeOfDeath: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="section-title flex items-center gap-2 mb-3">
              <FileText className="w-5 h-5 text-primary-500" />
              死亡证明信息
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label-field">死亡证明编号</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入死亡证明编号"
                  value={formData.deathCertificateNo}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, deathCertificateNo: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">公安备案编号</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入公安备案编号"
                  value={formData.policeRecordNo}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, policeRecordNo: e.target.value })}
                />
              </div>
            </div>
          </section>

          <section>
            <h4 className="section-title flex items-center gap-2 mb-3">
              <Building2 className="w-5 h-5 text-primary-500" />
              家属信息
            </h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label-field">家属姓名 *</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入家属姓名"
                  value={formData.familyName}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, familyName: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">联系电话</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="请输入联系电话"
                  value={formData.familyPhone}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, familyPhone: e.target.value })}
                />
              </div>
              <div>
                <label className="label-field">与逝者关系</label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="如：子女、配偶"
                  value={formData.familyRelation}
                  readOnly={detailMode === 'view'}
                  onChange={(e) => setFormData({ ...formData, familyRelation: e.target.value })}
                />
              </div>
            </div>
          </section>

          {detailMode === 'view' && currentRecord && (
            <section>
              <h4 className="section-title flex items-center gap-2 mb-3">
                <Clock className="w-5 h-5 text-primary-500" />
                状态信息
              </h4>
              <div className="flex items-center gap-3">
                <StatusBadge status={currentRecord.status} className="px-3 py-1 text-sm" />
                {currentRecord.receiptTime && (
                  <span className="text-sm text-slate-500">
                    接收时间：{currentRecord.receiptTime}
                  </span>
                )}
              </div>
            </section>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={verifyOpen}
        onClose={() => setVerifyOpen(false)}
        title="校验结果"
        size="md"
        footer={
          <button className="btn-primary" onClick={() => setVerifyOpen(false)}>
            确认
          </button>
        }
      >
        {verifyResult && (
          <div className="space-y-5">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                {verifyResult.deathCertValid ? (
                  <CheckCircle2 className="w-8 h-8 text-success-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-danger-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-slate-800">死亡证明校验</div>
                  <div
                    className={cn(
                      'text-sm',
                      verifyResult.deathCertValid ? 'text-success-600' : 'text-danger-600'
                    )}
                  >
                    {verifyResult.deathCertValid ? '校验通过' : '校验不通过'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50">
                {verifyResult.policeRecordValid ? (
                  <CheckCircle2 className="w-8 h-8 text-success-500 flex-shrink-0" />
                ) : (
                  <XCircle className="w-8 h-8 text-danger-500 flex-shrink-0" />
                )}
                <div className="flex-1">
                  <div className="font-medium text-slate-800">公安备案校验</div>
                  <div
                    className={cn(
                      'text-sm',
                      verifyResult.policeRecordValid ? 'text-success-600' : 'text-danger-600'
                    )}
                  >
                    {verifyResult.policeRecordValid ? '校验通过' : '校验不通过'}
                  </div>
                </div>
              </div>
            </div>
            {verifyResult.issues.length > 0 && (
              <div className="p-4 rounded-xl bg-danger-50 border border-danger-100">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-danger-600" />
                  <span className="font-medium text-danger-700">异常项</span>
                </div>
                <ul className="space-y-1.5 ml-7">
                  {verifyResult.issues.map((issue, idx) => (
                    <li key={idx} className="text-sm text-danger-600 list-disc">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {verifyResult.issues.length === 0 && (
              <div className="p-4 rounded-xl bg-success-50 border border-success-100 text-center">
                <CheckCircle2 className="w-10 h-10 text-success-500 mx-auto mb-2" />
                <p className="text-success-700 font-medium">全部校验通过</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        isOpen={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="退回补正"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRejectOpen(false)}>
              取消
            </button>
            <button className="btn-warning" onClick={handleReject}>
              <RotateCcw className="w-4 h-4 mr-1.5" />
              确认退回
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="label-field">选择补正事项</label>
            <div className="space-y-2 p-4 rounded-xl bg-slate-50 border border-slate-100">
              {CORRECTION_ITEMS.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white transition-colors"
                >
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
                    checked={rejectItems.includes(item.id)}
                    onChange={() => toggleRejectItem(item.id)}
                  />
                  <span className="text-sm text-slate-700">{item.label}</span>
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="label-field">退回原因</label>
            <textarea
              className="input-field h-28 resize-none"
              placeholder="请详细描述退回原因..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="分配防腐任务"
        size="md"
        footer={
          <>
            <button className="btn-secondary" onClick={() => setAssignOpen(false)}>
              取消
            </button>
            <button className="btn-primary" onClick={handleAssign}>
              <Sparkles className="w-4 h-4 mr-1.5" />
              确认分配
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {currentRecord && (
            <div className="p-4 rounded-xl bg-slate-50 space-y-1">
              <div className="text-sm text-slate-500">逝者</div>
              <div className="font-medium text-slate-800">
                {currentRecord.name}（{currentRecord.gender === 'male' ? '男' : '女'} /{' '}
                {currentRecord.age}岁）
              </div>
            </div>
          )}
          <div>
            <label className="label-field">任务类型</label>
            <div className="grid grid-cols-3 gap-3">
              {TASK_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setAssignTaskType(t.value)}
                  className={cn(
                    'px-4 py-3 rounded-xl border text-sm font-medium transition-all',
                    assignTaskType === t.value
                      ? 'bg-primary-700 text-white border-primary-700 shadow-card'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label-field">优先级</label>
            <div className="grid grid-cols-4 gap-3">
              {PRIORITIES.map((p) => (
                <button
                  key={p.value}
                  onClick={() => setAssignPriority(p.value)}
                  className={cn(
                    'px-4 py-2.5 rounded-xl border text-sm font-medium transition-all',
                    assignPriority === p.value
                      ? p.value === 'urgent'
                        ? 'bg-danger-600 text-white border-danger-600 shadow-card'
                        : p.value === 'high'
                        ? 'bg-warning-600 text-white border-warning-600 shadow-card'
                        : p.value === 'low'
                        ? 'bg-slate-600 text-white border-slate-600 shadow-card'
                        : 'bg-success-600 text-white border-success-600 shadow-card'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-primary-300 hover:bg-primary-50'
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

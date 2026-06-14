import { cn } from '@/lib/utils'

export type StatusType =
  | 'pending'
  | 'verified'
  | 'rejected'
  | 'processing'
  | 'in_progress'
  | 'completed'
  | 'available'
  | 'maintenance'
  | 'reserved'
  | 'cancelled'
  | 'idle'
  | 'running'
  | 'queued'
  | 'overdue'
  | 'occupied'
  | 'active'
  | 'expired'
  | 'transferred'
  | 'in_transit'
  | 'delayed'
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent'

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  pending: { label: '待处理', className: 'badge-warning' },
  verified: { label: '已验证', className: 'badge-success' },
  rejected: { label: '已拒绝', className: 'badge-danger' },
  processing: { label: '处理中', className: 'badge-warning' },
  in_progress: { label: '进行中', className: 'badge-warning' },
  completed: { label: '已完成', className: 'badge-success' },
  available: { label: '可用', className: 'badge-success' },
  maintenance: { label: '维护中', className: 'badge-danger' },
  reserved: { label: '已预约', className: 'badge-warning' },
  cancelled: { label: '已取消', className: 'badge-default' },
  idle: { label: '空闲', className: 'badge-success' },
  running: { label: '运行中', className: 'badge-warning' },
  queued: { label: '排队中', className: 'badge-warning' },
  overdue: { label: '已逾期', className: 'badge-danger' },
  occupied: { label: '已占用', className: 'badge-default' },
  active: { label: '有效', className: 'badge-success' },
  expired: { label: '已过期', className: 'badge-danger' },
  transferred: { label: '已转移', className: 'badge-default' },
  in_transit: { label: '运输中', className: 'badge-warning' },
  delayed: { label: '已延误', className: 'badge-danger' },
  low: { label: '低', className: 'badge-default' },
  normal: { label: '普通', className: 'badge-success' },
  high: { label: '高', className: 'badge-warning' },
  urgent: { label: '紧急', className: 'badge-danger' },
}

interface StatusBadgeProps {
  status: StatusType | string
  label?: string
  className?: string
}

export default function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    className: 'badge-default',
  }

  return (
    <span className={cn(config.className, className)}>
      {label || config.label}
    </span>
  )
}

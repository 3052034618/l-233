import { useEffect, useState } from 'react'
import { CheckCircle, AlertCircle, XCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToastStore, type ToastType, type ToastItem } from '@/store/toast'

const iconMap: Record<ToastType, typeof CheckCircle> = {
  success: CheckCircle,
  warning: AlertCircle,
  error: XCircle,
  info: Info,
}

const colorMap: Record<ToastType, string> = {
  success: 'bg-success-50 border-success-200 text-success-700',
  warning: 'bg-warning-50 border-warning-200 text-warning-700',
  error: 'bg-danger-50 border-danger-200 text-danger-700',
  info: 'bg-primary-50 border-primary-200 text-primary-700',
}

const iconColorMap: Record<ToastType, string> = {
  success: 'text-success-500',
  warning: 'text-warning-500',
  error: 'text-danger-500',
  info: 'text-primary-500',
}

function ToastNotification({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  const [isExiting, setIsExiting] = useState(false)
  const Icon = iconMap[toast.type]

  useEffect(() => {
    if (toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(onClose, 300)
      }, toast.duration - 300)
      return () => clearTimeout(timer)
    }
  }, [toast.duration, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(onClose, 300)
  }

  return (
    <div
      className={cn(
        'flex items-start gap-3 w-80 px-4 py-3 rounded-xl border shadow-card bg-white transition-all duration-300',
        colorMap[toast.type],
        isExiting
          ? 'opacity-0 translate-x-8'
          : 'opacity-100 translate-x-0 animate-slide-in-right'
      )}
    >
      <Icon className={cn('w-5 h-5 flex-shrink-0 mt-0.5', iconColorMap[toast.type])} />
      <p className="flex-1 text-sm leading-relaxed">{toast.message}</p>
      <button
        onClick={handleClose}
        className="flex-shrink-0 p-0.5 rounded-md hover:bg-black/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}

export default function Toast() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastNotification toast={toast} onClose={() => removeToast(toast.id)} />
        </div>
      ))}
    </div>
  )
}

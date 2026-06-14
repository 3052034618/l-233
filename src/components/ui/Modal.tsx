import { useEffect, useRef, ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  closeOnOverlay?: boolean
}

const sizeMap = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
  full: 'max-w-5xl',
}

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnOverlay = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className={cn(
          'absolute inset-0 bg-black/50 transition-opacity duration-200',
          isOpen ? 'opacity-100' : 'opacity-0'
        )}
        onClick={() => closeOnOverlay && onClose()}
      />

      <div
        ref={modalRef}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-hover flex flex-col max-h-[90vh]',
          sizeMap[size],
          'transition-all duration-200',
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h3 className="font-serif text-lg font-semibold text-slate-800">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {children}
        </div>

        {footer && (
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

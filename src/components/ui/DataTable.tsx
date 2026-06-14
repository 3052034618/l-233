import { useState, useMemo, ReactNode } from 'react'
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Column<T> {
  key: string
  title: string
  dataIndex?: keyof T
  render?: (record: T, index: number) => ReactNode
  sortable?: boolean
  width?: string | number
  align?: 'left' | 'center' | 'right'
  className?: string
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  rowKey?: keyof T | ((record: T) => string)
  loading?: boolean
  emptyText?: string
  className?: string
  onRowClick?: (record: T, index: number) => void
  pagination?: boolean
  pageSize?: number
  showTotal?: boolean
}

type SortOrder = 'asc' | 'desc' | null

function compareValues<T>(a: T, b: T, key: keyof T): number {
  const aVal = a[key]
  const bVal = b[key]

  if (aVal == null && bVal == null) return 0
  if (aVal == null) return 1
  if (bVal == null) return -1

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return aVal - bVal
  }

  return String(aVal).localeCompare(String(bVal), 'zh-CN')
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  rowKey = 'id' as keyof T,
  loading = false,
  emptyText = '暂无数据',
  className,
  onRowClick,
  pagination = true,
  pageSize = 10,
  showTotal = true,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1)
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortOrder, setSortOrder] = useState<SortOrder>(null)

  const sortedData = useMemo(() => {
    if (!sortKey || !sortOrder) return data

    const column = columns.find((c) => c.key === sortKey)
    if (!column || !column.dataIndex) return data

    const sorted = [...data].sort((a, b) => compareValues(a, b, column.dataIndex!))
    return sortOrder === 'desc' ? sorted.reverse() : sorted
  }, [data, sortKey, sortOrder, columns])

  const totalPages = Math.max(1, Math.ceil(sortedData.length / pageSize))
  const currentPageData = pagination
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData

  const handleSort = (key: string) => {
    if (sortKey === key) {
      if (sortOrder === 'asc') {
        setSortOrder('desc')
      } else if (sortOrder === 'desc') {
        setSortKey(null)
        setSortOrder(null)
      }
    } else {
      setSortKey(key)
      setSortOrder('asc')
    }
    if (pagination) setCurrentPage(1)
  }

  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    const value = record[rowKey]
    return value != null ? String(value) : String(index)
  }

  const alignClass = (align?: 'left' | 'center' | 'right') => {
    switch (align) {
      case 'center':
        return 'text-center'
      case 'right':
        return 'text-right'
      default:
        return 'text-left'
    }
  }

  if (loading) {
    return (
      <div className={cn('card overflow-hidden', className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      'px-4 py-3 text-sm font-medium text-slate-600',
                      alignClass(col.align),
                      col.className
                    )}
                    style={col.width ? { width: col.width } : undefined}
                  >
                    <div className="h-4 bg-slate-200 rounded animate-pulse" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn(
                        'px-4 py-3 text-sm',
                        alignClass(col.align),
                        col.className
                      )}
                    >
                      <div className="h-4 bg-slate-100 rounded animate-pulse" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('card overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-sm font-medium text-slate-600 whitespace-nowrap',
                    alignClass(col.align),
                    col.className,
                    col.sortable && 'cursor-pointer select-none hover:bg-slate-100 transition-colors'
                  )}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className={cn('inline-flex items-center gap-1', alignClass(col.align) === 'text-center' && 'justify-center w-full')}>
                    {col.title}
                    {col.sortable && (
                      <span className="flex flex-col -space-y-1">
                        <ChevronUp
                          className={cn(
                            'w-3 h-3 transition-colors',
                            sortKey === col.key && sortOrder === 'asc'
                              ? 'text-primary-600'
                              : 'text-slate-300'
                          )}
                        />
                        <ChevronDown
                          className={cn(
                            'w-3 h-3 transition-colors',
                            sortKey === col.key && sortOrder === 'desc'
                              ? 'text-primary-600'
                              : 'text-slate-300'
                          )}
                        />
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentPageData.length === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                    <Inbox className="w-12 h-12 mb-3" />
                    <p className="text-sm">{emptyText}</p>
                  </div>
                </td>
              </tr>
            ) : (
              currentPageData.map((record, index) => {
                const absoluteIndex = (currentPage - 1) * pageSize + index
                return (
                  <tr
                    key={getRowKey(record, absoluteIndex)}
                    className={cn(
                      'transition-colors',
                      onRowClick && 'cursor-pointer hover:bg-slate-50'
                    )}
                    onClick={() => onRowClick?.(record, absoluteIndex)}
                  >
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          'px-4 py-3 text-sm text-slate-700',
                          alignClass(col.align),
                          col.className
                        )}
                      >
                        {col.render
                          ? col.render(record, absoluteIndex)
                          : col.dataIndex
                          ? (record[col.dataIndex] as ReactNode)
                          : null}
                      </td>
                    ))}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {pagination && sortedData.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100">
          {showTotal && (
            <p className="text-sm text-slate-500">
              共 {sortedData.length} 条数据
            </p>
          )}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  if (totalPages <= 5) return true
                  if (page === 1 || page === totalPages) return true
                  if (Math.abs(page - currentPage) <= 1) return true
                  return false
                })
                .map((page, idx, arr) => (
                  <span key={page} className="flex items-center">
                    {idx > 0 && page - arr[idx - 1] > 1 && (
                      <span className="px-2 text-slate-400">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={cn(
                        'min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors',
                        page === currentPage
                          ? 'bg-primary-600 text-white'
                          : 'text-slate-600 hover:bg-slate-100'
                      )}
                    >
                      {page}
                    </button>
                  </span>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

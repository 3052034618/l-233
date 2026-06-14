import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export function convertKeysToCamelCase<T = any>(obj: any): T {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToCamelCase(item)) as unknown as T
  }
  if (typeof obj !== 'object') return obj

  const result: Record<string, any> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const camelKey = toCamelCase(key)
      result[camelKey] = convertKeysToCamelCase(obj[key])
    }
  }
  return result as T
}

export function convertKeysToSnakeCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) {
    return obj.map(item => convertKeysToSnakeCase(item))
  }
  if (typeof obj !== 'object') return obj

  const result: Record<string, any> = {}
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`)
      result[snakeKey] = convertKeysToSnakeCase(obj[key])
    }
  }
  return result
}

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const toast = document.createElement('div')
  const bgColor = type === 'success' ? 'bg-success-500' : type === 'error' ? 'bg-danger-500' : 'bg-primary-500'
  toast.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg text-white text-sm font-medium shadow-lg ${bgColor} animate-fade-in`
  toast.textContent = message
  document.body.appendChild(toast)
  setTimeout(() => {
    toast.style.opacity = '0'
    toast.style.transition = 'opacity 0.3s'
    setTimeout(() => toast.remove(), 300)
  }, 3000)
}

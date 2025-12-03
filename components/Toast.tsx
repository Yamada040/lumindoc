'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToastType = 'success' | 'error' | 'info' | 'loading'

export interface ToastMessage {
  id: string
  type: ToastType
  title: string
  message?: string
  duration?: number // milliseconds, 0 for persistent
}

interface ToastProps {
  toast: ToastMessage
  onClose: (id: string) => void
}

export function Toast({ toast, onClose }: ToastProps) {
  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, toast.duration)
      return () => clearTimeout(timer)
    }
  }, [toast, onClose])

  const getIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      default:
        return <AlertCircle className="w-5 h-5 text-blue-500" />
    }
  }

  const getStyles = () => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'loading':
        return 'bg-blue-50 border-blue-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5, transition: { duration: 0.2 } }}
      className={cn(
        "pointer-events-auto max-w-sm w-full rounded-lg border shadow-lg",
        getStyles()
      )}
    >
      <div className="p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">{getIcon()}</div>
          <div className="ml-3 flex-1">
            <p className="text-sm font-medium text-gray-900">{toast.title}</p>
            {toast.message && (
              <p className="mt-1 text-sm text-gray-600">{toast.message}</p>
            )}
          </div>
          {toast.type !== 'loading' && (
            <button
              onClick={() => onClose(toast.id)}
              className="ml-4 flex-shrink-0 inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">閉じる</span>
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: ToastMessage[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 z-[100] flex items-end px-4 py-6 pointer-events-none sm:p-6"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} toast={toast} onClose={onClose} />
          ))}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Toast管理用のカスタムフック
export function useToast() {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([])

  const showToast = React.useCallback((toast: Omit<ToastMessage, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newToast: ToastMessage = {
      ...toast,
      id,
      duration: toast.duration === undefined ? 5000 : toast.duration
    }
    setToasts((prev) => [...prev, newToast])
    return id
  }, [])

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const updateToast = React.useCallback((id: string, updates: Partial<ToastMessage>) => {
    setToasts((prev) =>
      prev.map((toast) =>
        toast.id === id ? { ...toast, ...updates } : toast
      )
    )
  }, [])

  return {
    toasts,
    showToast,
    removeToast,
    updateToast
  }
}
import React, { createContext, useContext } from 'react'
import * as RadixToast from '@radix-ui/react-toast'
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '../../lib/cn'
import { useToast, type Toast, type ToastType } from '../../hooks/useToast'

// ─── Context ──────────────────────────────────────────────────────────────────

interface ToastContextValue {
  addToast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToastContext(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToastContext must be used within ToastContainer')
  return ctx
}

// ─── Icon map ─────────────────────────────────────────────────────────────────

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />,
  error:   <XCircle className="w-5 h-5 text-red-500 shrink-0" />,
  info:    <Info className="w-5 h-5 text-blue-500 shrink-0" />,
  warning: <AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0" />,
}

const bgClasses: Record<ToastType, string> = {
  success: 'border-green-200 bg-green-50',
  error:   'border-red-200 bg-red-50',
  info:    'border-blue-200 bg-blue-50',
  warning: 'border-yellow-200 bg-yellow-50',
}

// ─── Single Toast item ────────────────────────────────────────────────────────

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  return (
    <RadixToast.Root
      open
      onOpenChange={(open) => { if (!open) onRemove(toast.id) }}
      className={cn(
        'flex items-start gap-3 rounded-xl border px-4 py-3 shadow-elevated',
        'data-[state=open]:animate-slide-up',
        bgClasses[toast.type]
      )}
      duration={4000}
    >
      {icons[toast.type]}
      <RadixToast.Description className="text-sm text-gray-800 flex-1">
        {toast.message}
      </RadixToast.Description>
      <RadixToast.Close asChild>
        <button
          className="text-gray-400 hover:text-gray-600 transition-colors shrink-0"
          aria-label="Dismiss notification"
          onClick={() => onRemove(toast.id)}
        >
          <X className="w-4 h-4" />
        </button>
      </RadixToast.Close>
    </RadixToast.Root>
  )
}

// ─── ToastContainer ───────────────────────────────────────────────────────────

export function ToastContainer({ children }: { children: React.ReactNode }) {
  const { toasts, addToast, removeToast } = useToast()

  return (
    <ToastContext.Provider value={{ addToast }}>
      <RadixToast.Provider swipeDirection="right">
        {children}

        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
        ))}

        <RadixToast.Viewport className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 w-80 max-w-[100vw] outline-none" />
      </RadixToast.Provider>
    </ToastContext.Provider>
  )
}

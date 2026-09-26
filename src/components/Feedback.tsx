'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export type ToastType = 'success' | 'error' | 'info'

interface ToastItem {
  id: number
  message: string
  type: ToastType
}

interface ConfirmRequest {
  id: number
  message: string
  confirmText: string
  cancelText: string
  resolve: (ok: boolean) => void
}

type ToastListener = (item: ToastItem) => void
type ConfirmListener = (req: ConfirmRequest) => void

const toastListeners = new Set<ToastListener>()
const confirmListeners = new Set<ConfirmListener>()
let toastSeq = 1
let confirmSeq = 1

function emitToast(message: string, type: ToastType) {
  const item: ToastItem = { id: toastSeq++, message, type }
  toastListeners.forEach((listener) => listener(item))
}

export const toast = {
  success: (message: string) => emitToast(message, 'success'),
  error: (message: string) => emitToast(message, 'error'),
  info: (message: string) => emitToast(message, 'info'),
}

export function confirmDialog(
  message: string,
  options?: { confirmText?: string; cancelText?: string }
): Promise<boolean> {
  return new Promise((resolve) => {
    const req: ConfirmRequest = {
      id: confirmSeq++,
      message,
      confirmText: options?.confirmText ?? '确定',
      cancelText: options?.cancelText ?? '取消',
      resolve,
    }
    confirmListeners.forEach((listener) => listener(req))
  })
}

const toastStyles: Record<ToastType, string> = {
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  error: 'bg-red-100 text-red-600 border border-red-200',
  info: 'bg-slate-100 text-slate-600 border border-slate-200',
}

export default function FeedbackHost() {
  const pathname = usePathname()
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const [confirmReq, setConfirmReq] = useState<ConfirmRequest | null>(null)
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())
  const hasBottomNav = pathname === '/' || pathname === '/stats'

  useEffect(() => {
    const onToast: ToastListener = (item) => {
      setToasts((prev) => [...prev, item])
      const timer = setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== item.id))
        timersRef.current.delete(item.id)
      }, 1800)
      timersRef.current.set(item.id, timer)
    }
    const onConfirm: ConfirmListener = (req) => setConfirmReq(req)

    toastListeners.add(onToast)
    confirmListeners.add(onConfirm)

    return () => {
      toastListeners.delete(onToast)
      confirmListeners.delete(onConfirm)
      timersRef.current.forEach((timer) => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const resolveConfirm = (ok: boolean) => {
    confirmReq?.resolve(ok)
    setConfirmReq(null)
  }

  return (
    <>
      <div
        className={`pointer-events-none fixed left-1/2 z-[100] flex -translate-x-1/2 flex-col items-center gap-2 ${
          hasBottomNav ? 'bottom-24' : 'bottom-8'
        }`}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`animate-toast-in inline-flex max-w-[calc(100vw-3rem)] items-center rounded-full px-4 py-1.5 text-center text-xs font-semibold shadow-md shadow-black/5 ${toastStyles[t.type]}`}
          >
            {t.message}
          </div>
        ))}
      </div>

      {confirmReq && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
          <div className="animate-toast-in w-full max-w-xs rounded-2xl bg-white p-5 shadow-2xl">
            <p className="mb-5 text-center text-sm font-medium text-slate-700">
              {confirmReq.message}
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => resolveConfirm(false)}
                className="flex-1 rounded-xl bg-slate-100 py-2.5 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-200"
              >
                {confirmReq.cancelText}
              </button>
              <button
                type="button"
                onClick={() => resolveConfirm(true)}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-600"
              >
                {confirmReq.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

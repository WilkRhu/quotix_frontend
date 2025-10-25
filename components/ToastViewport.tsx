
'use client'

import { useToastStore, type ToastData } from '../stories/toastStore'
import Toast from './Toast'

export default function ToastViewport() {
  const { toasts, removeToast } = useToastStore()

  if (toasts.length === 0) {
    return null
  }

  return (
    <div
      className="toast-container position-fixed top-0 start-50 translate-middle-x p-3"
      style={{ zIndex: 9999 }}
    >
      {toasts.map((toast: ToastData) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
          onConfirm={toast.onConfirm}
        />
      ))}
    </div>
  )
}
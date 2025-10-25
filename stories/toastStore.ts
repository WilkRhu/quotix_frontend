'use client'

import { create } from 'zustand'

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirmation'

export interface ToastData {
  id: string
  message: string
  type: ToastType
  onConfirm?: () => void
}

export interface ToastStoreState {
  toasts: ToastData[]
  showToast: (message: string, type: ToastType, onConfirm?: () => void) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

const generateToastId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],
  showToast: (message: string, type: ToastType, onConfirm?: () => void) => {
    const id = generateToastId()
    set((state) => ({
      toasts: [...state.toasts, { id, message, type, onConfirm }],
    }))
  },
  removeToast: (id: string) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },
  clearToasts: () => set({ toasts: [] }),
}))

export const useToast = () => {
  const { showToast, removeToast, clearToasts } = useToastStore()

  return { showToast, removeToast, clearToasts }
}

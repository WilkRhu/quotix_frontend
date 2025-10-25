'use client'

import { useEffect } from 'react'

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'confirmation'

interface ToastProps {
  message: string
  type: ToastType
  onClose: () => void
  onConfirm?: () => void
  duration?: number
}

export default function Toast({ message, type, onClose, onConfirm, duration = 5000 }: ToastProps) {
  useEffect(() => {
    if (type !== 'confirmation') {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [onClose, duration, type])

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm()
    }
    onClose()
  }

  const getTypeClasses = () => {
    switch (type) {
      case 'success':
        return 'bg-success text-white'
      case 'error':
        return 'bg-danger text-white'
      case 'warning':
        return 'bg-warning text-dark'
      case 'info':
        return 'bg-info text-white'
      case 'confirmation':
        return 'bg-light text-dark border'
      default:
        return 'bg-primary text-white'
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'fas fa-check-circle'
      case 'error':
        return 'fas fa-exclamation-circle'
      case 'warning':
        return 'fas fa-exclamation-triangle'
      case 'confirmation':
        return 'fas fa-question-circle'
      case 'info':
        return 'fas fa-info-circle'
      default:
        return 'fas fa-bell'
    }
  }

  return (
    <div className={`toast show ${getTypeClasses()}`} style={{ minWidth: '300px' }}>
      <div className="toast-body d-flex align-items-center">
        <i className={`${getIcon()} me-2`}></i>
        <span className="flex-grow-1">{message}</span>
        {type !== 'confirmation' && (
          <button 
            type="button" 
            className={`btn-close ${type === 'warning' ? '' : 'btn-close-white'} ms-2`}
            onClick={onClose}
          ></button>
        )}
      </div>
      {type === 'confirmation' && (
        <div className="toast-footer d-flex justify-content-end p-2 border-top">
          <button className="btn btn-sm btn-secondary me-2" onClick={onClose}>Cancelar</button>
          <button className="btn btn-sm btn-primary" onClick={handleConfirm}>Confirmar</button>
        </div>
      )}
    </div>
  )
}
'use client'

import { useAuth } from '../stories/authStore'
import { useToast } from '../stories/toastStore'
import { useOffersStore } from '../stories/offersStore'

/**
 * Hook customizado que combina AuthStore, ToastStore e OffersStore
 * Útil para componentes que precisam de múltiplos stores
 */
export function useAppState() {
  const auth = useAuth()
  const toast = useToast()
  const offers = useOffersStore()

  return {
    auth,
    toast,
    offers,
  }
}

/**
 * Hook para gerenciar requisições com feedback ao usuário
 */
export function useAsyncAction() {
  const { showToast } = useToast()

  const execute = async <T,>(
    action: () => Promise<T>,
    options?: {
      successMessage?: string
      errorMessage?: string
      onSuccess?: (data: T) => void
      onError?: (error: Error) => void
    }
  ): Promise<T | null> => {
    try {
      const result = await action()

      if (options?.successMessage) {
        showToast(options.successMessage, 'success')
      }

      options?.onSuccess?.(result)
      return result
    } catch (error) {
      const errorMessage =
        options?.errorMessage ||
        (error instanceof Error ? error.message : 'Ocorreu um erro')

      showToast(errorMessage, 'error')
      options?.onError?.(error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  return { execute }
}

/**
 * Hook para confirmação de ações
 */
export function useConfirmAction() {
  const { showToast } = useToast()

  const confirm = (
    message: string,
    onConfirm: () => Promise<void> | void,
    options?: {
      successMessage?: string
      errorMessage?: string
    }
  ) => {
    showToast(message, 'confirmation', async () => {
      try {
        await onConfirm()
        if (options?.successMessage) {
          showToast(options.successMessage, 'success')
        }
      } catch (error) {
        const errorMsg =
          options?.errorMessage ||
          (error instanceof Error ? error.message : 'Erro ao confirmar ação')
        showToast(errorMsg, 'error')
      }
    })
  }

  return { confirm }
}

'use client'

import { create, type StateCreator } from 'zustand'
import { API_BASE_URL } from '../lib/api'
import { useAuthStore } from './authStore'

type Loja = any
type BaseCalculo = any
type TipoOferta = any
type Plano = any

interface OffersStoreState {
  lojas: Loja[]
  basesCalculo: BaseCalculo[]
  tiposOferta: TipoOferta[]
  planos: Plano[]
  loading: boolean
  loadLojas: () => Promise<void>
  loadBasesCalculo: () => Promise<void>
  loadTiposOferta: () => Promise<void>
  loadPlanos: () => Promise<void>
  createOferta: (ofertaData: any) => Promise<any>
  updateLojaTipo: (lojaId: string, tipoOferta: any) => void
  createTipoOferta: (tipoData: any) => Promise<any>
  updateTipoOferta: (id: string, tipoData: any) => Promise<any>
  deleteTipoOferta: (id: string) => Promise<void>
  associarTipoOferta: (lojaId: string, tipoOfertaId: string) => Promise<void>
}

const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const { token } = useAuthStore.getState()
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
    ...(token && { Authorization: `Bearer ${token}` }),
  }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))
    throw new Error(errorData.message || 'Ocorreu um erro na requisição')
  }
  return response.json()
}

const offersStoreCreator: StateCreator<OffersStoreState> = (set, get) => ({
  lojas: [],
  basesCalculo: [],
  tiposOferta: [],
  planos: [],
  loading: false,

  loadLojas: async () => {
    set({ loading: true })
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/api/lojas`)
      set({ lojas: data })
    } catch (error) {
      console.error('Erro ao carregar lojas:', error)
    } finally {
      set({ loading: false })
    }
  },

  loadBasesCalculo: async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/api/lojas/ofertas/bases-calculo`)
      set({ basesCalculo: data })
    } catch (error) {
      console.error('Erro ao carregar bases de cálculo:', error)
    }
  },

  loadTiposOferta: async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/api/lojas/tipo-ofertas`)
      set({ tiposOferta: data })
    } catch (error) {
      console.error('Erro ao carregar tipos de oferta:', error)
    }
  },

  loadPlanos: async () => {
    try {
      const data = await fetchWithAuth(`${API_BASE_URL}/api/planos`)
      set({ planos: data })
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
    }
  },

  createOferta: async (ofertaData: any) => {
    const payload = await fetchWithAuth(`${API_BASE_URL}/api/lojas/admin/ofertas`, {
      method: 'POST',
      body: JSON.stringify(ofertaData),
    })
    if (payload && payload.tipo && payload.lojaId) {
      get().updateLojaTipo(payload.lojaId, payload.tipo)
    }
    return payload
  },

  updateLojaTipo: (lojaId: string, tipoOferta: any) => {
    set((state) => ({
      lojas: state.lojas.map((l) => (l.id === lojaId ? { ...l, tipoOferta } : l)),
    }))
  },

  createTipoOferta: async (tipoData: any) => {
    const newTipo = await fetchWithAuth(`${API_BASE_URL}/api/lojas/tipo-ofertas`, {
      method: 'POST',
      body: JSON.stringify(tipoData),
    })
    set((state) => ({ tiposOferta: [...state.tiposOferta, newTipo] }))
    return newTipo
  },

  updateTipoOferta: async (id: string, tipoData: any) => {
    const updatedTipo = await fetchWithAuth(`${API_BASE_URL}/api/lojas/tipo-ofertas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(tipoData),
    })
    set((state) => ({
      tiposOferta: state.tiposOferta.map((t) => (t.id === id ? updatedTipo : t)),
    }))
    return updatedTipo
  },

  deleteTipoOferta: async (id: string) => {
    await fetchWithAuth(`${API_BASE_URL}/api/lojas/tipo-ofertas/${id}`, {
      method: 'DELETE',
    })
    set((state) => ({
      tiposOferta: state.tiposOferta.filter((t) => t.id !== id),
    }))
  },

  associarTipoOferta: async (lojaId: string, tipoOfertaId: string) => {
    await fetchWithAuth(`${API_BASE_URL}/api/lojas/${lojaId}/associar-tipo-oferta`, {
      method: 'POST',
      body: JSON.stringify({ tipoOfertaId }),
    })
    get().loadLojas()
  },
})

export const useOffersStore = create<OffersStoreState>(offersStoreCreator)
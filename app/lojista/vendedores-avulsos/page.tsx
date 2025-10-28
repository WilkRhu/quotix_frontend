'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'

export default function VendedoresAvulsosPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [config, setConfig] = useState({
    aceitaVendedorAvulso: false,
    comissaoVendedorAvulso: 5.0
  })
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')

  useEffect(() => {
    carregarConfiguracoes()
  }, [])

  const carregarConfiguracoes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/lojas/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const loja = await response.json()
        setConfig({
          aceitaVendedorAvulso: loja.aceitaVendedorAvulso || false,
          comissaoVendedorAvulso: loja.comissaoVendedorAvulso || 5.0
        })
      }
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const salvarConfiguracoes = async () => {
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${API_BASE_URL}/lojas/me/vendedor-avulso`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Configurações salvas com sucesso!')
        setMessageType('success')
      } else {
        setMessage(data.message || 'Erro ao salvar configurações')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Erro ao conectar com o servidor')
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
        <DashboardLayout title="Vendedores Avulsos">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
      <DashboardLayout title="Vendedores Avulsos">
        <div className="card">
          <div className="card-header">
            <h5 className="mb-0">
              <i className="fas fa-user-tie me-2"></i>
              Configurações de Vendedores Avulsos
            </h5>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} mb-4`}>
                <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                {message}
              </div>
            )}

            <div className="row">
              <div className="col-md-6">
                <div className="form-group mb-4">
                  <label className="form-label fw-bold">
                    Aceitar Vendedores Avulsos
                  </label>
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="aceitaVendedorAvulso"
                      checked={config.aceitaVendedorAvulso}
                      onChange={(e) => handleChange('aceitaVendedorAvulso', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="aceitaVendedorAvulso">
                      {config.aceitaVendedorAvulso ? 'Sim, aceito vendedores avulsos' : 'Não aceito vendedores avulsos'}
                    </label>
                  </div>
                </div>
              </div>

              {config.aceitaVendedorAvulso && (
                <div className="col-md-6">
                  <div className="form-group mb-4">
                    <label className="form-label fw-bold">
                      Comissão Padrão (%)
                    </label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={config.comissaoVendedorAvulso}
                        onChange={(e) => handleChange('comissaoVendedorAvulso', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="50"
                        step="0.1"
                        placeholder="5.0"
                      />
                      <span className="input-group-text">%</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              className="btn btn-primary"
              onClick={salvarConfiguracoes}
              disabled={saving}
            >
              {saving ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  Salvando...
                </>
              ) : (
                <>
                  <i className="fas fa-save me-2"></i>
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
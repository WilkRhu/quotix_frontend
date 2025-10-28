'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'

export default function ConfiguracoesPage() {
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
      const response = await fetch(`${API_BASE_URL}/api/lojas/me`, {
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
      const response = await fetch(`${API_BASE_URL}/api/lojas/me/vendedor-avulso`, {
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
        <DashboardLayout title="Configurações">
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
      <DashboardLayout title="Configurações">
        {message && (
          <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} mb-4`}>
            <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
            {message}
          </div>
        )}

        <div className="row">
          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-header bg-gradient-primary">
                <h6 className="text-white mb-0">
                  <i className="fas fa-user-tie me-2"></i>
                  Vendedores Avulsos
                </h6>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">
                  Configure se sua loja aceita vendedores independentes
                </p>
                
                <div className="form-group mb-3">
                  <div className="form-check form-switch">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="aceitaVendedorAvulso"
                      checked={config.aceitaVendedorAvulso}
                      onChange={(e) => handleChange('aceitaVendedorAvulso', e.target.checked)}
                    />
                    <label className="form-check-label" htmlFor="aceitaVendedorAvulso">
                      Aceitar vendedores avulsos
                    </label>
                  </div>
                </div>

                {config.aceitaVendedorAvulso && (
                  <div className="form-group mb-3">
                    <label className="form-label">Comissão Padrão (%)</label>
                    <div className="input-group">
                      <input
                        type="number"
                        className="form-control"
                        value={config.comissaoVendedorAvulso}
                        onChange={(e) => handleChange('comissaoVendedorAvulso', parseFloat(e.target.value) || 0)}
                        min="0"
                        max="50"
                        step="0.1"
                        placeholder="Ex: 5.0"
                      />
                      <span className="input-group-text">%</span>
                    </div>
                    <small className="text-muted">
                      Percentual do valor da venda que será pago como comissão
                    </small>
                  </div>
                )}

                <button
                  type="button"
                  className="btn btn-primary btn-sm w-100"
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
          </div>

          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-header bg-gradient-info">
                <h6 className="text-white mb-0">
                  <i className="fas fa-bell me-2"></i>
                  Notificações
                </h6>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">
                  Configure suas preferências de notificação
                </p>
                <div className="text-center text-muted">
                  <i className="fas fa-tools fa-2x mb-2"></i>
                  <p>Em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card h-100">
              <div className="card-header bg-gradient-success">
                <h6 className="text-white mb-0">
                  <i className="fas fa-shield-alt me-2"></i>
                  Segurança
                </h6>
              </div>
              <div className="card-body">
                <p className="text-muted mb-3">
                  Configurações de segurança da conta
                </p>
                <div className="text-center text-muted">
                  <i className="fas fa-tools fa-2x mb-2"></i>
                  <p>Em desenvolvimento</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
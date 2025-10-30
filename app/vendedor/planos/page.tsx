'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import PaymentModal from '../../../components/PaymentModal'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import { useToast } from '../../../stories/toastStore'
import { formatCurrency } from '../../../lib/formatters'

interface PlanoTemplate {
  id: string
  nome: string
  descricao: string
  tipo?: 'pago' | 'parceria'
  precoMensal?: number
  precoTrimestral?: number
  precoSemestral?: number
  precoAnual?: number
  percentualPlataforma?: number
  isTrial: boolean
  status: 'ativo' | 'inativo'
}

interface PlanoAtivo {
  id: string
  template: PlanoTemplate
  dataInicio: string
  dataFim: string
  ativo: boolean
}

export default function PlanosVendedor() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [templates, setTemplates] = useState<PlanoTemplate[]>([])
  const [planoAtivo, setPlanoAtivo] = useState<PlanoAtivo | null>(null)
  const [trialCountdown, setTrialCountdown] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<PlanoTemplate | null>(null)

  useEffect(() => {
    if (token) {
      buscarTemplates()
      buscarPlanoAtivo()
    }
  }, [token])

  // Atualiza contagem regressiva do trial
  useEffect(() => {
    if (planoAtivo?.template?.isTrial && planoAtivo.dataFim) {
      const updateCountdown = () => {
        const end = new Date(planoAtivo.dataFim).getTime()
        const now = Date.now()
        const diff = end - now
        if (diff <= 0) {
          setTrialCountdown('Expirado')
          return
        }
        const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
        const horas = Math.floor((diff / (1000 * 60 * 60)) % 24)
        const minutos = Math.floor((diff / (1000 * 60)) % 60)
        const segundos = Math.floor((diff / 1000) % 60)
        setTrialCountdown(`${dias}d ${horas}h ${minutos}m ${segundos}s`)
      }
      updateCountdown()
      const timer = setInterval(updateCountdown, 1000)
      return () => clearInterval(timer)
    } else {
      setTrialCountdown('')
    }
  }, [planoAtivo])

  const buscarTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/planos/public/active`)
      setTemplates(response.data || [])
    } catch (error) {
      console.error('Erro ao buscar templates:', error)
      showToast('Erro ao carregar planos', 'error')
      setTemplates([])
    }
  }

  const buscarPlanoAtivo = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedor/plano-ativo`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlanoAtivo(response.data)
    } catch (error) {
      console.error('Erro ao buscar plano ativo:', error)
    }
  }

  const handleSelectPlan = (template: PlanoTemplate) => {
    setSelectedTemplate(template)
    setShowPaymentModal(true)
  }



  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="card-title mb-0">
                    <i className="fas fa-star me-2"></i>
                    Meus Planos
                  </h4>
                </div>
                <div className="card-body">
                  
                  {/* Plano Ativo */}
                  {planoAtivo && (
                    <div className="alert alert-success">
                      <h5><i className="fas fa-check-circle me-2"></i>Plano Ativo</h5>
                      <p><strong>{planoAtivo.template.nome}</strong></p>
                      <div dangerouslySetInnerHTML={{ __html: planoAtivo.template.descricao }} />
                      {planoAtivo.template.isTrial ? (
                        <>
                          <div className="mt-2">
                            <span className="badge bg-warning text-dark">Acesso Trial - Limitado a 7 dias</span>
                          </div>
                          <div className="mt-2">
                            <strong>Tempo restante:</strong> <span className="text-danger fw-bold">{trialCountdown}</span>
                          </div>
                          <small>Válido até: {new Date(planoAtivo.dataFim).toLocaleString('pt-BR')}</small>
                        </>
                      ) : (
                        <small>
                          Válido até: {new Date(planoAtivo.dataFim).toLocaleDateString('pt-BR')}
                        </small>
                      )}
                    </div>
                  )}

                  {/* Sem Plano Ativo */}
                  {!planoAtivo && (
                    <div className="alert alert-warning">
                      <h5><i className="fas fa-exclamation-triangle me-2"></i>Nenhum Plano Ativo</h5>
                      <p>Você precisa ativar um plano para criar vendas e fazer uploads.</p>
                    </div>
                  )}

                  {/* Lista de Planos */}
                  <h5 className="mt-4 mb-3">Planos Disponíveis</h5>
                  <div className="row">
                    {templates.map((template) => (
                      <div key={template.id} className="col-md-4 mb-4">
                        <div className="card h-100 shadow-lg border-0 rounded-4 plano-card" style={{ transition: 'transform 0.2s', cursor: 'pointer' }}>
                          <div className="card-header bg-gradient bg-primary text-white rounded-top-4">
                            <h5 className="card-title mb-0 fw-bold" style={{ fontSize: '1.3rem' }}>{template.nome}</h5>
                          </div>
                          <div className="card-body">
                            {/* Descrição com emojis */}
                            <div className="card-text" dangerouslySetInnerHTML={{
                              __html: template.descricao
                                ? template.descricao.replace(/<li>(.*?)<\/li>/g, (m, p1) => `<li>🚀 ${p1}</li>`)
                                : ''
                            }} />
                            <div className="mb-3">
                              {template.tipo === 'parceria' ? (
                                <>
                                  <h4 className="text-warning">{template.percentualPlataforma}%</h4>
                                  <small className="text-muted">sobre sua comissão</small>
                                  <div className="alert alert-info mt-2">
                                    <small><i className="fas fa-handshake me-1"></i>Plano Parceria - Sem mensalidade fixa</small>
                                  </div>
                                </>
                              ) : (
                                <>
                                  {template.precoMensal && template.precoMensal > 0 && (
                                    <>
                                      <h4 className="text-primary">{formatCurrency(template.precoMensal)}</h4>
                                      <small className="text-muted">por mês</small><br/>
                                    </>
                                  )}
                                  {template.precoTrimestral && template.precoTrimestral > 0 && (
                                    <>
                                      <h5 className="text-info">{formatCurrency(template.precoTrimestral)}</h5>
                                      <small className="text-muted">por trimestre</small><br/>
                                    </>
                                  )}
                                  {template.precoSemestral && template.precoSemestral > 0 && (
                                    <>
                                      <h5 className="text-warning">{formatCurrency(template.precoSemestral)}</h5>
                                      <small className="text-muted">por semestre</small><br/>
                                    </>
                                  )}
                                  {template.precoAnual && template.precoAnual > 0 && (
                                    <>
                                      <h5 className="text-success">{formatCurrency(template.precoAnual)}</h5>
                                      <small className="text-muted">por ano</small>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                            {template.isTrial && (
                              <p><i className="fas fa-gift me-2"></i>Plano Trial</p>
                            )}
                          </div>
                          <div className="card-footer bg-white rounded-bottom-4 border-0">
                            {planoAtivo?.template?.id === template.id ? (
                              <button className="btn btn-success w-100 fw-bold" disabled>
                                <span style={{ fontSize: '1.2rem' }}>✅</span> Plano Ativo
                              </button>
                            ) : (() => {
                              // Verificar se pode ativar este plano
                              const canActivate = () => {
                                if (!planoAtivo) return true
                                
                                const niveis = { trial: 0, mensal: 1, trimestral: 2, semestral: 3, anual: 4, parceria: 5 }
                                const nivelAtual = niveis[planoAtivo.periodo] || 0
                                const templateAtual = planoAtivo.template as any
                                
                                // Se já teve plano pago, não pode trial ou parceria
                                if (nivelAtual > 0 && !templateAtual?.isTrial) {
                                  if (template.isTrial || template.tipo === 'parceria') {
                                    return false
                                  }
                                }
                                
                                return true
                              }
                              
                              const isDisabled = !canActivate()
                              
                              return (
                                <button 
                                  className={`btn w-100 fw-bold ${template.tipo === 'parceria' ? 'btn-warning' : 'btn-primary'} ${isDisabled ? 'opacity-50' : ''}`}
                                  style={{ fontSize: '1.1rem', background: template.tipo === 'parceria' ? 'linear-gradient(90deg,#FFD700,#FFB300)' : 'linear-gradient(90deg,#007bff,#00c6ff)', border: 'none' }}
                                  onClick={() => !isDisabled && handleSelectPlan(template)}
                                  disabled={loading || isDisabled}
                                  title={isDisabled ? (template.isTrial ? 'Trial não disponível após plano pago' : 'Parceria não disponível após plano pago') : ''}
                                >
                                  <span style={{ fontSize: '1.2rem' }}>{template.tipo === 'parceria' ? '🤝' : '💳'}</span> 
                                  {isDisabled ? 'Não Disponível' : (template.tipo === 'parceria' ? 'Ativar Parceria' : 'Assinar Plano')}
                                </button>
                              )
                            })()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {templates.length === 0 && (
                    <div className="text-center py-4">
                      <i className="fas fa-star fa-3x text-muted mb-3"></i>
                      <h5 className="text-muted">Nenhum plano disponível</h5>
                      <p className="text-muted">Entre em contato com o administrador para ativar planos.</p>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Pagamento */}
        <PaymentModal
          show={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          template={selectedTemplate}
          token={token || ''}
          onSuccess={buscarPlanoAtivo}
          planoAtivo={planoAtivo}
        />
      </DashboardLayout>
    </ProtectedRoute>
  )
}
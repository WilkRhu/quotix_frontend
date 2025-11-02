'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
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
  periodo?: 'trial' | 'mensal' | 'trimestral' | 'semestral' | 'anual' | 'parceria'
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
  const [selectedPeriod, setSelectedPeriod] = useState<'mensal' | 'trimestral' | 'semestral' | 'anual'>('mensal')
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'pix' | 'boleto'>('card')
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    cpf: '',
  })

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
    
    // Definir período padrão baseado nos preços disponíveis (maior que 0)
    if (template.precoMensal && template.precoMensal > 0) {
      setSelectedPeriod('mensal')
    } else if (template.precoTrimestral && template.precoTrimestral > 0) {
      setSelectedPeriod('trimestral')
    } else if (template.precoSemestral && template.precoSemestral > 0) {
      setSelectedPeriod('semestral')
    } else if (template.precoAnual && template.precoAnual > 0) {
      setSelectedPeriod('anual')
    }
    
    setShowPaymentModal(true)
  }

  const getSelectedPrice = () => {
    if (!selectedTemplate) return 0
    switch (selectedPeriod) {
      case 'mensal': return selectedTemplate.precoMensal || 0
      case 'trimestral': return selectedTemplate.precoTrimestral || 0
      case 'semestral': return selectedTemplate.precoSemestral || 0
      case 'anual': return selectedTemplate.precoAnual || 0
      default: return 0
    }
  }

  const formatCPF = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    }
    return value
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    setPaymentData({...paymentData, cpf: formatted})
  }

  const processPayment = async () => {
    if (!selectedTemplate) return
    
    setLoading(true)
    try {
      const paymentResponse = await axios.post(`${API_BASE_URL}/api/payment-mock/process`, {
        amount: getSelectedPrice(),
        period: selectedPeriod,
        method: paymentMethod,
        paymentData: paymentData
      })

      if (paymentResponse.data.success) {
        const response = paymentResponse.data;
        
        if (paymentMethod === 'card') {
          // Cartão: ativar imediatamente
          await axios.post(`${API_BASE_URL}/api/vendedor/ativar-plano`, { 
            templateId: selectedTemplate.id,
            period: selectedPeriod,
            paymentId: response.paymentId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          showToast('Pagamento aprovado e plano ativado!', 'success')
          setShowPaymentModal(false)
          buscarPlanoAtivo()
        } else if (paymentMethod === 'pix') {
          // PIX: mostrar QR Code
          showToast('PIX gerado! Escaneie o QR Code para pagar.', 'info')
          // Aqui você pode abrir um modal com o QR Code
          alert(`PIX Copia e Cola:\n${response.pixCode}\n\nExpira em: ${new Date(response.expiresAt).toLocaleString('pt-BR')}`)
          setShowPaymentModal(false)
        } else if (paymentMethod === 'boleto') {
          // Boleto: mostrar código de barras
          showToast('Boleto gerado! Verifique seu email.', 'info')
          alert(`Código do Boleto:\n${response.boletoCode}\n\nVencimento: ${new Date(response.dueDate).toLocaleDateString('pt-BR')}`)
          setShowPaymentModal(false)
        }
      } else {
        showToast(paymentResponse.data.message || 'Pagamento recusado. Tente novamente.', 'error')
      }
    } catch (error) {
      console.error('Erro no pagamento:', error)
      showToast('Erro ao processar pagamento', 'error')
    } finally {
      setLoading(false)
    }
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
                                type Periodo = keyof typeof niveis
                                const periodo = planoAtivo.template.periodo as Periodo
                                const nivelAtual = niveis[periodo] || 0
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
        {showPaymentModal && selectedTemplate && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{selectedTemplate.isTrial ? 'Plano Trial' : `Pagamento - ${selectedTemplate.nome}`}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowPaymentModal(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  {selectedTemplate.isTrial ? (
                    <div className="text-center py-4">
                      <i className="fas fa-gift fa-4x text-warning mb-3"></i>
                      <h5>Plano Trial Ativado!</h5>
                      <p className="text-muted">Você está ativando o plano trial, que oferece acesso gratuito por tempo limitado para testar todos os recursos da plataforma.</p>
                      <div className="alert alert-info">
                        <strong>Vantagens do Trial:</strong>
                        <ul className="text-start mt-2">
                          <li>✅ Sem cobrança</li>
                          <li>✅ Acesso total aos recursos</li>
                          <li>✅ Ativação imediata</li>
                          <li>✅ Suporte prioritário</li>
                        </ul>
                        <p className="mt-2">Após o período de teste, escolha um plano para continuar usando a plataforma.</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* ...existing code for payment modal... */}
                    </>
                  )}
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Fechar
                  </button>
                  {selectedTemplate.isTrial ? (
                    <button
                      type="button"
                      className="btn btn-success"
                      onClick={async () => {
                        setLoading(true);
                        try {
                          await axios.post(`${API_BASE_URL}/api/vendedor/ativar-plano`, {
                            templateId: selectedTemplate.id,
                            period: 'trial',
                            paymentId: null
                          }, {
                            headers: { Authorization: `Bearer ${token}` }
                          });
                          showToast('Plano trial ativado com sucesso!', 'success');
                          setShowPaymentModal(false);
                          buscarPlanoAtivo();
                        } catch (error) {
                          showToast('Erro ao ativar trial', 'error');
                        } finally {
                          setLoading(false);
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <span className="spinner-border spinner-border-sm me-2"></span>
                      ) : (
                        <i className="fas fa-gift me-2"></i>
                      )}
                      Ativar Trial
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className="btn btn-success"
                      onClick={processPayment}
                      disabled={loading || 
                        (paymentMethod === 'card' && (!paymentData.cardNumber || !paymentData.cardName)) ||
                        ((paymentMethod === 'pix' || paymentMethod === 'boleto') && !paymentData.cpf)
                      }
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Processando...
                        </>
                      ) : (
                        <>
                          <i className={`fas ${paymentMethod === 'card' ? 'fa-credit-card' : paymentMethod === 'pix' ? 'fa-qrcode' : 'fa-barcode'} me-2`}></i>
                          {paymentMethod === 'card' ? 'Pagar' : paymentMethod === 'pix' ? 'Gerar PIX' : 'Gerar Boleto'} {formatCurrency(getSelectedPrice())}
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
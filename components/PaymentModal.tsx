'use client'

import { useState } from 'react'
import axios from 'axios'
import { API_BASE_URL } from '../lib/api'
import { formatCurrency } from '../lib/formatters'
import { useToast } from '../stories/toastStore'
import {
  PAYMENT_METHODS,
  PAYMENT_PERIODS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_ICONS,
  PAYMENT_BUTTON_LABELS,
  validateCardData,
  validateCPF,
  formatCardNumber,
  formatExpiryDate,
  formatCPF,
  MODAL_STYLES,
  type PaymentMethod,
  type PaymentPeriod
} from '../lib/payment-config'

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

interface PaymentModalProps {
  show: boolean
  onClose: () => void
  template: PlanoTemplate | null
  token: string
  onSuccess: () => void
  planoAtivo?: any
}

export default function PaymentModal({ show, onClose, template, token, onSuccess, planoAtivo }: PaymentModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState<PaymentPeriod>(PAYMENT_PERIODS.MENSAL)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PAYMENT_METHODS.CARD)
  const [paymentData, setPaymentData] = useState({
    cardNumber: '',
    cardName: '',
    expiryDate: '',
    cvv: '',
    cpf: '',
  })
  const [pixData, setPixData] = useState<any>(null)
  const [showPixModal, setShowPixModal] = useState(false)

  if (!show || !template) return null

  // Obter períodos disponíveis
  const getAvailablePeriods = () => {
    const periods = []
    if (template.precoMensal && template.precoMensal > 0) {
      periods.push({ period: PAYMENT_PERIODS.MENSAL, price: template.precoMensal, label: 'Plano Mensal', nivel: 1 })
    }
    if (template.precoTrimestral && template.precoTrimestral > 0) {
      periods.push({ period: PAYMENT_PERIODS.TRIMESTRAL, price: template.precoTrimestral, label: 'Plano Trimestral', nivel: 2 })
    }
    if (template.precoSemestral && template.precoSemestral > 0) {
      periods.push({ period: PAYMENT_PERIODS.SEMESTRAL, price: template.precoSemestral, label: 'Plano Semestral', nivel: 3 })
    }
    if (template.precoAnual && template.precoAnual > 0) {
      periods.push({ period: PAYMENT_PERIODS.ANUAL, price: template.precoAnual, label: 'Plano Anual', nivel: 4 })
    }
    return periods
  }

  const availablePeriods = getAvailablePeriods()
  
  // Definir período inicial
  if (availablePeriods.length > 0 && !availablePeriods.find(p => p.period === selectedPeriod)) {
    setSelectedPeriod(availablePeriods[0].period)
  }

  // Verificar se é downgrade ou movimento inválido
  const isInvalidMove = (newPeriod: string) => {
    if (!planoAtivo || !planoAtivo.periodo) return false
    
    const niveis = { trial: 0, mensal: 1, trimestral: 2, semestral: 3, anual: 4, parceria: 5 }
    const nivelAtual = niveis[planoAtivo.periodo] || 0
    const novoNivel = niveis[newPeriod] || 0
    const templateAtual = planoAtivo.template as any
    
    // Downgrade
    if (novoNivel < nivelAtual && !templateAtual?.isTrial) {
      return 'downgrade'
    }
    
    // Se já pagou, não pode ir para trial
    if (nivelAtual > 0 && !templateAtual?.isTrial && (template.isTrial || newPeriod === 'trial')) {
      return 'trial-blocked'
    }
    
    // Se já pagou, não pode ir para parceria
    if (nivelAtual > 0 && !templateAtual?.isTrial && (template.tipo === 'parceria' || newPeriod === 'parceria')) {
      return 'parceria-blocked'
    }
    
    return false
  }
  
  const getInvalidMessage = (type: string) => {
    switch (type) {
      case 'downgrade': return 'Downgrade não permitido'
      case 'trial-blocked': return 'Trial não disponível após plano pago'
      case 'parceria-blocked': return 'Parceria não disponível após plano pago'
      default: return ''
    }
  }

  const getSelectedPrice = () => {
    const selected = availablePeriods.find(p => p.period === selectedPeriod)
    return selected ? selected.price : 0
  }

  const getSelectedLabel = () => {
    const selected = availablePeriods.find(p => p.period === selectedPeriod)
    return selected ? selected.label : 'Plano'
  }

  const handleCPFChange = (value: string) => {
    const formatted = formatCPF(value)
    setPaymentData({...paymentData, cpf: formatted})
  }

  const handleCardNumberChange = (value: string) => {
    const formatted = formatCardNumber(value)
    setPaymentData({...paymentData, cardNumber: formatted})
  }

  const handleExpiryDateChange = (value: string) => {
    const formatted = formatExpiryDate(value)
    setPaymentData({...paymentData, expiryDate: formatted})
  }

  const processPayment = async () => {
    setLoading(true)
    try {
      const paymentResponse = await axios.post(`${API_BASE_URL}/api/payment-mock/process`, {
        amount: getSelectedPrice(),
        period: selectedPeriod,
        method: paymentMethod,
        paymentData: paymentData
      })

      if (paymentResponse.data.success) {
        const response = paymentResponse.data
        
        if (paymentMethod === PAYMENT_METHODS.CARD) {
          // Cartão: ativar imediatamente
          await axios.post(`${API_BASE_URL}/api/vendedor/ativar-plano`, { 
            templateId: template.id,
            period: selectedPeriod,
            paymentId: response.paymentId
          }, {
            headers: { Authorization: `Bearer ${token}` }
          })
          
          showToast('Pagamento aprovado e plano ativado!', 'success')
          onClose()
          onSuccess()
        } else if (paymentMethod === PAYMENT_METHODS.PIX) {
          // PIX: mostrar QR Code no modal
          setPixData(response)
          setShowPixModal(true)
          showToast('PIX gerado! Escaneie o QR Code para pagar.', 'info')
        } else if (paymentMethod === PAYMENT_METHODS.BOLETO) {
          // Boleto: mostrar código de barras
          showToast('Boleto gerado! Verifique seu email.', 'info')
          alert(`Código do Boleto:\n${response.boletoCode}\n\nVencimento: ${new Date(response.dueDate).toLocaleDateString('pt-BR')}`)
          onClose()
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

  const activateTrial = async () => {
    setLoading(true)
    try {
      await axios.post(`${API_BASE_URL}/api/vendedor/ativar-plano`, {
        templateId: template.id,
        period: 'trial',
        paymentId: null
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Plano trial ativado com sucesso!', 'success')
      onClose()
      onSuccess()
    } catch (error) {
      showToast('Erro ao ativar trial', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style jsx>{`
        .payment-card {
          transition: all 0.2s ease-in-out;
          border-width: 2px !important;
        }
        .payment-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
        .payment-card i {
          transition: transform 0.2s ease-in-out;
        }
        .payment-card:hover i {
          transform: scale(1.1);
        }
      `}</style>
      <div className="modal fade show d-block" style={MODAL_STYLES.backdrop}>
        <div className="modal-dialog">
          <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {template.isTrial ? 'Plano Trial' : `Pagamento - ${template.nome}`}
            </h5>
            <button 
              type="button" 
              className="btn-close"
              onClick={onClose}
            ></button>
          </div>
          <div className="modal-body">
            {template.isTrial ? (
              <div className="text-center py-4">
                <i className="fas fa-gift fa-4x text-warning mb-3"></i>
                <h5>Plano Trial Ativado!</h5>
                <p className="text-muted">
                  Você está ativando o plano trial, que oferece acesso gratuito por tempo limitado 
                  para testar todos os recursos da plataforma.
                </p>
                <div className="alert alert-info">
                  <strong>Vantagens do Trial:</strong>
                  <ul className="text-start mt-2">
                    <li>✅ Sem cobrança</li>
                    <li>✅ Acesso total aos recursos</li>
                    <li>✅ Ativação imediata</li>
                    <li>✅ Suporte prioritário</li>
                  </ul>
                  <p className="mt-2">
                    Após o período de teste, escolha um plano para continuar usando a plataforma.
                  </p>
                </div>
              </div>
            ) : template.tipo === 'parceria' ? (
              <div className="text-center py-4">
                <i className="fas fa-handshake fa-4x text-warning mb-3"></i>
                <h5>Plano Parceria</h5>
                <p className="text-muted">Ativando plano de parceria sem cobrança mensal.</p>
                <div className="alert alert-info">
                  <strong>Detalhes:</strong>
                  <ul className="text-start mt-2">
                    <li>🤝 Sem mensalidade fixa</li>
                    <li>💰 {template.percentualPlataforma}% sobre comissões</li>
                    <li>✅ Ativação imediata</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="py-3 text-center">
                <h5 className="mb-3">Pagamento</h5>
                <div className="mb-2" style={MODAL_STYLES.planName}>
                  {getSelectedLabel()}
                </div>
                <div className="mb-2" style={MODAL_STYLES.price}>
                  {formatCurrency(getSelectedPrice())}
                </div>
                
                {/* Seleção de Período - apenas se houver múltiplas opções */}
                {availablePeriods.length > 1 && (
                  <div className="mb-3">
                    <label className="form-label fw-bold">Período</label>
                    <select 
                      className="form-select" 
                      value={selectedPeriod} 
                      onChange={e => setSelectedPeriod(e.target.value as PaymentPeriod)}
                    >
                      {availablePeriods.map(period => (
                        <option 
                          key={period.period} 
                          value={period.period}
                          disabled={!!isInvalidMove(period.period)}
                        >
                          {period.label} - {formatCurrency(period.price)}
                          {isInvalidMove(period.period) && ` (${getInvalidMessage(isInvalidMove(period.period))})`}
                        </option>
                      ))}
                    </select>
                    {isInvalidMove(selectedPeriod) && (
                      <div className="alert alert-warning mt-2">
                        <i className="fas fa-exclamation-triangle me-2"></i>
                        {isInvalidMove(selectedPeriod) === 'downgrade' && 'Não é possível fazer downgrade do seu plano atual.'}
                        {isInvalidMove(selectedPeriod) === 'trial-blocked' && 'Plano trial não disponível após ter um plano pago.'}
                        {isInvalidMove(selectedPeriod) === 'parceria-blocked' && 'Plano de parceria não disponível após ter um plano pago.'}
                        {' Entre em contato com o suporte.'}
                      </div>
                    )}
                  </div>
                )}

                {/* Método de Pagamento */}
                <div className="mb-3">
                  <label className="form-label fw-bold">Forma de Pagamento</label>
                  <div className="row g-2">
                    <div className="col-4">
                      <div 
                        className={`card h-100 text-center payment-card ${paymentMethod === PAYMENT_METHODS.CARD ? 'border-primary bg-primary bg-opacity-10' : 'border-secondary'}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => setPaymentMethod(PAYMENT_METHODS.CARD)}
                      >
                        <div className="card-body py-3">
                          <i className={`fas fa-credit-card fa-2x mb-2 ${paymentMethod === PAYMENT_METHODS.CARD ? 'text-white' : 'text-primary'}`}></i>
                          <div className={`small fw-bold ${paymentMethod === PAYMENT_METHODS.CARD ? 'text-white' : ''}`}>Cartão</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div 
                        className={`card h-100 text-center payment-card ${paymentMethod === PAYMENT_METHODS.PIX ? 'border-success bg-success bg-opacity-10' : 'border-secondary'}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => setPaymentMethod(PAYMENT_METHODS.PIX)}
                      >
                        <div className="card-body py-3">
                          <i className={`fas fa-qrcode fa-2x mb-2 ${paymentMethod === PAYMENT_METHODS.PIX ? 'text-white' : 'text-success'}`}></i>
                          <div className={`small fw-bold ${paymentMethod === PAYMENT_METHODS.PIX ? 'text-white' : ''}`}>PIX</div>
                        </div>
                      </div>
                    </div>
                    <div className="col-4">
                      <div 
                        className={`card h-100 text-center payment-card ${paymentMethod === PAYMENT_METHODS.BOLETO ? 'border-warning bg-warning bg-opacity-10' : 'border-secondary'}`}
                        style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                        onClick={() => setPaymentMethod(PAYMENT_METHODS.BOLETO)}
                      >
                        <div className="card-body py-3">
                          <i className={`fas fa-barcode fa-2x mb-2 ${paymentMethod === PAYMENT_METHODS.BOLETO ? 'text-dark' : 'text-warning'}`}></i>
                          <div className={`small fw-bold ${paymentMethod === PAYMENT_METHODS.BOLETO ? 'text-dark' : ''}`}>Boleto</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Campos do Cartão */}
                {paymentMethod === PAYMENT_METHODS.CARD && (
                  <div className="mb-3">
                    <input 
                      type="text" 
                      className="form-control mb-2" 
                      placeholder="Número do cartão" 
                      value={paymentData.cardNumber} 
                      onChange={e => handleCardNumberChange(e.target.value)}
                      maxLength={19} 
                    />
                    <input 
                      type="text" 
                      className="form-control mb-2" 
                      placeholder="Nome no cartão" 
                      value={paymentData.cardName} 
                      onChange={e => setPaymentData({ ...paymentData, cardName: e.target.value })} 
                    />
                    <div className="row">
                      <div className="col">
                        <input 
                          type="text" 
                          className="form-control mb-2" 
                          placeholder="Validade (MM/AA)" 
                          value={paymentData.expiryDate} 
                          onChange={e => handleExpiryDateChange(e.target.value)}
                          maxLength={5} 
                        />
                      </div>
                      <div className="col">
                        <input 
                          type="text" 
                          className="form-control mb-2" 
                          placeholder="CVV" 
                          value={paymentData.cvv} 
                          onChange={e => setPaymentData({ ...paymentData, cvv: e.target.value })}
                          maxLength={4} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Campo CPF para PIX e Boleto */}
                {(paymentMethod === PAYMENT_METHODS.PIX || paymentMethod === PAYMENT_METHODS.BOLETO) && (
                  <div className="mb-3">
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="CPF" 
                      value={paymentData.cpf} 
                      onChange={e => handleCPFChange(e.target.value)}
                      maxLength={14} 
                    />
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary"
              onClick={onClose}
            >
              Fechar
            </button>
            
            {template.isTrial ? (
              <button
                type="button"
                className="btn btn-success"
                onClick={activateTrial}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <i className="fas fa-gift me-2"></i>
                )}
                Ativar Trial
              </button>
            ) : template.tipo === 'parceria' ? (
              <button
                type="button"
                className="btn btn-warning"
                onClick={async () => {
                  setLoading(true)
                  try {
                    await axios.post(`${API_BASE_URL}/api/vendedor/ativar-plano`, {
                      templateId: template.id,
                      period: 'parceria',
                      paymentId: null
                    }, {
                      headers: { Authorization: `Bearer ${token}` }
                    })
                    showToast('Plano de parceria ativado!', 'success')
                    onClose()
                    onSuccess()
                  } catch (error) {
                    showToast('Erro ao ativar parceria', 'error')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
              >
                {loading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <i className="fas fa-handshake me-2"></i>
                )}
                Ativar Parceria
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-success"
                onClick={processPayment}
                disabled={loading || 
                  !!isInvalidMove(selectedPeriod) ||
                  (paymentMethod === PAYMENT_METHODS.CARD && (!paymentData.cardNumber || !paymentData.cardName)) ||
                  ((paymentMethod === PAYMENT_METHODS.PIX || paymentMethod === PAYMENT_METHODS.BOLETO) && !validateCPF(paymentData.cpf))
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processando...
                  </>
                ) : (
                  <>
                    <i className={`fas ${PAYMENT_ICONS[paymentMethod]} me-2`}></i>
                    {PAYMENT_BUTTON_LABELS[paymentMethod]} {formatCurrency(getSelectedPrice())}
                  </>
                )}
              </button>
            )}
          </div>
          </div>
        </div>
      </div>
      
      {/* Modal PIX */}
      {showPixModal && pixData && (
        <div className="modal fade show d-block" style={MODAL_STYLES.backdrop}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">PIX Gerado</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => {
                    setShowPixModal(false)
                    onClose()
                  }}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="mb-3">
                  <img 
                    src={pixData.qrCode} 
                    alt="QR Code PIX" 
                    className="img-fluid"
                    style={{ maxWidth: '200px' }}
                  />
                </div>
                <div className="mb-3">
                  <strong>Valor: {formatCurrency(pixData.amount)}</strong>
                </div>
                <div className="mb-3">
                  <small className="text-muted">
                    Expira em: {new Date(pixData.expiresAt).toLocaleString('pt-BR')}
                  </small>
                </div>
                <div className="mb-3">
                  <label className="form-label">PIX Copia e Cola:</label>
                  <div className="input-group">
                    <input 
                      type="text" 
                      className="form-control" 
                      value={pixData.pixCode}
                      readOnly
                      style={{ fontSize: '12px' }}
                    />
                    <button 
                      className="btn btn-outline-secondary"
                      onClick={() => {
                        navigator.clipboard.writeText(pixData.pixCode)
                        showToast('Código PIX copiado!', 'success')
                      }}
                    >
                      <i className="fas fa-copy"></i>
                    </button>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowPixModal(false)
                    onClose()
                  }}
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={async () => {
                    try {
                      await axios.post(`${API_BASE_URL}/api/payment-mock/confirm/${pixData.paymentId}`, {
                        paymentId: pixData.paymentId
                      })
                      
                      await axios.post(`${API_BASE_URL}/api/vendedor/ativar-plano`, {
                        templateId: template.id,
                        period: selectedPeriod,
                        paymentId: pixData.paymentId
                      }, {
                        headers: { Authorization: `Bearer ${token}` }
                      })
                      
                      showToast('Pagamento PIX confirmado e plano ativado!', 'success')
                      setShowPixModal(false)
                      onClose()
                      onSuccess()
                    } catch (error) {
                      showToast('Erro ao confirmar pagamento', 'error')
                    }
                  }}
                >
                  <i className="fas fa-check me-2"></i>
                  Simular Pagamento
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
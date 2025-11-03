'use client'

import { useState } from 'react'
import { formatCurrency } from '../lib/formatters'
import { useToast } from '../stories/toastStore'
import { API_BASE_URL } from '@/lib/api'

interface PagamentoModalProps {
  venda: any
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function PagamentoModal({ venda, isOpen, onClose, onSuccess }: PagamentoModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [metodoPagamento, setMetodoPagamento] = useState<'pix' | 'boleto' | 'cartao'>('pix')
  const [dadosCartao, setDadosCartao] = useState({
    numero: '',
    nome: '',
    validade: '',
    cvv: '',
    parcelas: 1
  })
  const [cpf, setCpf] = useState('')
  const [pixData, setPixData] = useState<any>(null)
  const [showPixModal, setShowPixModal] = useState(false)

  if (!isOpen) return null

  const formatCardNumber = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{4})(?=\d)/g, '$1 ').trim()
  }

  const formatExpiryDate = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1/$2')
  }

  const formatCPF = (value: string) => {
    return value.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const handlePagamento = async () => {
    setLoading(true)
    try {
      // Simular processamento baseado no método
      if (metodoPagamento === 'pix') {
        // Simular geração de PIX
        const pixResponse = {
          qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          pixCode: '00020126580014BR.GOV.BCB.PIX0136' + Math.random().toString(36).substr(2, 32),
          amount: venda.valorSeguro,
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          paymentId: 'PIX_' + Date.now()
        }
        setPixData(pixResponse)
        setShowPixModal(true)
        return
      }

      // Para cartão e boleto, processar diretamente
      const response = await fetch(`${API_BASE_URL}/api/api/pagamentos/processar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendaId: venda.id,
          metodoPagamento,
          valor: venda.valorSeguro,
          dadosCartao: metodoPagamento === 'cartao' ? dadosCartao : undefined,
          cpf: metodoPagamento === 'boleto' ? cpf : undefined
        }),
      })

      const result = await response.json()

      if (result.success) {
        if (metodoPagamento === 'boleto') {
          showToast(`Boleto gerado com sucesso! Código: ${result.transactionId}`, 'success')
        } else {
          showToast('Pagamento processado com sucesso!', 'success')
        }
        onSuccess()
        onClose()
      } else {
        showToast('Erro ao processar pagamento: ' + result.message, 'error')
      }
    } catch (error) {
      showToast('Erro ao processar pagamento', 'error')
    } finally {
      setLoading(false)
    }
  }

  const confirmarPix = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/api/pagamentos/processar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          vendaId: venda.id,
          metodoPagamento: 'pix',
          valor: venda.valorSeguro,
        }),
      })

      const result = await response.json()

      if (result.success) {
        showToast('Pagamento PIX confirmado com sucesso!', 'success')
        setShowPixModal(false)
        onSuccess()
        onClose()
      }
    } catch (error) {
      showToast('Erro ao confirmar pagamento PIX', 'error')
    }
  }

  return (
    <>
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="fas fa-credit-card me-2"></i>
                Processar Pagamento
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>
            <div className="modal-body">
              <div className="container-fluid">
                <div className="mb-3">
                <h6>Detalhes da Venda</h6>
                <p className="mb-1"><strong>Veículo:</strong> {venda.marca} {venda.modelo} {venda.ano}</p>
                <p className="mb-1"><strong>Cliente:</strong> {venda.cliente?.name || venda.clienteId}</p>
                <p className="mb-1"><strong>Valor:</strong> {formatCurrency(venda.valorSeguro)}</p>
              </div>

              {/* Seleção do Método de Pagamento */}
              <div className="mb-3">
                <label className="form-label fw-bold">Forma de Pagamento</label>
                <div className="row g-2">
                  <div className="col-4">
                    <div 
                      className={`card h-100 text-center ${metodoPagamento === 'cartao' ? 'border-primary bg-primary' : 'border-secondary'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMetodoPagamento('cartao')}
                    >
                      <div className="card-body py-3">
                        <i className={`fas fa-credit-card fa-2x mb-2 ${metodoPagamento === 'cartao' ? 'text-white' : 'text-muted'}`}></i>
                        <div className={`small fw-bold ${metodoPagamento === 'cartao' ? 'text-white' : ''}`}>Cartão</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div 
                      className={`card h-100 text-center ${metodoPagamento === 'pix' ? 'border-success bg-success' : 'border-secondary'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMetodoPagamento('pix')}
                    >
                      <div className="card-body py-3">
                        <i className={`fas fa-qrcode fa-2x mb-2 ${metodoPagamento === 'pix' ? 'text-white' : 'text-muted'}`}></i>
                        <div className={`small fw-bold ${metodoPagamento === 'pix' ? 'text-white' : ''}`}>PIX</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-4">
                    <div 
                      className={`card h-100 text-center ${metodoPagamento === 'boleto' ? 'border-warning bg-warning' : 'border-secondary'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => setMetodoPagamento('boleto')}
                    >
                      <div className="card-body py-3">
                        <i className={`fas fa-barcode fa-2x mb-2 ${metodoPagamento === 'boleto' ? 'text-white' : 'text-muted'}`}></i>
                        <div className={`small fw-bold ${metodoPagamento === 'boleto' ? 'text-white' : ''}`}>Boleto</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Campos do Cartão */}
              {metodoPagamento === 'cartao' && (
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control mb-2" 
                    placeholder="Número do cartão" 
                    value={dadosCartao.numero} 
                    onChange={e => setDadosCartao({...dadosCartao, numero: formatCardNumber(e.target.value)})}
                    maxLength={19} 
                  />
                  <input 
                    type="text" 
                    className="form-control mb-2" 
                    placeholder="Nome no cartão" 
                    value={dadosCartao.nome} 
                    onChange={e => setDadosCartao({...dadosCartao, nome: e.target.value})} 
                  />
                  <div className="row">
                    <div className="col">
                      <input 
                        type="text" 
                        className="form-control mb-2" 
                        placeholder="Validade (MM/AA)" 
                        value={dadosCartao.validade} 
                        onChange={e => setDadosCartao({...dadosCartao, validade: formatExpiryDate(e.target.value)})}
                        maxLength={5} 
                      />
                    </div>
                    <div className="col">
                      <input 
                        type="text" 
                        className="form-control mb-2" 
                        placeholder="CVV" 
                        value={dadosCartao.cvv} 
                        onChange={e => setDadosCartao({...dadosCartao, cvv: e.target.value.replace(/\D/g, '')})}
                        maxLength={4} 
                      />
                    </div>
                  </div>
                  <select 
                    className="form-select" 
                    value={dadosCartao.parcelas} 
                    onChange={e => setDadosCartao({...dadosCartao, parcelas: Number(e.target.value)})}
                  >
                    <option value={1}>1x de {formatCurrency(venda.valorSeguro)}</option>
                    <option value={2}>2x de {formatCurrency(venda.valorSeguro / 2)}</option>
                    <option value={3}>3x de {formatCurrency(venda.valorSeguro / 3)}</option>
                    <option value={6}>6x de {formatCurrency(venda.valorSeguro / 6)}</option>
                    <option value={12}>12x de {formatCurrency(venda.valorSeguro / 12)}</option>
                  </select>
                </div>
              )}

              {/* Campo CPF para Boleto */}
              {metodoPagamento === 'boleto' && (
                <div className="mb-3">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="CPF" 
                    value={cpf} 
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    maxLength={14} 
                  />
                </div>
              )}

                <div className="alert alert-info">
                  <i className="fas fa-info-circle me-2"></i>
                  Este é um pagamento simulado para demonstração.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-success" 
                onClick={handlePagamento}
                disabled={loading || 
                  (metodoPagamento === 'cartao' && (!dadosCartao.numero || !dadosCartao.nome)) ||
                  (metodoPagamento === 'boleto' && !cpf)
                }
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processando...
                  </>
                ) : (
                  <>
                    <i className={`fas ${metodoPagamento === 'cartao' ? 'fa-credit-card' : metodoPagamento === 'pix' ? 'fa-qrcode' : 'fa-barcode'} me-2`}></i>
                    {metodoPagamento === 'cartao' ? 'Pagar com Cartão' : 
                     metodoPagamento === 'pix' ? 'Gerar PIX' : 'Gerar Boleto'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Modal PIX */}
      {showPixModal && pixData && (
        <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-sm">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">PIX Gerado</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={() => setShowPixModal(false)}
                ></button>
              </div>
              <div className="modal-body text-center">
                <div className="mb-3">
                  <div 
                    style={{
                      width: '200px',
                      height: '200px',
                      backgroundColor: '#f8f9fa',
                      border: '2px dashed #dee2e6',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto'
                    }}
                  >
                    <div className="text-center">
                      <i className="fas fa-qrcode fa-4x text-muted mb-2"></i>
                      <div className="small text-muted">QR Code PIX</div>
                    </div>
                  </div>
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
                        alert('Código PIX copiado!')
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
                  onClick={() => setShowPixModal(false)}
                >
                  Fechar
                </button>
                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={confirmarPix}
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
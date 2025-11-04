'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { API_BASE_URL } from '../../../lib/api'
import axios from 'axios'
import { useAuth } from '@/stories/authStore'
import React from 'react'
import { useToast } from '@/stories/toastStore'

// Estilos customizados para os cards
const cardStyles = `
  .hover-shadow-lg:hover {
    box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.175) !important;
    transform: translateY(-2px);
  }
  .transform-scale-105 {
    transform: scale(1.02) !important;
  }
  .card {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
  .opacity-60 {
    opacity: 0.6;
  }
  .lh-base {
    line-height: 1.5;
  }
`

// Componente Cronômetro Regressivo
function CronometroRegressivo({ dataVencimento }: { dataVencimento?: string }) {
  const [tempo, setTempo] = useState({ dias: 0, horas: 0, minutos: 0, segundos: 0 })

  useEffect(() => {
    if (!dataVencimento) return

    const calcularTempo = () => {
      const agora = new Date().getTime()
      const vencimento = new Date(dataVencimento).getTime()
      const diferenca = vencimento - agora

      if (diferenca > 0) {
        setTempo({
          dias: Math.floor(diferenca / (1000 * 60 * 60 * 24)),
          horas: Math.floor((diferenca % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutos: Math.floor((diferenca % (1000 * 60 * 60)) / (1000 * 60)),
          segundos: Math.floor((diferenca % (1000 * 60)) / 1000),
        })
      } else {
        setTempo({ dias: 0, horas: 0, minutos: 0, segundos: 0 })
      }
    }

    calcularTempo()
    const intervalo = setInterval(calcularTempo, 1000)
    return () => clearInterval(intervalo)
  }, [dataVencimento])

  return (
    <div className="d-flex gap-3 align-items-center">
      <div className="text-center">
        <div className="display-6 fw-bold text-warning" style={{ lineHeight: '1' }}>{tempo.dias}</div>
        <small className="text-muted">dias</small>
      </div>
      <span className="text-warning fw-bold">:</span>
      <div className="text-center">
        <div className="display-6 fw-bold text-warning" style={{ lineHeight: '1' }}>{String(tempo.horas).padStart(2, '0')}</div>
        <small className="text-muted">h</small>
      </div>
      <span className="text-warning fw-bold">:</span>
      <div className="text-center">
        <div className="display-6 fw-bold text-warning" style={{ lineHeight: '1' }}>{String(tempo.minutos).padStart(2, '0')}</div>
        <small className="text-muted">m</small>
      </div>
      <span className="text-warning fw-bold">:</span>
      <div className="text-center">
        <div className="display-6 fw-bold text-warning" style={{ lineHeight: '1' }}>{String(tempo.segundos).padStart(2, '0')}</div>
        <small className="text-muted">s</small>
      </div>
    </div>
  )
}

type Plano = {
  id: string
  nome: string
  descricao?: string
  precoMensal?: number
  precoAnual?: number
  isTrial?: boolean
  status: 'ativo' | 'inativo'
}

type Assinatura = {
  id: string
  periodicidade: 'mensal' | 'anual' | 'trial'
  isTrialAtivo: boolean
  trialVencimentoEm?: string
  dataInicio: string
  dataVencimento?: string
  status?: string
}

type Loja = {
  id: string
  nome: string
  plano?: Plano
  assinatura?: Assinatura
}

export default function PlanoLojista() {
  const [formaPagamento, setFormaPagamento] = useState('cartao')
  const [parcelas, setParcelas] = useState(1)
  const [showModal, setShowModal] = useState(false)
  const [modalTipo, setModalTipo] = useState<'upgrade' | 'downgrade' | 'mesmo' | null>(null)
  const [planoNovo, setPlanoNovo] = useState<Plano | null>(null)
  const [loja, setLoja] = useState<Loja | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [planoSelecionado, setPlanoSelecionado] = useState<string>('')

  const { token } = useAuth()
  const { showToast } = useToast()

  // Verifica se pode alterar plano
  const podeAlterarPlano = useMemo(() => {
    if (!loja) return false
    
    // Se não tem plano (gratuito), pode escolher qualquer plano
    if (!loja.plano) return true
    
    // Se é trial, pode alterar
    if (loja.plano.isTrial) return true
    
    // Se tem plano pago, verifica se é upgrade
    if (loja.plano && planoSelecionado) {
      const planoNovo = planos.find(p => p.id === planoSelecionado)
      if (planoNovo) {
        const precoNovo = Number(planoNovo.precoMensal ?? 0)
        const precoAtual = Number(loja.plano.precoMensal ?? 0)
        // Permite se for upgrade ou mesmo valor
        if (precoNovo >= precoAtual) return true
      }
    }
    
    // Verifica se assinatura está vencida
    if (loja.assinatura) {
      const status = loja.assinatura.status
      const vencimento = loja.assinatura.dataVencimento
      if (status === 'vencida') return true
      if (vencimento) {
        const agora = new Date()
        const venc = new Date(vencimento)
        if (venc < agora) return true
      }
    }
    
    return false
  }, [loja, planoSelecionado, planos])

  const diasRestantesTrialAtual = useMemo(() => {
    if (!loja?.assinatura) return 0

    const ehTrial = !loja.plano || loja.plano.isTrial
    if (!ehTrial && !loja.assinatura.isTrialAtivo) return 0

    if (loja.assinatura.trialVencimentoEm) {
      const agora = new Date()
      agora.setHours(0, 0, 0, 0)
      const vencimento = new Date(loja.assinatura.trialVencimentoEm)
      vencimento.setHours(0, 0, 0, 0)
      const diff = vencimento.getTime() - agora.getTime()
      const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return Math.max(dias, 0)
    }

    if (loja.assinatura.dataInicio) {
      const inicio = new Date(loja.assinatura.dataInicio)
      const vencimento = new Date(inicio)
      vencimento.setDate(vencimento.getDate() + 7)
      vencimento.setHours(0, 0, 0, 0)
      const agora = new Date()
      agora.setHours(0, 0, 0, 0)
      const diff = vencimento.getTime() - agora.getTime()
      const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))
      return Math.max(dias, 0)
    }

    return 0
  }, [loja])

  const valorMensalAtual = useMemo(() => {
    if (!loja?.plano) return 0
    const { precoMensal, precoAnual } = loja.plano
    if (precoMensal && precoMensal > 0) return precoMensal
    if (precoAnual && precoAnual > 0) return Number((precoAnual / 12).toFixed(2))
    return 0
  }, [loja])

  const carregar = async () => {
    try {
      const [lojaRes, planosRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/lojas/me`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/planos`, { headers: { Authorization: `Bearer ${token}` } }),
      ])
      setLoja(lojaRes.data)
      setPlanos(planosRes.data.filter((p: Plano) => p.status === 'ativo'))
      if (lojaRes.data?.plano?.id) setPlanoSelecionado(lojaRes.data.plano.id)
    } catch (e) {
      console.error('Erro ao carregar dados do plano do lojista', e)
      showToast('Erro ao carregar planos/loja', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (token) carregar()
  }, [token])

  const handleAlterarPlano = () => {
    if (!planoSelecionado) return showToast('Selecione um plano', 'warning')
    const novo = planos.find(p => p.id === planoSelecionado)
    if (!novo) return showToast('Plano inválido', 'error')
    
    const precoNovo = Number(novo.precoMensal ?? 0)
    const precoAtual = Number(loja?.plano?.precoMensal ?? 0)
    
    // Se tem plano atual e não é gratuito/trial, só permite upgrade
    if (loja?.plano && !loja.plano.isTrial && precoAtual > 0) {
      if (precoNovo <= precoAtual) {
        return showToast('Só é possível fazer upgrade para planos mais caros', 'warning')
      }
    }
    
    setPlanoNovo(novo)
    let tipo: 'upgrade' | 'downgrade' | 'mesmo' = 'mesmo'
    if (precoNovo > precoAtual) tipo = 'upgrade'
    else if (precoNovo < precoAtual) tipo = 'downgrade'
    setModalTipo(tipo)
    setShowModal(true)
  }

  const confirmarPagamento = async () => {
    setSaving(true)
    try {
      await axios.post(
        `${API_BASE_URL}/api/lojas/me/plano`,
        { planoId: planoNovo?.id },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showToast('Plano alterado com sucesso!', 'success')
      setShowModal(false)
      await carregar()
    } catch (e) {
      console.error('Erro ao alterar plano', e)
      showToast('Erro ao alterar plano', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
        <DashboardLayout title="Plano">
          <div className="d-flex justify-content-center align-items-center" style={{ height: 200 }}>
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
      <DashboardLayout title="Planos da Loja">
        <style dangerouslySetInnerHTML={{ __html: cardStyles }} />
        <div className="row">
          {/* Card do Plano Atual */}
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-lg" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              <div className="card-body text-white p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    {loja?.plano && !loja.plano.isTrial ? (
                      <>
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                            <i className="fas fa-crown text-warning fs-4"></i>
                          </div>
                          <div>
                            <h3 className="mb-1 fw-bold">{loja.plano.nome}</h3>
                            <div className="d-flex align-items-baseline gap-1">
                              <span className="fs-4 fw-bold">
                                R$ {Number(valorMensalAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                              <span className="fs-6 opacity-75">/mês</span>
                            </div>
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-check-circle me-2 text-success"></i>
                          <span className="fw-medium">Plano Ativo</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="d-flex align-items-center mb-3">
                          <div className="bg-white bg-opacity-20 rounded-circle p-3 me-3">
                            <i className="fas fa-gift text-warning fs-4"></i>
                          </div>
                          <div>
                            <h3 className="mb-1 fw-bold">Período de Teste Gratuito</h3>
                            {loja?.assinatura?.dataInicio && (
                              <div className="fs-6 opacity-90">
                                <span className="fw-medium">Válido até: </span>
                                {loja?.assinatura?.trialVencimentoEm
                                  ? new Date(loja.assinatura.trialVencimentoEm).toLocaleDateString('pt-BR')
                                  : new Date(new Date(loja.assinatura.dataInicio).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="d-flex align-items-center">
                          <i className="fas fa-clock me-2 text-warning"></i>
                          <span className="fw-medium">Explore todas as funcionalidades!</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="col-md-4 text-end">
                    {((!loja?.plano || loja?.plano?.isTrial) && diasRestantesTrialAtual > 0) && loja?.assinatura?.trialVencimentoEm && (
                      <div className="bg-white bg-opacity-15 rounded-3 p-3">
                        <div className="text-center mb-2">
                          <small className="text-uppercase fw-bold opacity-75">Tempo Restante</small>
                        </div>
                        <CronometroRegressivo dataVencimento={loja.assinatura.trialVencimentoEm} />
                      </div>
                    )}
                    {((!loja?.plano || loja?.plano?.isTrial) && diasRestantesTrialAtual > 0) && !loja?.assinatura?.trialVencimentoEm && loja?.assinatura?.dataInicio && (
                      <div className="bg-white bg-opacity-15 rounded-3 p-3">
                        <div className="text-center mb-2">
                          <small className="text-uppercase fw-bold opacity-75">Tempo Restante</small>
                        </div>
                        <CronometroRegressivo
                          dataVencimento={new Date(new Date(loja.assinatura.dataInicio).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}
                        />
                      </div>
                    )}
                    {((!loja?.plano || loja?.plano?.isTrial) && diasRestantesTrialAtual <= 0) && (
                      <div className="bg-danger bg-opacity-20 border border-danger border-opacity-50 rounded-3 p-3">
                        <div className="text-center">
                          <i className="fas fa-exclamation-triangle fs-4 mb-2 text-warning"></i>
                          <div className="fw-bold">Trial Expirado</div>
                          <small className="opacity-75">Escolha um plano para continuar</small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Planos Disponíveis */}
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header border-0 bg-white pb-0">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h5 className="mb-1 fw-bold">
                      <i className="fas fa-layer-group me-2 text-primary"></i>
                      Escolha seu Plano
                    </h5>
                    <p className="text-muted mb-0 small">Selecione o plano ideal para sua loja</p>
                  </div>
                </div>
              </div>
              <div className="card-body pt-4">
                <div className="row g-4">
                  {planos.map((p) => {
                    const mensalNum = Number(p.precoMensal ?? 0)
                    const anualNum = Number(p.precoAnual ?? 0)
                    const isAtual = loja?.plano?.id === p.id
                    const isSelecionado = planoSelecionado === p.id
                    
                    // Verifica se o plano pode ser selecionado
                    const precoAtual = Number(loja?.plano?.precoMensal ?? 0)
                    const podeSelecionar = !loja?.plano || // Sem plano (gratuito)
                                         loja.plano.isTrial || // Trial
                                         mensalNum > precoAtual || // Upgrade
                                         isAtual // Plano atual

                    return (
                      <div className="col-md-6 col-xl-4" key={p.id}>
                        <div
                          role="button"
                          className={`card h-100 position-relative overflow-hidden ${
                            !podeSelecionar ? 'opacity-60' : ''
                          } ${isSelecionado
                              ? 'border-2 border-primary shadow-lg transform-scale-105'
                              : isAtual
                                ? 'border-2 border-primary shadow-md'
                                : 'border border-light shadow-sm hover-shadow-lg'
                            }`}
                          onClick={() => podeSelecionar && setPlanoSelecionado(p.id)}
                          style={{ 
                            cursor: podeSelecionar ? 'pointer' : 'not-allowed', 
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            transform: isSelecionado ? 'scale(1.02)' : 'scale(1)'
                          }}
                        >
                          {/* Badge de destaque */}
                          {isAtual && (
                            <div className="position-absolute top-0 end-0">
                              <div className="bg-primary text-white px-3 py-1 rounded-bottom-start">
                                <i className="fas fa-check-circle me-1"></i>
                                <small className="fw-bold">ATIVO</small>
                              </div>
                            </div>
                          )}
                          {isSelecionado && !isAtual && (
                            <div className="position-absolute top-0 end-0">
                              <div className="bg-primary text-white px-3 py-1 rounded-bottom-start">
                                <i className="fas fa-cursor me-1"></i>
                                <small className="fw-bold">SELECIONADO</small>
                              </div>
                            </div>
                          )}
                          {!podeSelecionar && !isAtual && (
                            <div className="position-absolute top-0 end-0">
                              <div className="bg-secondary text-white px-3 py-1 rounded-bottom-start">
                                <i className="fas fa-lock me-1"></i>
                                <small className="fw-bold">BLOQUEADO</small>
                              </div>
                            </div>
                          )}

                          <div className="card-body d-flex flex-column p-4">
                            {/* Cabeçalho do plano */}
                            <div className="text-center mb-4">
                              <div className={`rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center ${
                                mensalNum === 0 ? 'bg-primary bg-opacity-10' : 
                                isAtual ? 'bg-primary bg-opacity-10' :
                                isSelecionado ? 'bg-primary bg-opacity-10' : 'bg-light'
                              }`} style={{ width: '60px', height: '60px' }}>
                                <i className={`fas ${
                                  mensalNum === 0 ? 'fa-gift' :
                                  isAtual ? 'fa-crown' :
                                  isSelecionado ? 'fa-star' : 'fa-layer-group'
                                } fs-4 text-white`}></i>
                              </div>
                              <h5 className="fw-bold mb-2">{p.nome}</h5>
                              {p.descricao && (
                                <div 
                                  className="text-muted small lh-base flex-grow-1"
                                  dangerouslySetInnerHTML={{ __html: p.descricao }}
                                />
                              )}
                            </div>

                            {/* Preço */}
                            <div className="text-center mb-4">
                              {mensalNum > 0 ? (
                                <>
                                  <div className="mb-2">
                                    <span className="display-6 fw-bold text-dark">
                                      R$ {mensalNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-muted fs-6">/mês</span>
                                  </div>
                                  {anualNum > 0 && (
                                    <div className="small text-primary fw-medium">
                                      <i className="fas fa-calendar-alt me-1"></i>
                                      Anual: R$ {anualNum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      <div className="badge bg-primary text-white ms-2">
                                        Economize {Math.round((1 - (anualNum / (mensalNum * 12))) * 100)}%
                                      </div>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="display-6 fw-bold text-primary">
                                  <i className="fas fa-gift me-2"></i>
                                  Gratuito
                                </div>
                              )}
                            </div>

                            {/* Botão de ação */}
                            <div className="mt-auto">
                              {isAtual ? (
                                <div className="btn btn-primary w-100 disabled">
                                  <i className="fas fa-check-circle me-2"></i>
                                  Plano Atual
                                </div>
                              ) : isSelecionado ? (
                                <div className="btn btn-primary w-100">
                                  <i className="fas fa-arrow-down me-2"></i>
                                  Confirmar Seleção
                                </div>
                              ) : podeSelecionar ? (
                                <div className="btn btn-outline-primary w-100">
                                  <i className="fas fa-mouse-pointer me-2"></i>
                                  Selecionar Plano
                                </div>
                              ) : (
                                <div className="btn btn-outline-secondary w-100 disabled">
                                  <i className="fas fa-lock me-2"></i>
                                  Indisponível
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Efeito de seleção */}
                          {isSelecionado && (
                            <div className="position-absolute bottom-0 start-0 w-100">
                              <div className="bg-primary bg-opacity-10 border-top border-primary border-opacity-25 text-center py-2">
                                <small className="text-primary fw-bold">
                                  <i className="fas fa-info-circle me-1"></i>
                                  Clique em "Confirmar Plano" para prosseguir
                                </small>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Botão de Ação */}
                <div className="row mt-4">
                  <div className="col-12 d-flex justify-content-end gap-2">
                    {planoSelecionado && planoSelecionado !== (loja?.plano?.id || '') && (
                      <>
                        <button
                          className="btn btn-outline-secondary"
                          onClick={() => setPlanoSelecionado(loja?.plano?.id || '')}
                          disabled={saving}
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn btn-primary"
                          onClick={handleAlterarPlano}
                          disabled={saving || !podeAlterarPlano}
                        >
                          <i className="fas fa-check me-2"></i>
                          Confirmar Plano
                        </button>
                        
                        {/* Modal de Pagamento */}
                        {showModal && planoNovo && (
                          <div className="modal fade show" style={{ display: 'block', background: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
                            <div className="modal-dialog modal-lg">
                              <div className="modal-content">
                                <div className="modal-header">
                                  <h5 className="modal-title">Pagamento para troca de plano</h5>
                                  <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
                                </div>
                                <div className="modal-body">
                                  <p>Você está trocando para o plano <b>{planoNovo.nome}</b>.</p>
                                  {modalTipo === 'upgrade' && (
                                    <div className="alert alert-success">
                                      <i className="fas fa-arrow-up me-2"></i>
                                      <b>Upgrade:</b> O novo plano é mais caro que o atual.
                                    </div>
                                  )}
                                  {modalTipo === 'downgrade' && (
                                    <div className="alert alert-warning">
                                      <i className="fas fa-arrow-down me-2"></i>
                                      <b>Downgrade:</b> O novo plano é mais barato que o atual.
                                    </div>
                                  )}
                                  {modalTipo === 'mesmo' && (
                                    <div className="alert alert-info">
                                      <i className="fas fa-exchange-alt me-2"></i>
                                      O valor do plano não mudou.
                                    </div>
                                  )}
                                  <div className="mt-3">
                                    <b>Valor mensal:</b> R$ {Number(planoNovo.precoMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    {formaPagamento === 'cartao' && parcelas > 1 && (
                                      <div className="mt-1 text-muted small">
                                        Total parcelado: {parcelas}x de R$ {(Number(planoNovo.precoMensal ?? 0) / parcelas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                      </div>
                                    )}
                                  </div>
                                  <div className="mt-4">
                                    <label className="form-label fw-bold">Forma de pagamento</label>
                                    <select className="form-select" value={formaPagamento} onChange={e => setFormaPagamento(e.target.value)}>
                                      <option value="cartao">Cartão de Crédito</option>
                                      <option value="boleto">Boleto</option>
                                      <option value="pix">Pix</option>
                                    </select>
                                  </div>
                                  
                                  {formaPagamento === 'cartao' && (
                                    <div className="mt-4 row g-2">
                                      <div className="col-md-6">
                                        <label className="form-label">Número do cartão</label>
                                        <input type="text" className="form-control" placeholder="0000 0000 0000 0000" maxLength={19} />
                                      </div>
                                      <div className="col-md-3">
                                        <label className="form-label">Validade</label>
                                        <input type="text" className="form-control" placeholder="MM/AA" maxLength={5} />
                                      </div>
                                      <div className="col-md-3">
                                        <label className="form-label">CVV</label>
                                        <input type="text" className="form-control" placeholder="CVV" maxLength={4} />
                                      </div>
                                      <div className="col-12">
                                        <label className="form-label">Nome impresso no cartão</label>
                                        <input type="text" className="form-control" placeholder="Nome completo" />
                                      </div>
                                      <div className="col-md-6">
                                        <label className="form-label">Parcelas</label>
                                        <select className="form-select" value={parcelas} onChange={e => setParcelas(Number(e.target.value))}>
                                          <option value={1}>1x de R$ {Number(planoNovo.precoMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (à vista)</option>
                                          {[2,3,4,5,6,7,8,9,10,11,12].map(p => (
                                            <option key={p} value={p}>
                                              {p}x de R$ {(Number(planoNovo.precoMensal ?? 0) / p).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {formaPagamento === 'pix' && (
                                    <div className="mt-4">
                                      <label className="form-label">Pix copia e cola</label>
                                      <div className="bg-light p-3 rounded border d-flex align-items-center gap-2">
                                        <span style={{ fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.9rem', flex: 1 }}>
                                          {`00020126580014BR.GOV.BCB.PIX0136fakepix${planoNovo.id}520400005303986540${Number(planoNovo.precoMensal ?? 0).toFixed(2).replace('.', '')}5802BR5920Quotix Pagamentos6009SAO PAULO62070503***`}
                                        </span>
                                        <button 
                                          className="btn btn-outline-primary btn-sm" 
                                          type="button" 
                                          onClick={() => {
                                            navigator.clipboard.writeText(`00020126580014BR.GOV.BCB.PIX0136fakepix${planoNovo.id}520400005303986540${Number(planoNovo.precoMensal ?? 0).toFixed(2).replace('.', '')}5802BR5920Quotix Pagamentos6009SAO PAULO62070503***`)
                                            showToast('Código PIX copiado!', 'success')
                                          }}
                                        >
                                          <i className="fas fa-copy"></i>
                                        </button>
                                      </div>
                                      <small className="text-muted">Use este código no seu app bancário para simular o pagamento.</small>
                                    </div>
                                  )}
                                  
                                  {formaPagamento === 'boleto' && (
                                    <div className="mt-4">
                                      <label className="form-label">Linha digitável do boleto</label>
                                      <div className="bg-light p-3 rounded border d-flex align-items-center gap-2">
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', letterSpacing: '1px', flex: 1 }}>
                                          {`34191.09008 12345.678901 23456.789012 3 000000${Number(planoNovo.precoMensal ?? 0).toFixed(2).replace('.', '')}`}
                                        </span>
                                        <button 
                                          className="btn btn-outline-primary btn-sm" 
                                          type="button" 
                                          onClick={() => {
                                            navigator.clipboard.writeText(`34191.09008 12345.678901 23456.789012 3 000000${Number(planoNovo.precoMensal ?? 0).toFixed(2).replace('.', '')}`)
                                            showToast('Linha digitável copiada!', 'success')
                                          }}
                                        >
                                          <i className="fas fa-copy"></i>
                                        </button>
                                      </div>
                                      <small className="text-muted">Use esta linha digitável para simular o pagamento do boleto.</small>
                                      <div className="mt-3 p-3 bg-info bg-opacity-10 rounded">
                                        <div className="d-flex align-items-center gap-2 mb-2">
                                          <i className="fas fa-info-circle text-info"></i>
                                          <strong>Instruções do Boleto:</strong>
                                        </div>
                                        <ul className="mb-0 small">
                                          <li>Vencimento: {new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}</li>
                                          <li>Valor: R$ {Number(planoNovo.precoMensal ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</li>
                                          <li>Pagável em qualquer banco ou lotérica</li>
                                        </ul>
                                      </div>
                                    </div>
                                  )}
                                </div>
                                <div className="modal-footer">
                                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)} disabled={saving}>
                                    Cancelar
                                  </button>
                                  <button type="button" className="btn btn-primary" onClick={confirmarPagamento} disabled={saving}>
                                    {saving ? (
                                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fas fa-credit-card me-2"></i>
                                    )}
                                    Confirmar Pagamento
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {!podeAlterarPlano && planoSelecionado && planoSelecionado !== (loja?.plano?.id || '') && (
                          <div className="text-danger mt-2">
                            Só é possível fazer upgrade para planos mais caros ou aguardar o vencimento.
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
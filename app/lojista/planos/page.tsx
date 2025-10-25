'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { API_BASE_URL } from '../../../lib/api'
import axios from 'axios'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'

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
}

type Loja = {
  id: string
  nome: string
  plano?: Plano
  assinatura?: Assinatura
}

export default function PlanoLojista() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [loja, setLoja] = useState<Loja | null>(null)
  const [planos, setPlanos] = useState<Plano[]>([])
  const [planoSelecionado, setPlanoSelecionado] = useState<string>('')

  const diasRestantesTrialAtual = useMemo(() => {
    if (!loja?.assinatura) {
      console.log('[DEBUG] Sem assinatura')
      return 0
    }
    
    console.log('[DEBUG] Assinatura:', loja.assinatura)
    console.log('[DEBUG] Plano:', loja.plano)
    
    const ehTrial = !loja.plano || loja.plano.isTrial
    console.log('[DEBUG] É trial?:', ehTrial)
    
    if (!ehTrial && !loja.assinatura.isTrialAtivo) {
      console.log('[DEBUG] Não é trial e trial não ativo')
      return 0
    }
    
    // Se temos trialVencimentoEm, usar isso
    if (loja.assinatura.trialVencimentoEm) {
      const agora = new Date()
      agora.setHours(0, 0, 0, 0)
      
      const vencimento = new Date(loja.assinatura.trialVencimentoEm)
      vencimento.setHours(0, 0, 0, 0)
      
      const diff = vencimento.getTime() - agora.getTime()
      const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))
      
      console.log('[DEBUG] Trial com vencimento:', dias, 'dias')
      return Math.max(dias, 0)
    }
    
    // Fallback: se temos dataInicio, calcular 7 dias a partir dela
    if (loja.assinatura.dataInicio) {
      const inicio = new Date(loja.assinatura.dataInicio)
      const vencimento = new Date(inicio)
      vencimento.setDate(vencimento.getDate() + 7)
      vencimento.setHours(0, 0, 0, 0)
      
      const agora = new Date()
      agora.setHours(0, 0, 0, 0)
      
      const diff = vencimento.getTime() - agora.getTime()
      const dias = Math.ceil(diff / (1000 * 60 * 60 * 24))
      
      console.log('[DEBUG] Trial com fallback de dataInicio:', dias, 'dias')
      return Math.max(dias, 0)
    }
    
    console.log('[DEBUG] Nenhuma data disponível')
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
      console.log('[DEBUG] Resposta da loja:', lojaRes.data)
      console.log('[DEBUG] Assinatura retornada:', lojaRes.data?.assinatura)
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

  const handleAlterarPlano = async () => {
    if (!planoSelecionado) return showToast('Selecione um plano', 'warning')
    setSaving(true)
    try {
      await axios.post(
        `${API_BASE_URL}/api/lojas/me/plano`,
        { planoId: planoSelecionado },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showToast('Plano alterado com sucesso!', 'success')
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
        <div className="row">
          {/* Card do Plano Atual - Em Destaque */}
          <div className="col-12 mb-4">
            <div className="card border-0 shadow-lg bg-gradient-primary">
              <div className="card-body text-white">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    {loja?.plano && !loja.plano.isTrial ? (
                      <>
                        <h3 className="mb-2">
                          <i className="fas fa-star me-2"></i>
                          {loja.plano.nome}
                        </h3>
                        <p className="mb-1 fs-6">
                          R$ {Number(valorMensalAtual).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
                        </p>
                        <small>Seu plano atual</small>
                      </>
                    ) : (
                      <>
                        <h3 className="mb-2">
                          <i className="fas fa-gift me-2"></i>
                          Plano Trial - Teste Gratuito
                        </h3>
                        {loja?.assinatura?.dataInicio && (
                          <>
                            <p className="mb-1 fs-6">
                              De {new Date(loja.assinatura.dataInicio).toLocaleDateString('pt-BR')} até{' '}
                              {loja?.assinatura?.trialVencimentoEm
                                ? new Date(loja.assinatura.trialVencimentoEm).toLocaleDateString('pt-BR')
                                : new Date(new Date(loja.assinatura.dataInicio).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR')}
                            </p>
                            <small>Aproveite esse período para conhecer todas as funcionalidades!</small>
                          </>
                        )}
                      </>
                    )}
                  </div>
                  <div className="col-md-4 text-end">
                    {((!loja?.plano || loja?.plano?.isTrial) && diasRestantesTrialAtual > 0) && loja?.assinatura?.trialVencimentoEm && (
                      <CronometroRegressivo dataVencimento={loja.assinatura.trialVencimentoEm} />
                    )}
                    {((!loja?.plano || loja?.plano?.isTrial) && diasRestantesTrialAtual > 0) && !loja?.assinatura?.trialVencimentoEm && loja?.assinatura?.dataInicio && (
                      <CronometroRegressivo
                        dataVencimento={new Date(new Date(loja.assinatura.dataInicio).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()}
                      />
                    )}
                    {((!loja?.plano || loja?.plano?.isTrial) && diasRestantesTrialAtual <= 0) && (
                      <div className="badge bg-danger p-3">
                        <i className="fas fa-exclamation-circle me-2"></i>
                        Trial expirado
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
              <div className="card-header pb-0 bg-light">
                <h5 className="mb-0">
                  <i className="fas fa-box me-2"></i>
                  Planos Disponíveis
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-4">
                  {planos.map((p) => {
                    const mensalNum = Number(p.precoMensal ?? 0)
                    const anualNum = Number(p.precoAnual ?? 0)
                    const isAtual = loja?.plano?.id === p.id
                    const isSelecionado = planoSelecionado === p.id

                    const mensalExib = mensalNum > 0 ? mensalNum : 0
                    const anualExib = anualNum > 0 ? anualNum : 0

                    return (
                      <div className="col-md-6 col-lg-4" key={p.id}>
                        <div
                          role="button"
                          className={`card h-100 transition-all ${
                            isSelecionado
                              ? 'border-2 border-primary shadow-lg'
                              : isAtual
                              ? 'border-2 border-success shadow'
                              : 'border-1 border-light shadow-sm'
                          } ${isAtual ? 'bg-light' : ''}`}
                          onClick={() => setPlanoSelecionado(p.id)}
                          style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                        >
                          <div className="card-body d-flex flex-column">
                            {/* Badges */}
                            <div className="d-flex gap-2 mb-2 flex-wrap">
                              {isAtual && (
                                <span className="badge bg-success">
                                  <i className="fas fa-check-circle me-1"></i>Ativo
                                </span>
                              )}
                              {isSelecionado && !isAtual && (
                                <span className="badge bg-primary">
                                  <i className="fas fa-hand-point-left me-1"></i>Selecionado
                                </span>
                              )}
                              {mensalExib === 0 && (
                                <span className="badge bg-success">
                                  <i className="fas fa-gift me-1"></i>Gratuito
                                </span>
                              )}
                            </div>

                            {/* Nome e Descrição */}
                            <h6 className="fw-bold mb-1">{p.nome}</h6>
                            {p.descricao && (
                              <p className="text-muted small mb-3 flex-grow-1">{p.descricao}</p>
                            )}

                            {/* Preços */}
                            <div className="mt-auto">
                              {mensalExib > 0 ? (
                                <>
                                  <div className="mb-2">
                                    <div className="fw-bold text-primary fs-5">
                                      R$ {mensalExib.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </div>
                                    <small className="text-muted">/mês</small>
                                  </div>
                                  {anualExib > 0 && (
                                    <div className="small text-secondary">
                                      <i className="fas fa-calendar me-1"></i>
                                      R$ {anualExib.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/ano
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="fw-bold text-success fs-5">
                                  <i className="fas fa-check-circle me-1"></i>Gratuito
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Hover Effect Indicator */}
                          {isSelecionado && (
                            <div className="card-footer bg-primary bg-opacity-10 border-0 text-center">
                              <small className="text-primary fw-bold">Clique no botão abaixo para confirmar</small>
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
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Processando...
                            </>
                          ) : (
                            <>
                              <i className="fas fa-check me-2"></i>
                              Confirmar Plano
                            </>
                          )}
                        </button>
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
'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import { Role } from '../../types/auth'
import Link from 'next/link'
import { useAuth } from '../../stories/authStore'
import { useToast } from '../../stories/toastStore'
import axios from 'axios'
import { API_BASE_URL } from '../../lib/api'
import dynamic from 'next/dynamic'
import { formatCurrency } from '../../lib/formatters'

const SalesPerformanceCharts = dynamic(() => import('../../components/SalesPerformanceCharts'), {
  ssr: false
})

export default function DashboardLojista() {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVendedores: 0,
    totalTiposCotacao: 0,
    totalCotacoes: 0,
    cotacoesAtivas: 0
  })
  const [loja, setLoja] = useState<any>(null)
  const [cotacoes, setCotacoes] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [showAtribuirModal, setShowAtribuirModal] = useState(false)
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null)
  const [atribuindoVendedor, setAtribuindoVendedor] = useState(false)

  const loadStats = useCallback(async () => {
    console.log('=== DEBUG loadStats ===')
    console.log('User:', user)
    console.log('User lojaId:', user?.lojaId)
    console.log('Token exists:', !!token)

    if (!token) {
      console.log('Token não disponível')
      return
    }

    // Tentar obter lojaId
    let lojaId = user?.lojaId
    if (!lojaId) {
      console.log('User.lojaId não disponível, tentando buscar via API...')
      try {
        const lojaResponse = await fetch(`${API_BASE_URL}/api/lojas/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (lojaResponse.ok) {
          const lojaData = await lojaResponse.json()
          lojaId = lojaData?.id
          console.log('Loja encontrada via API:', lojaId)
        }
      } catch (error) {
        console.error('Erro ao buscar loja:', error)
      }
    }

    if (!lojaId) {
      console.log('Não foi possível obter lojaId, pulando carregamento')
      return
    }

            <div className="row mb-4">
              <div className="col-12">
                <div className="card card-profile">
                  <div className="card-body p-3">
                    <div className="row align-items-center g-3 g-lg-4">
                      <div className="col-auto">
                        <div className="avatar avatar-xl position-relative">
                          <img
                            src={lojaLogoUrl}
                            alt={loja?.nome ? `Logo da ${loja.nome}` : 'Avatar da loja'}
                            className="rounded-circle img-fluid border border-2 border-white"
                            style={{ width: '74px', height: '74px', objectFit: 'cover' }}
                          />
                        </div>
                      </div>
                      <div className="col-lg-7 col-md-8">
                        <h5 className="mb-1">
                          {loja?.nome ?? 'Loja não cadastrada'}
                        </h5>
                        <p className="mb-0 text-sm text-muted">
                          {lojaSubtitle}
                        </p>
                      </div>
                      <div className="col-lg-3 col-md-4 text-md-end">
                        <Link href="/lojista/loja" className="btn btn-sm btn-primary">
                          <i className="fas fa-store me-2"></i>
                          Gerenciar Loja
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
    try {
      const authHeaders = { Authorization: `Bearer ${token}` }

      const [vendedoresRes, tiposRes, cotacoesRes, vendasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/lojas/vendedores/loja/${lojaId}`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/lojas/tipo-ofertas`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/lojas/cotacoes-loja`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/lojas/${lojaId}/vendas`, { headers: authHeaders })
      ])

      const vendedores = vendedoresRes.ok ? await vendedoresRes.json() : []
      const tiposCotacao = tiposRes.ok ? await tiposRes.json() : []
      const cotacoes = cotacoesRes.ok ? await cotacoesRes.json() : []
      const vendasData = vendasRes?.ok ? await vendasRes.json() : []

      setVendedores(Array.isArray(vendedores) ? vendedores : [])
      setCotacoes(Array.isArray(cotacoes) ? cotacoes : [])
      setVendas(Array.isArray(vendasData) ? vendasData : [])

      setStats({
        totalVendedores: vendedores.length,
        totalTiposCotacao: tiposCotacao.length,
        totalCotacoes: cotacoes.length,
        cotacoesAtivas: cotacoes.filter((c: any) => c.ativo).length
      })

      // Carregar informações da loja se o usuário tiver lojaId
      if (user?.lojaId) {
        try {
          const lojaRes = await axios.get(`${API_BASE_URL}/api/lojas/${user.lojaId}`, {
            headers: authHeaders
          })
          setLoja(lojaRes.data)
        } catch (error) {
          console.error('Erro ao carregar loja:', error)
        }
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }, [token, user?.lojaId])

  useEffect(() => {
    setLoading(true)
    loadStats().finally(() => setLoading(false))
  }, [loadStats])

  const toNumber = useCallback((valor: unknown) => {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor
    }

    if (typeof valor === 'string') {
      const trimmed = valor.trim()
      if (!trimmed) {
        return 0
      }

      const direct = Number(trimmed)
      if (Number.isFinite(direct)) {
        return direct
      }

      const normalized = Number(trimmed.replace(/\./g, '').replace(',', '.'))
      if (Number.isFinite(normalized)) {
        return normalized
      }
    }

    if (valor != null) {
      const coerced = Number(valor)
      if (Number.isFinite(coerced)) {
        return coerced
      }
    }

    return 0
  }, [])

  const handleAprovarVenda = async (venda: any) => {
    setVendaSelecionada(venda)
    setShowAtribuirModal(true)
  }

  const handleRejeitarVenda = async (vendaId: number) => {
    if (!token) {
      showToast('Token de autenticação não encontrado', 'error')
      return
    }

    if (!confirm('Tem certeza que deseja rejeitar esta venda?')) {
      return
    }

    console.log('Tentando rejeitar venda:', vendaId)

    try {
      const response = await axios.patch(`${API_BASE_URL}/api/vendas/${vendaId}/cancelar`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })

      console.log('Resposta da rejeição:', response)

      // Recarregar os dados do servidor para garantir sincronização
      await loadStats()

      // Mostrar toast de sucesso
      showToast('Venda rejeitada com sucesso!', 'success')
    } catch (error: any) {
      console.error('Erro ao rejeitar venda:', error)
      console.error('Status code:', error?.response?.status)
      console.error('Response data:', error?.response?.data)
      
      const errorMessage = error?.response?.data?.message || 'Erro ao rejeitar venda'
      showToast(errorMessage, 'error')
    }
  }

  const handleAtribuirVendedor = async (vendedorId?: string) => {
    console.log('=== DEBUG handleAtribuirVendedor ===')
    console.log('User:', user)
    console.log('User role:', user?.role)
    console.log('User lojaId:', user?.lojaId)
    console.log('Token exists:', !!token)
    console.log('Token length:', token?.length)
    console.log('Venda selecionada:', vendaSelecionada)

    if (!token || !vendaSelecionada) {
      showToast('Erro interno', 'error')
      return
    }

    setAtribuindoVendedor(true)

    try {
      const payload = vendedorId ? { vendedorId } : {}
      console.log('Payload:', payload)
      console.log('API URL:', `${API_BASE_URL}/vendas/${vendaSelecionada.id}/atribuir-vendedor`)

      const response = await axios.patch(
        `${API_BASE_URL}/api/vendas/${vendaSelecionada.id}/atribuir-vendedor`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      console.log('Vendedor atribuído:', response)

      // Recarregar os dados
      await loadStats()

      // Fechar modal
      setShowAtribuirModal(false)
      setVendaSelecionada(null)

      // Mostrar toast de sucesso
      showToast('Vendedor atribuído com sucesso! Ele tem 1 hora para entrar em contato.', 'success')
    } catch (error: any) {
      console.error('Erro ao atribuir vendedor:', error)
      console.error('Status code:', error?.response?.status)
      console.error('Response data:', error?.response?.data)
      console.error('Response headers:', error?.response?.headers)

      const errorMessage = error?.response?.data?.message || 'Erro ao atribuir vendedor'
      showToast(errorMessage, 'error')
    } finally {
      setAtribuindoVendedor(false)
    }
  }

  const handleFecharModal = () => {
    setShowAtribuirModal(false)
    setVendaSelecionada(null)
  }

  const monthlyTotals = useMemo(() => {
    if (!vendas.length) {
      return { labels: [] as string[], values: [] as number[] }
    }

    const formatter = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
    const totalsByMonth = new Map<string, { label: string; total: number; order: number }>()

    vendas.forEach(venda => {
      const rawDate = venda?.createdAt
      if (!rawDate) {
        return
      }

      const date = new Date(rawDate)
      if (Number.isNaN(date.getTime())) {
        return
      }

      const key = `${date.getFullYear()}-${date.getMonth()}`
      const order = date.getFullYear() * 12 + date.getMonth()
      const label = formatter.format(date).replace('.', '')
      const valorSeguro = toNumber(venda?.valorSeguro)
      const anterior = totalsByMonth.get(key)

      totalsByMonth.set(key, {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        total: (anterior?.total ?? 0) + valorSeguro,
        order
      })
    })

    const ordered = Array.from(totalsByMonth.values())
      .sort((a, b) => a.order - b.order)
      .slice(-6)

    return {
      labels: ordered.map(item => item.label),
      values: ordered.map(item => Number(item.total.toFixed(2)))
    }
  }, [vendas, toNumber])

  const statusDistribution = useMemo(() => {
    if (!vendas.length) {
      return {
        labels: ['Confirmadas', 'Pendentes', 'Canceladas'],
        values: [0, 0, 0]
      }
    }

    let confirmadas = 0
    let pendentes = 0
    let canceladas = 0

    vendas.forEach(venda => {
      const status = (venda?.status || '').toLowerCase()
      if (status === 'confirmada') {
        confirmadas += 1
      } else if (status === 'cancelada') {
        canceladas += 1
      } else {
        pendentes += 1
      }
    })

    return {
      labels: ['Confirmadas', 'Pendentes', 'Canceladas'],
      values: [confirmadas, pendentes, canceladas]
    }
  }, [vendas])

  const commissionTrend = useMemo(() => {
    if (!vendas.length) {
      return { labels: [] as string[], sales: [] as number[], commissions: [] as number[] }
    }

    const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    const recentes = [...vendas]
      .filter(venda => venda?.createdAt)
      .slice(0, 8)
      .reverse()

    return {
      labels: recentes.map(venda => {
        const date = new Date(venda.createdAt)
        if (Number.isNaN(date.getTime())) {
          return ''
        }
        return formatter.format(date).replace('.', '')
      }),
      sales: recentes.map(venda => toNumber(venda?.valorSeguro)),
      commissions: recentes.map(venda => toNumber(venda?.valorComissao))
    }
  }, [vendas, toNumber])

  const formatMoneyValue = useCallback((valor: number) => formatCurrency(valor), [])

  const monthlyBadgeLabel = monthlyTotals.labels.length
    ? `${monthlyTotals.labels.length} meses`
    : 'Sem histórico'

  const trendBadgeLabel = commissionTrend.labels.length
    ? `Últimas ${commissionTrend.labels.length} cotações`
    : 'Sem histórico'

  const lojaLogoUrl = useMemo(() => {
    if (loja?.logo) {
      return `${API_BASE_URL}/uploads/lojas/logomarcas/${loja.logo}`
    }
    return '/assets/img/team-4.jpg'
  }, [loja?.logo])

  const lojaSubtitle = useMemo(() => {
    if (loja?.cidade && loja?.estado) {
      return `${loja.cidade} - ${loja.estado}`
    }

    if (loja?.endereco) {
      return loja.endereco
    }

    return 'Atualize os dados da sua loja para personalizar o dashboard.'
  }, [loja?.cidade, loja?.estado, loja?.endereco])

  return (
    <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
      <DashboardLayout title={`Dashboard Lojista${loja ? ` - ${loja.nome}` : ''}`}>
        {loading && (
          <div className="alert alert-info d-flex align-items-center mb-4">
            <div className="spinner-border spinner-border-sm me-3" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
            <span>Carregando dashboard e gráficos...</span>
          </div>
        )}
        <div className="row">
          <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Vendedores</p>
                      <h5 className="font-weight-bolder mb-0">
                        {stats.totalVendedores}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-info shadow text-center border-radius-md">
                      <i className="ni ni-single-02 text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Tipos de Cotação</p>
                      <h5 className="font-weight-bolder mb-0">
                        {stats.totalTiposCotacao}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                      <i className="fas fa-calculator text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Cotações Ativas</p>
                      <h5 className="font-weight-bolder mb-0">
                        {stats.cotacoesAtivas}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-success shadow text-center border-radius-md">
                      <i className="fas fa-check-circle text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Total Cotações</p>
                      <h5 className="font-weight-bolder mb-0">
                        {stats.totalCotacoes}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-warning shadow text-center border-radius-md">
                      <i className="fas fa-list text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Vendas Pendentes */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0">
                <div className="d-flex justify-content-between align-items-center">
                  <h6>Vendas Pendentes</h6>
                  <Link href="/lojista/vendas" className="btn btn-sm btn-outline-primary">
                    Ver Todas
                  </Link>
                </div>
              </div>
              <div className="card-body">
                {vendas.filter(v => v.status === 'pendente').length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-check-circle text-success fa-3x mb-3"></i>
                    <h6 className="text-muted">Nenhuma venda pendente</h6>
                    <p className="text-sm text-muted">Todas as vendas foram processadas</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Veículo</th>
                          <th>Valor</th>
                          <th>Vendedor</th>
                          <th>Data</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendas
                          .filter(v => v.status === 'pendente')
                          .slice(0, 5)
                          .map((venda: any) => (
                            <tr key={venda.id}>
                              <td>
                                <div className="d-flex align-items-center">
                                  <div className="avatar avatar-sm bg-gradient-primary rounded-circle me-2">
                                    <i className="fas fa-user text-white text-xs"></i>
                                  </div>
                                  <div>
                                    <span className="text-sm font-weight-bold">
                                      {venda.cliente?.name || 'Cliente'}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className="text-sm">
                                  {venda.tipoVeiculo} {venda.marca} {venda.modelo}
                                </span>
                              </td>
                              <td>
                                <span className="text-sm font-weight-bold">
                                  {formatCurrency(venda.valorSeguro)}
                                </span>
                              </td>
                              <td>
                                <span className="text-sm">
                                  {venda.vendedor?.name || 'Não atribuído'}
                                </span>
                              </td>
                              <td>
                                <span className="text-sm">
                                  {new Date(venda.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button 
                                    className="btn btn-outline-success btn-sm"
                                    title="Aprovar venda"
                                    onClick={() => handleAprovarVenda(venda)}
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                  <button 
                                    className="btn btn-outline-danger btn-sm"
                                    title="Rejeitar venda"
                                    onClick={() => handleRejeitarVenda(venda.id)}
                                  >
                                    <i className="fas fa-times"></i>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <SalesPerformanceCharts
          monthlyTotals={monthlyTotals}
          statusDistribution={statusDistribution}
          commissionTrend={commissionTrend}
          formatMoney={formatMoneyValue}
          contextLabel="Volume mensal das cotações cadastradas"
          monthlyBadgeLabel={monthlyBadgeLabel}
          statusSubtitle="Proporção entre cotações ativas e inativas"
          trendBadgeLabel={trendBadgeLabel}
        />

        {loading && (
          <div className="row mt-4">
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div style={{ height: '300px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite' }}></div>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <div style={{ height: '300px', background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'loading 1.5s infinite' }}></div>
                </div>
              </div>
            </div>
            <style>{`
              @keyframes loading {
                0% { background-position: 200% 0; }
                100% { background-position: -200% 0; }
              }
            `}</style>
          </div>
        )}

        <div className="row mt-4">
          <div className="col-lg-6">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Ações Rápidas</h6>
              </div>
              <div className="card-body">
                <div className="d-grid gap-2">
                  <Link href="/lojista/vendedores" className="btn btn-info">
                    <i className="fas fa-user-plus me-2"></i>
                    Gerenciar Vendedores
                  </Link>
                  <Link href="/lojista/tipos-cotacao" className="btn btn-primary">
                    <i className="fas fa-calculator me-2"></i>
                    Criar Tipos de Cotação
                  </Link>
                  <Link href="/lojista/planos" className="btn btn-success">
                    <i className="fas fa-box me-2"></i>
                    Ver Planos
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Resumo da Loja</h6>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-6">
                    <div className="text-center">
                      <h4 className="text-primary">{stats.totalVendedores}</h4>
                      <small className="text-muted">Vendedores Ativos</small>
                    </div>
                  </div>
                  <div className="col-6">
                    <div className="text-center">
                      <h4 className="text-success">{stats.cotacoesAtivas}</h4>
                      <small className="text-muted">Cotações Ativas</small>
                    </div>
                  </div>
                </div>
                <hr />
                <div className="text-center">
                  <small className="text-muted">
                    Última atualização: {new Date().toLocaleString('pt-BR')}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal de Atribuição de Vendedor */}
        {showAtribuirModal && vendaSelecionada && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Atribuir Vendedor</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleFecharModal}
                    disabled={atribuindoVendedor}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <h6>Detalhes da Venda</h6>
                    <p className="mb-1"><strong>Cliente:</strong> {vendaSelecionada.cliente?.name}</p>
                    <p className="mb-1"><strong>Veículo:</strong> {vendaSelecionada.tipoVeiculo} {vendaSelecionada.marca} {vendaSelecionada.modelo}</p>
                    <p className="mb-1"><strong>Valor:</strong> {formatCurrency(vendaSelecionada.valorSeguro)}</p>
                  </div>

                  <div className="mb-3">
                    <h6>Escolher Vendedor</h6>
                    <p className="text-muted small">Selecione um vendedor específico ou deixe o sistema escolher automaticamente o mais disponível.</p>
                  </div>

                  <div className="d-grid gap-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleAtribuirVendedor()}
                      disabled={atribuindoVendedor}
                    >
                      {atribuindoVendedor ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Atribuindo automaticamente...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-magic me-2"></i>
                          Atribuição Automática
                        </>
                      )}
                    </button>

                    <div className="mb-3">
                      <label htmlFor="vendedorSelect" className="form-label">Atribuir Manualmente</label>
                      <select
                        className="form-control"
                        id="vendedorSelect"
                        onChange={(e) => {
                          const vendedorId = e.target.value;
                          if (vendedorId) {
                            handleAtribuirVendedor(vendedorId);
                          }
                        }}
                        disabled={atribuindoVendedor}
                        defaultValue=""
                      >
                        <option value="">Selecione um vendedor</option>
                        {vendedores
                          .filter(v => v.ativo)
                          .map((vendedor: any) => (
                            <option key={vendedor.id} value={vendedor.id}>
                              {vendedor.nome}
                            </option>
                          ))
                        }
                      </select>
                    </div>
                  </div>

                  <div className="alert alert-info mt-3">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Importante:</strong> O vendedor terá 1 hora para entrar em contato com o cliente. 
                    Caso não entre em contato dentro do prazo, a venda será reatribuída automaticamente.
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleFecharModal}
                    disabled={atribuindoVendedor}
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  )
}
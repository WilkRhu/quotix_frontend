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
    cotacoesAtivas: 0,
    vendasMes: 0
  })
  const [loja, setLoja] = useState<any>(null)
  const [cotacoes, setCotacoes] = useState<any[]>([])
  const [vendas, setVendas] = useState<any[]>([])
  const [vendedores, setVendedores] = useState<any[]>([])
  const [showAtribuirModal, setShowAtribuirModal] = useState(false)
  const [showDetalhesModal, setShowDetalhesModal] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [justificativaRejeicao, setJustificativaRejeicao] = useState('')
  const [imagemSelecionada, setImagemSelecionada] = useState('')
  const [indiceImagem, setIndiceImagem] = useState(0)
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null)
  const [atribuindoVendedor, setAtribuindoVendedor] = useState(false)

  const loadStats = useCallback(async () => {
    if (!token) {
      return
    }

    let lojaId = user?.lojaId
    if (!lojaId) {
      try {
        const lojaResponse = await fetch(`${API_BASE_URL}/api/lojas/me`, { headers: { Authorization: `Bearer ${token}` } })
        if (lojaResponse.ok) {
          const lojaData = await lojaResponse.json()
          lojaId = lojaData?.id
        }
      } catch (error) {
        console.error('Erro ao buscar loja:', error)
      }
    }

    if (!lojaId) {
      return
    }

    try {
      const authHeaders = { Authorization: `Bearer ${token}` }

      const [vendedoresRes, tiposRes, cotacoesRes, vendasRes, vendasAvulsasRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/lojas/vendedores/loja/${lojaId}`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/lojas/${lojaId}/tipos-cotacao`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/lojas/${lojaId}/tipos-cotacao`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/lojas/${lojaId}/vendas`, { headers: authHeaders }),
        fetch(`${API_BASE_URL}/api/lojas/me/vendas/avulsas`, { headers: authHeaders })
      ])

      const vendedores = vendedoresRes.ok ? await vendedoresRes.json() : []
      const tiposCotacao = tiposRes.ok ? await tiposRes.json() : []
      const cotacoes = cotacoesRes.ok ? await cotacoesRes.json() : []
      const vendasData = vendasRes?.ok ? await vendasRes.json() : []
      const vendasAvulsas = vendasAvulsasRes?.ok ? await vendasAvulsasRes.json() : []

      setVendedores(Array.isArray(vendedores) ? vendedores : [])
      setCotacoes(Array.isArray(cotacoes) ? cotacoes : [])

      // Combinar vendas regulares e avulsas
      const todasVendas = [
        ...(Array.isArray(vendasData) ? vendasData.map(v => ({ ...v, isAvulso: false })) : []),
        ...(Array.isArray(vendasAvulsas) ? vendasAvulsas.map(v => ({ ...v, isAvulso: true })) : [])
      ]
      setVendas(todasVendas)

      // Calcular vendas do mês atual
      const agora = new Date()
      const inicioMes = new Date(agora.getFullYear(), agora.getMonth(), 1)
      const vendasDoMes = todasVendas.filter(venda => {
        const dataVenda = new Date(venda.createdAt)
        return (
          dataVenda >= inicioMes &&
          (venda.status === 'confirmada' || venda.status === 'paga')
        )
      })
      const valorVendasMes = vendasDoMes.reduce((total, venda) => total + toNumber(venda.valorSeguro), 0)

      setStats({
        totalVendedores: vendedores.length,
        totalTiposCotacao: tiposCotacao.length,
        totalCotacoes: cotacoes.length,
        cotacoesAtivas: cotacoes.filter((c: any) => c.ativo).length,
        vendasMes: valorVendasMes
      })

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

    // Se for venda avulsa, aprovar diretamente sem atribuir vendedor
    if (venda.isAvulso) {
      await aprovarVendaDiretamente(venda)
    } else {
      setShowAtribuirModal(true)
    }
  }

  const aprovarVendaDiretamente = async (venda: any) => {
    if (!token) {
      showToast('Token de autenticação não encontrado', 'error')
      return
    }

    try {
      if (venda.isAvulso) {
        await axios.patch(`${API_BASE_URL}/api/vendas-avulso/${venda.id}/status`,
          { status: 'confirmada' },
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        await axios.patch(`${API_BASE_URL}/api/vendas/${venda.id}/aprovar`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }

      await loadStats()
      showToast('Venda aprovada com sucesso!', 'success')
    } catch (error: any) {
      console.error('Erro ao aprovar venda:', error)
      const errorMessage = error?.response?.data?.message || 'Erro ao aprovar venda'
      showToast(errorMessage, 'error')
    }
  }

  const handleVerDetalhes = (venda: any) => {
    setVendaSelecionada(venda)
    setShowDetalhesModal(true)
  }

  const handleRejeitarVenda = async (venda: any) => {
    setVendaSelecionada(venda)
    setShowConfirmModal(true)
  }

  const confirmarRejeicao = async () => {
    if (!token || !vendaSelecionada) {
      showToast('Token de autenticação não encontrado', 'error')
      return
    }
    if (!justificativaRejeicao.trim()) {
      showToast('Informe a justificativa da rejeição', 'error')
      return
    }
    try {
      await axios.patch(`${API_BASE_URL}/api/vendas/${vendaSelecionada.id}/cancelar`, { justificativaRejeicao }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setShowConfirmModal(false)
      setJustificativaRejeicao('')
      await loadStats()
      showToast('Venda rejeitada com sucesso!', 'success')
    } catch (error: any) {
      console.error('Erro ao rejeitar venda:', error)
      const errorMessage = error?.response?.data?.message || 'Erro ao rejeitar venda'
      showToast(errorMessage, 'error')
    }
  }

  const handleAtribuirVendedor = async (vendedorId?: string) => {
    if (!token || !vendaSelecionada) {
      showToast('Erro interno', 'error')
      return
    }

    setAtribuindoVendedor(true)

    try {
      const payload = vendedorId ? { vendedorId } : {}

      await axios.patch(
        `${API_BASE_URL}/api/vendas/${vendaSelecionada.id}/atribuir-vendedor`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      await loadStats()
      setShowAtribuirModal(false)
      setVendaSelecionada(null)
      showToast('Vendedor atribuído com sucesso! Ele tem 1 hora para entrar em contato.', 'success')
    } catch (error: any) {
      console.error('Erro ao atribuir vendedor:', error)
      const errorMessage = error?.response?.data?.message || 'Erro ao atribuir vendedor'
      showToast(errorMessage, 'error')
    } finally {
      setAtribuindoVendedor(false)
    }
  }

  const handleFecharModal = () => {
    setShowAtribuirModal(false)
    setShowDetalhesModal(false)
    setShowImageModal(false)
    setShowConfirmModal(false)
    setVendaSelecionada(null)
    setImagemSelecionada('')
  }

  const handleAbrirImagem = (imagem: string | { urlImagem: string }, index: number = 0) => {
    setImagemSelecionada(typeof imagem === 'string' ? imagem : imagem.urlImagem)
    setIndiceImagem(index)
    setShowImageModal(true)
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
      .filter(venda => venda?.createdAt && (venda.status === 'confirmada' || venda.status === 'paga'))
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
                      <i className="fas fa-users text-lg opacity-10"></i>
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
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Vendas do Mês</p>
                      <h5 className="font-weight-bolder mb-0">
                        {formatCurrency(stats.vendasMes)}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-warning shadow text-center border-radius-md">
                      <i className="fas fa-money-bill-wave text-lg opacity-10"></i>
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
                          <th>Contrato</th>
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
                                    {venda.cliente?.foto ? (
                                      <img
                                        src={venda.cliente.foto}
                                        alt={venda.cliente.name}
                                        className="avatar-img"
                                      />
                                    ) : (
                                      <i className="fas fa-user text-white text-xs"></i>
                                    )}
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
                                <div>
                                  <span className="text-sm">
                                    {venda.vendedor?.nome || venda.vendedor?.name || 'Não atribuído'}
                                  </span>
                                  {venda.isAvulso && (
                                    <>
                                      <br />
                                      <small className="text-info">
                                        <i className="fas fa-user-friends me-1"></i>
                                        Avulso
                                      </small>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td>
                                {venda.contratoAssinado ? (
                                  <span className="badge bg-success">
                                    <i className="fas fa-check me-1"></i>
                                    Assinado
                                  </span>
                                ) : (
                                  <span className="badge bg-warning">
                                    <i className="fas fa-clock me-1"></i>
                                    Pendente
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="text-sm">
                                  {new Date(venda.createdAt).toLocaleDateString('pt-BR')}
                                </span>
                              </td>
                              <td>
                                <div className="btn-group btn-group-sm">
                                  <button
                                    className="btn btn-outline-info btn-sm"
                                    title="Ver detalhes"
                                    onClick={() => handleVerDetalhes(venda)}
                                  >
                                    <i className="fas fa-eye"></i>
                                  </button>
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
                                    onClick={() => handleRejeitarVenda(venda)}
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

        {/* Modal de Detalhes da Venda */}
        {showDetalhesModal && vendaSelecionada && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="fas fa-car me-2"></i>
                    Detalhes da Venda
                    {vendaSelecionada.isAvulso && (
                      <span className="badge bg-info ms-2">Avulso</span>
                    )}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleFecharModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    <div className="col-md-6">
                      <h6 className="text-primary">Informações do Cliente</h6>
                      <p className="mb-1"><strong>Nome:</strong> {vendaSelecionada.cliente?.name || 'N/A'}</p>
                      <p className="mb-1"><strong>Email:</strong> {vendaSelecionada.clienteEmail || vendaSelecionada.cliente?.email || 'N/A'}</p>
                      <p className="mb-3"><strong>Telefone:</strong> {vendaSelecionada.clienteTelefone || 'N/A'}</p>

                      <h6 className="text-primary">Informações do Veículo</h6>
                      <p className="mb-1"><strong>Tipo:</strong> {vendaSelecionada.tipoVeiculo}</p>
                      <p className="mb-1"><strong>Marca:</strong> {vendaSelecionada.marca}</p>
                      <p className="mb-1"><strong>Modelo:</strong> {vendaSelecionada.modelo}</p>
                      <p className="mb-1"><strong>Ano:</strong> {vendaSelecionada.ano}</p>
                      <p className="mb-3"><strong>Placa:</strong> {vendaSelecionada.placa || 'Não informada'}</p>
                    </div>

                    <div className="col-md-6">
                      <h6 className="text-primary">Valores</h6>
                      <p className="mb-1"><strong>Valor do Seguro:</strong> {formatCurrency(vendaSelecionada.valorSeguro)}</p>
                      {vendaSelecionada.valorVeiculo && (
                        <p className="mb-1"><strong>Valor do Veículo:</strong> {formatCurrency(vendaSelecionada.valorVeiculo)}</p>
                      )}
                      {vendaSelecionada.valorComissao && (
                        <p className="mb-1"><strong>Comissão:</strong> {formatCurrency(vendaSelecionada.valorComissao)}</p>
                      )}
                      {vendaSelecionada.percentualComissao && (
                        <p className="mb-3"><strong>% Comissão:</strong> {vendaSelecionada.percentualComissao}%</p>
                      )}

                      <h6 className="text-primary">Vendedor</h6>
                      <p className="mb-1"><strong>Nome:</strong> {vendaSelecionada.vendedor?.nome || vendaSelecionada.vendedor?.name || 'Não atribuído'}</p>
                      {vendaSelecionada.isAvulso && (
                        <p className="mb-1"><strong>Tipo:</strong> <span className="text-info">Vendedor Avulso</span></p>
                      )}

                      <h6 className="text-primary mt-3">Outras Informações</h6>
                      <p className="mb-1"><strong>Status:</strong>
                        <span className={`badge ms-2 ${vendaSelecionada.status === 'confirmada' ? 'bg-success' :
                            vendaSelecionada.status === 'pendente' ? 'bg-warning' :
                              'bg-danger'
                          }`}>
                          {vendaSelecionada.status}
                        </span>
                      </p>
                      <p className="mb-1"><strong>Data:</strong> {new Date(vendaSelecionada.createdAt).toLocaleString('pt-BR')}</p>
                      {vendaSelecionada.observacoes && (
                        <p className="mb-1"><strong>Observações:</strong> {vendaSelecionada.observacoes}</p>
                      )}
                    </div>
                  </div>

                  {/* Imagens do Veículo */}
                  {vendaSelecionada.imagens && vendaSelecionada.imagens.length > 0 && (
                    <div className="mt-4">
                      <h6 className="text-primary">Imagens do Veículo</h6>
                      <div className="row">
                        {vendaSelecionada.imagens.map((imagem: any, index: number) => (
                          <div key={index} className="col-md-4 col-sm-6 mb-3">
                            <div className="card">
                              <img
                                src={imagem.urlImagem || imagem}
                                className="card-img-top"
                                alt={`Imagem ${index + 1} do veículo`}
                                style={{ height: '200px', objectFit: 'cover', cursor: 'pointer' }}
                                onClick={() => handleAbrirImagem(imagem.urlImagem || imagem)}
                              />
                              <div className="card-body p-2">
                                <small className="text-muted">Imagem {index + 1}</small>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(!vendaSelecionada.imagensVeiculo || vendaSelecionada.imagensVeiculo.length === 0) && (
                    <div className="mt-4">
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        Nenhuma imagem do veículo foi enviada pelo vendedor.
                      </div>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleFecharModal}
                  >
                    Fechar
                  </button>
                  {vendaSelecionada.status === 'pendente' && (
                    <>
                      <button
                        type="button"
                        className="btn btn-success"
                        onClick={() => {
                          setShowDetalhesModal(false)
                          handleAprovarVenda(vendaSelecionada)
                        }}
                      >
                        <i className="fas fa-check me-2"></i>
                        Aprovar Venda
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger"
                        onClick={() => {
                          setShowDetalhesModal(false)
                          handleRejeitarVenda(vendaSelecionada)
                        }}
                      >
                        <i className="fas fa-times me-2"></i>
                        Rejeitar Venda
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* Modal de Confirmação */}
        {showConfirmModal && vendaSelecionada && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title text-warning">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Confirmar Rejeição
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleFecharModal}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="alert alert-warning">
                    <i className="fas fa-info-circle me-2"></i>
                    <strong>Atenção!</strong> Esta ação não pode ser desfeita.
                  </div>
                  <p>Tem certeza que deseja rejeitar esta venda?</p>
                  <div className="bg-light p-3 rounded mb-3">
                    <p className="mb-1"><strong>Cliente:</strong> {vendaSelecionada.cliente?.name || 'N/A'}</p>
                    <p className="mb-1"><strong>Veículo:</strong> {vendaSelecionada.tipoVeiculo} {vendaSelecionada.marca} {vendaSelecionada.modelo}</p>
                    <p className="mb-0"><strong>Valor:</strong> {formatCurrency(vendaSelecionada.valorSeguro)}</p>
                  </div>
                  <div className="mb-3">
                    <label htmlFor="justificativaRejeicao" className="form-label"><strong>Justificativa da rejeição</strong></label>
                    <textarea
                      id="justificativaRejeicao"
                      className="form-control"
                      value={justificativaRejeicao}
                      onChange={e => setJustificativaRejeicao(e.target.value)}
                      rows={3}
                      placeholder="Descreva o motivo da rejeição..."
                      required
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleFecharModal}
                  >
                    <i className="fas fa-arrow-left me-2"></i>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={confirmarRejeicao}
                  >
                    <i className="fas fa-times me-2"></i>
                    Sim, Rejeitar Venda
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal Lightbox para Imagens */}
        {showImageModal && vendaSelecionada && vendaSelecionada.imagens && vendaSelecionada.imagens.length > 0 && (
          <div
            className="modal fade show d-block"
            style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1060 }}
            tabIndex={-1}
            onClick={handleFecharModal}
          >
            <div className="modal-dialog modal-xl modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content bg-transparent border-0">
                <div className="modal-header border-0 pb-0 d-flex justify-content-end align-items-center">
                  <button
                    type="button"
                    className="btn-close btn-close-white"
                    onClick={handleFecharModal}
                    style={{ filter: 'invert(1)' }}
                  ></button>
                </div>
                <div className="modal-body text-center p-0 position-relative" style={{ minHeight: '80vh' }}>
                  {vendaSelecionada.imagens.length > 1 && (
                    <button
                      type="button"
                      className="btn position-absolute top-50 start-0 translate-middle-y"
                      style={{ zIndex: 2, left: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
                      onClick={() => setIndiceImagem((prev) => prev > 0 ? prev - 1 : vendaSelecionada.imagens.length - 1)}
                      disabled={vendaSelecionada.imagens.length <= 1}
                    >
                      <i className="fas fa-chevron-left" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                    </button>
                  )}
                  <img
                    src={vendaSelecionada.imagens[indiceImagem].urlImagem || vendaSelecionada.imagens[indiceImagem]}
                    className="img-fluid rounded"
                    alt={`Imagem ${indiceImagem + 1} do veículo`}
                    style={{
                      maxHeight: '80vh',
                      maxWidth: '100%',
                      objectFit: 'contain',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                    }}
                  />
                  {vendaSelecionada.imagens.length > 1 && (
                    <button
                      type="button"
                      className="btn position-absolute top-50 end-0 translate-middle-y"
                      style={{ zIndex: 2, right: '10px', background: 'rgba(0,0,0,0.3)', borderRadius: '50%', width: '48px', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
                      onClick={() => setIndiceImagem((prev) => prev < vendaSelecionada.imagens.length - 1 ? prev + 1 : 0)}
                      disabled={vendaSelecionada.imagens.length <= 1}
                    >
                      <i className="fas fa-chevron-right" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                    </button>
                  )}
                </div>
                <div className="modal-footer border-0 justify-content-center pt-2">
                  <small className="text-white-50">
                    <i className="fas fa-info-circle me-1"></i>
                    {`Imagem ${indiceImagem + 1} de ${vendaSelecionada.imagens.length}`} — Clique fora da imagem ou no X para fechar
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}

      </DashboardLayout>
    </ProtectedRoute>
  )
}
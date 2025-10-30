'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import dynamic from 'next/dynamic'
import axios from 'axios'
import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import { Role } from '../../types/auth'
import { useAuth } from '../../stories/authStore'
import { API_BASE_URL, UPLOAD_URL } from '../../lib/api'
import { formatCurrency } from '../../lib/formatters'

const SalesPerformanceCharts = dynamic(() => import('../../components/SalesPerformanceCharts'), {
  ssr: false
})

export default function PerfilVendedor() {
  const { token, user } = useAuth()
  const [vendedor, setVendedor] = useState<any>(null)
  const [vendas, setVendas] = useState<any[]>([])
  const [lojasAutorizadas, setLojasAutorizadas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [estatisticas, setEstatisticas] = useState({
    totalVendas: 0,
    vendasConfirmadas: 0,
    totalValorVendido: 0,
    totalComissao: 0
  })

  const toNumber = useCallback((valor: unknown) => {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor
    }

    if (typeof valor === 'string') {
      const trimmed = valor.trim()
      const direct = Number(trimmed)

      if (Number.isFinite(direct)) {
        return direct
      }

      const normalized = Number(trimmed.replace(/\./g, '').replace(',', '.'))

      if (Number.isFinite(normalized)) {
        return normalized
      }
    }

    if (valor !== undefined && valor !== null) {
      const coerced = Number(valor)

      if (Number.isFinite(coerced)) {
        return coerced
      }
    }

    return 0
  }, [])

  const formatMoney = useCallback((valor: unknown) => formatCurrency(toNumber(valor)), [toNumber])

  const obterValorVenda = useCallback((venda: any) => {
    const valorVendaProp = toNumber(venda?.valorVenda)
    if (valorVendaProp > 0) {
      return valorVendaProp
    }

    const valorSeguro = toNumber(venda?.valorSeguro)
    const valorVeiculo = toNumber(venda?.valorVeiculo)
    const valorTaxa = toNumber(venda?.valorTaxa)
    const valorComissao = toNumber(venda?.valorComissao)
    const percentualComissao = toNumber(venda?.percentualComissao)
    const tipo = venda?.tipoCotacaoLoja

    if (valorSeguro > 0 && valorVeiculo > 0 && valorSeguro < valorVeiculo) {
      return valorSeguro
    }

    if (valorVeiculo > 0 && valorSeguro >= valorVeiculo && valorComissao > 0 && valorComissao < valorVeiculo) {
      return valorTaxa > 0 ? valorComissao + valorTaxa : valorComissao
    }

    if (!valorVeiculo && valorSeguro >= 10000 && valorComissao > 0 && valorComissao < valorSeguro) {
      return valorTaxa > 0 ? valorComissao + valorTaxa : valorComissao
    }

    if (valorSeguro > 0) {
      return valorTaxa > 0 && valorSeguro < valorTaxa ? valorSeguro + valorTaxa : valorSeguro
    }

    if (valorComissao > 0 && percentualComissao > 0) {
      return valorComissao / (percentualComissao / 100)
    }

    if (valorComissao > 0 && tipo?.comissaoVendasTipo === 'percentual') {
      const percentualTipo = toNumber(tipo.comissaoVendasPercentual)
      if (percentualTipo > 0) {
        return valorComissao / (percentualTipo / 100)
      }
    }

    return valorComissao || 0
  }, [toNumber])

  const formatPercentLabel = (valor: number) => {
    if (!Number.isFinite(valor)) {
      return ''
    }

    return `${valor.toFixed(2).replace('.', ',')}%`
  }

  type CommissionInfo = {
    valor: number
    descricao: string
    percentLabel?: string
  }

  const getCommissionInfo = useCallback((venda: any): CommissionInfo => {
    const valorBaseVenda = obterValorVenda(venda)
    const tipo = venda?.tipoCotacaoLoja

    if (tipo?.comissaoVendasTipo === 'valor') {
      const valorFixo = toNumber(tipo.comissaoVendasValor)

      if (valorFixo > 0) {
        return {
          valor: valorFixo,
          descricao: tipo?.nome
            ? `Comissão fixa definida pelo tipo ${tipo.nome}`
            : 'Comissão fixa definida pelo tipo de cotação'
        }
      }
    }

    if (tipo?.comissaoVendasTipo === 'percentual') {
      const percentualTipo = toNumber(tipo.comissaoVendasPercentual)

      if (percentualTipo > 0) {
        const valor = valorBaseVenda * (percentualTipo / 100)
        const percentLabel = formatPercentLabel(percentualTipo)

        return {
          valor,
          descricao: tipo?.nome ? `Regra do tipo ${tipo.nome}` : 'Comissão percentual da venda',
          percentLabel
        }
      }
    }

    const percentualComissao = toNumber(venda?.percentualComissao)
    if (percentualComissao > 0) {
      const valor = valorBaseVenda * (percentualComissao / 100)
      const percentLabel = formatPercentLabel(percentualComissao)

      return {
        valor,
        descricao: 'Comissão percentual da venda',
        percentLabel
      }
    }

    const valorComissaoRegistrado = toNumber(venda?.valorComissao)
    if (valorComissaoRegistrado > 0) {
      const percentual = toNumber(venda?.percentualComissao)
      if (percentual > 0) {
        const esperado = valorBaseVenda * (percentual / 100)
        if (Math.abs(esperado - valorComissaoRegistrado) <= Math.max(1, esperado * 0.02)) {
          return {
            valor: valorComissaoRegistrado,
            descricao: 'Valor de comissão registrado'
          }
        }
      } else {
        return {
          valor: valorComissaoRegistrado,
          descricao: 'Valor de comissão registrado'
        }
      }
    }

    return {
      valor: 0,
      descricao: ''
    }
  }, [obterValorVenda, toNumber])

  const carregarPerfil = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedor/perfil`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendedor(response.data)
    } catch (error) {
      console.error('Erro ao carregar perfil:', error)
    }
  }

  const carregarVendas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedor/vendas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const lista = Array.isArray(response.data) ? [...response.data] : []
      const ordenadas = lista.sort((a, b) => {
        const dataA = new Date(a?.createdAt ?? 0).getTime()
        const dataB = new Date(b?.createdAt ?? 0).getTime()
        return dataB - dataA
      })
      setVendas(ordenadas)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    }
  }

  const carregarEstatisticas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedor/estatisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = response.data ?? {}

      setEstatisticas({
        totalVendas: toNumber(data.totalVendas),
        vendasConfirmadas: toNumber(data.vendasConfirmadas),
        totalValorVendido: toNumber(data.totalValorVendido),
        totalComissao: toNumber(data.totalComissao)
      })

      if (!vendas.length && Array.isArray(data.vendas) && data.vendas.length) {
        const ordenadas = [...data.vendas].sort((a, b) => {
          const dataA = new Date(a?.createdAt ?? 0).getTime()
          const dataB = new Date(b?.createdAt ?? 0).getTime()
          return dataB - dataA
        })
        setVendas(ordenadas)
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  const carregarLojasAutorizadas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedor/lojas-autorizadas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLojasAutorizadas(response.data || [])
    } catch (error) {
      console.error('Erro ao carregar lojas autorizadas:', error)
    }
  }

  const totaisVendas = useMemo(() => {
    const vendasConfirmadas = vendas.filter(venda => venda.status === 'confirmada')
    return vendasConfirmadas.reduce(
      (acc, venda) => {
        const valorVenda = obterValorVenda(venda)
        const infoComissao = getCommissionInfo(venda)

        return {
          valorTotal: acc.valorTotal + valorVenda,
          comissaoTotal: acc.comissaoTotal + toNumber(infoComissao.valor),
        }
      },
      { valorTotal: 0, comissaoTotal: 0 }
    )
  }, [vendas, obterValorVenda, getCommissionInfo, toNumber])

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
      const previous = totalsByMonth.get(key)
      const valorVenda = obterValorVenda(venda)

      totalsByMonth.set(key, {
        label: label.charAt(0).toUpperCase() + label.slice(1),
        total: (previous?.total ?? 0) + valorVenda,
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
  }, [vendas, obterValorVenda])

  const statusDistribution = useMemo(() => {
    const labels = ['Confirmadas', 'Pendentes', 'Canceladas/Outras']
    if (!vendas.length) {
      return { labels, values: [0, 0, 0] }
    }

    const counts = {
      confirmada: 0,
      pendente: 0,
      cancelada: 0,
      outros: 0
    }

    vendas.forEach(venda => {
      const status = (venda?.status ?? '').toString().toLowerCase()
      if (!status) {
        counts.outros += 1
        return
      }

      if (status.includes('confirm')) {
        counts.confirmada += 1
        return
      }

      if (status.includes('pend')) {
        counts.pendente += 1
        return
      }

      if (status.includes('cancel')) {
        counts.cancelada += 1
        return
      }

      counts.outros += 1
    })

    return {
      labels,
      values: [counts.confirmada, counts.pendente, counts.cancelada + counts.outros]
    }
  }, [vendas])

  const commissionTrend = useMemo(() => {
    if (!vendas.length) {
      return { labels: [] as string[], sales: [] as number[], commissions: [] as number[] }
    }

    const formatter = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' })
    const recentes = [...vendas].slice(0, 8).reverse()

    return {
      labels: recentes.map(venda => {
        const date = new Date(venda?.createdAt ?? 0)
        if (Number.isNaN(date.getTime())) {
          return ''
        }

        return formatter.format(date).replace('.', '')
      }),
      sales: recentes.map(venda => obterValorVenda(venda)),
      commissions: recentes.map(venda => toNumber(getCommissionInfo(venda).valor))
    }
  }, [vendas, obterValorVenda, getCommissionInfo, toNumber])

  const formatMoneyNumber = useCallback((valor: number) => formatMoney(valor), [formatMoney])

  useEffect(() => {
    if (token) {
      const carregarDados = async () => {
        setLoading(true)
        try {
          await Promise.all([
            carregarPerfil(),
            carregarVendas(),
            carregarEstatisticas(),
            carregarLojasAutorizadas()
          ])
        } finally {
          setLoading(false)
        }
      }
      carregarDados()
    }
  }, [token])

  const saudacao = vendedor?.loja?.nome ? `Dashboard / ${vendedor.loja.nome}` : 'Dashboard / Vendas';

  const ChartsSkeleton = () => (
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
      <div className="col-12 mb-4">
        <div className="card">
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
  )

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title={saudacao}>
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
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Vendedor</p>
                      <h5 className="font-weight-bolder mb-1">
                        {vendedor?.nome || '—'}
                      </h5>
                      {vendedor?.loja?.nome && (
                        <p className="text-sm text-muted mb-0">Loja: {vendedor.loja.nome}</p>
                      )}
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                      <i className="fas fa-user-tie text-lg opacity-10"></i>
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
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Total de Vendas</p>
                      <h5 className="font-weight-bolder mb-1">
                        {estatisticas.totalVendas}
                      </h5>
                      <p className="text-sm text-muted mb-0">Confirmadas: {estatisticas.vendasConfirmadas}</p>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-success shadow text-center border-radius-md">
                      <i className="fas fa-clipboard-list text-lg opacity-10"></i>
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
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Valor Total Vendido</p>
                      <h5 className="font-weight-bolder mb-0">
                        {formatMoney(totaisVendas.valorTotal)}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-info shadow text-center border-radius-md">
                      <i className="fas fa-money-check-alt text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">
                        {vendedor?.tipoVendedor === 'avulso' ? 'Comissão Avulsa' : 'Comissão Total'}
                      </p>
                      <h5 className="font-weight-bolder mb-0">
                        {formatMoney(totaisVendas.comissaoTotal)}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-warning shadow text-center border-radius-md">
                      <i className="fas fa-coins text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SalesPerformanceCharts
          monthlyTotals={monthlyTotals}
          statusDistribution={statusDistribution}
          commissionTrend={commissionTrend}
          formatMoney={formatMoneyNumber}
        />

        {loading && <ChartsSkeleton />}

        {vendedor?.tipoVendedor === 'avulso' && lojasAutorizadas.length > 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header pb-0">
                  <h6>Lojas que me Aceitaram</h6>
                  <p className="text-sm mb-0">Lojas onde você está autorizado a vender</p>
                </div>
                <div className="card-body">
                  <div className="row">
                    {lojasAutorizadas.map((loja: any) => (
                      <div key={loja.id} className="col-md-6 col-lg-4 mb-3">
                        <div className="card h-100">
                          <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                              {loja.logo ? (
                                <img 
                                  src={loja.logo} 
                                  alt={loja.nome}
                                  className="rounded-circle me-3"
                                  style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div 
                                  className="bg-gradient-primary rounded-circle me-3 d-flex align-items-center justify-content-center"
                                  style={{ width: '50px', height: '50px' }}
                                >
                                  <i className="fas fa-store text-white"></i>
                                </div>
                              )}
                              <div>
                                <h6 className="mb-0">{loja.nome}</h6>
                                <small className="text-muted">{loja.cidade}, {loja.estado}</small>
                              </div>
                            </div>
                            {loja.comissaoNegociada && (
                              <div className="mb-2">
                                <span className="badge bg-gradient-success">
                                  Comissão: {loja.comissaoNegociada}%
                                </span>
                              </div>
                            )}
                            <div className="d-flex justify-content-between align-items-center">
                              <small className="text-muted">
                                <i className="fas fa-envelope me-1"></i>
                                {loja.email}
                              </small>
                              {loja.telefone && (
                                <small className="text-muted">
                                  <i className="fas fa-phone me-1"></i>
                                  {loja.telefone}
                                </small>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row mt-4">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Minhas Vendas</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Veículo</th>
                        <th>Valor</th>
                        <th>Comissão</th>
                        <th>Status</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.map((venda: any) => (
                        <tr key={venda.id}>
                          <td>
                            <div>
                              <h6 className="mb-0">{venda.cliente?.name}</h6>
                              <small className="text-muted">{venda.cliente?.email}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <h6 className="mb-0">{venda.marca} {venda.modelo}</h6>
                              <small className="text-muted">{venda.ano}</small>
                            </div>
                          </td>
                          <td>{formatMoney(obterValorVenda(venda))}</td>
                          <td>
                            {(() => {
                              const commissionInfo = getCommissionInfo(venda)

                              return (
                                <div>
                                  <strong>{formatMoney(commissionInfo.valor)}</strong>
                                  {commissionInfo.percentLabel && (
                                    <small className="text-muted d-block">
                                      {commissionInfo.percentLabel} do valor da venda
                                    </small>
                                  )}
                                  {commissionInfo.descricao && !commissionInfo.percentLabel && (
                                    <small className="text-muted d-block">{commissionInfo.descricao}</small>
                                  )}
                                </div>
                              )
                            })()}
                          </td>
                          <td>
                            <span className={`badge badge-sm ${
                              venda.status === 'confirmada' ? 'bg-gradient-success' :
                              venda.status === 'pendente' ? 'bg-gradient-warning' :
                              'bg-gradient-danger'
                            }`}>
                              {venda.status}
                            </span>
                          </td>
                          <td>{new Date(venda.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
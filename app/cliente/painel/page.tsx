'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { useAuth } from '../../../stories/authStore'
import { useToast } from '../../../stories/toastStore'
import { API_BASE_URL } from '../../../lib/api'
import { formatCurrency } from '../../../lib/formatters'
import { Role } from '../../../types/auth'

interface VendaCliente {
  id: number
  valorSeguro: number | string
  valorVeiculo?: number | string | null
  status: string
  tipoVeiculo: string
  marca: string
  modelo: string
  ano: string
  placa?: string | null
  createdAt: string
  tipoCotacaoLoja?: { nome?: string | null } | null
}

interface VeiculoResumo {
  key: string
  tipoVeiculo: string
  marca: string
  modelo: string
  ano: string
  placa?: string | null
  totalCompras: number
  totalSeguro: number
  ultimaCompra: string
  statusCount: Record<string, number>
  planosUtilizados: Set<string>
}

const statusLabels: Record<string, string> = {
  confirmada: 'Confirmada',
  pendente: 'Pendente',
  cancelada: 'Cancelada'
}

const statusBadgeClass: Record<string, string> = {
  confirmada: 'success',
  pendente: 'warning',
  cancelada: 'danger'
}

const parseCurrency = (value: number | string | null | undefined) => {
  if (typeof value === 'number') {
    return value
  }

  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : 0
  }

  return 0
}

const formatStatus = (status: string) => {
  const normalized = status?.toLowerCase() || 'indefinido'
  return statusLabels[normalized] || status?.charAt(0).toUpperCase() + status?.slice(1) || 'Indefinido'
}

const getStatusBadge = (status: string) => {
  const normalized = status?.toLowerCase() || 'indefinido'
  const variant = statusBadgeClass[normalized] || 'secondary'
  return `badge bg-${variant} text-uppercase fw-semibold`
}

const formatDateTime = (value: string) => {
  try {
    return new Date(value).toLocaleString('pt-BR')
  } catch (error) {
    return value
  }
}

const resolveImageUrl = (foto?: string | null) => {
  if (!foto) {
    return ''
  }

  if (foto.startsWith('http://') || foto.startsWith('https://')) {
    return foto
  }

  if (foto.startsWith('/')) {
    return `${API_BASE_URL}${foto}`
  }

  if (foto.includes('/uploads/')) {
    return `${API_BASE_URL}/${foto.replace(/^\/+/, '')}`
  }

  return `${API_BASE_URL}/api/uploads/vendedores/fotos/${foto}`
}

export default function PainelCliente() {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const [vendas, setVendas] = useState<VendaCliente[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const userFoto = user?.foto
  const profileImage = useMemo(() => {
    const url = resolveImageUrl(userFoto)
    return url || '/assets/img/team-2.jpg'
  }, [userFoto])

  const clienteDesde = useMemo(() => {
    if (!user?.createdAt) {
      return ''
    }
    const data = new Date(user.createdAt)
    if (Number.isNaN(data.getTime())) {
      return ''
    }
    return data.toLocaleDateString('pt-BR')
  }, [user?.createdAt])

  useEffect(() => {
    if (!token || user?.role !== Role.CLIENT || !user?.id) {
      setVendas([])
      setError('')
      return
    }

    const fetchVendas = async () => {
      setLoading(true)
      setError('')

      try {
        const response = await fetch(`${API_BASE_URL}/vendas/cliente/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao buscar compras do cliente')
        }

        const data = await response.json()
        const lista = Array.isArray(data) ? data : []
        setVendas(lista)
      } catch (err) {
        console.error('Erro ao buscar compras do cliente:', err)
        setVendas([])
        setError('Não foi possível carregar suas compras no momento.')
        showToast('Erro ao carregar suas compras.', 'error')
      } finally {
        setLoading(false)
      }
    }

    fetchVendas()
  }, [token, user?.id, user?.role, showToast])

  const resumoPorVeiculo = useMemo<VeiculoResumo[]>(() => {
    if (!vendas.length) {
      return []
    }

    const mapa = new Map<string, VeiculoResumo>()

    vendas.forEach((venda) => {
      // Filtrar apenas vendas confirmadas para o cálculo do investimento
      if (venda.status !== 'confirmada') {
        return
      }

      const placaSegment = venda.placa ? venda.placa.trim().toUpperCase() : 'SEM-PLACA'
      const key = [placaSegment, venda.tipoVeiculo, venda.marca, venda.modelo, venda.ano].join('|')

      if (!mapa.has(key)) {
        mapa.set(key, {
          key,
          tipoVeiculo: venda.tipoVeiculo,
          marca: venda.marca,
          modelo: venda.modelo,
          ano: venda.ano,
          placa: venda.placa?.trim() || null,
          totalCompras: 0,
          totalSeguro: 0,
          ultimaCompra: venda.createdAt,
          statusCount: {},
          planosUtilizados: new Set<string>()
        })
      }

      const entrada = mapa.get(key)!
      entrada.totalCompras += 1
      entrada.totalSeguro += parseCurrency(venda.valorSeguro)
      if (!entrada.ultimaCompra || new Date(venda.createdAt) > new Date(entrada.ultimaCompra)) {
        entrada.ultimaCompra = venda.createdAt
      }

      const statusNormalizado = venda.status?.toLowerCase() || 'indefinido'
      entrada.statusCount[statusNormalizado] = (entrada.statusCount[statusNormalizado] || 0) + 1

      const planoNome = venda.tipoCotacaoLoja?.nome?.trim()
      if (planoNome) {
        entrada.planosUtilizados.add(planoNome)
      }
    })

    return Array.from(mapa.values()).sort((a, b) => {
      return new Date(b.ultimaCompra).getTime() - new Date(a.ultimaCompra).getTime()
    })
  }, [vendas])

  const totalCompras = vendas.filter(venda => venda.status === 'confirmada').length
  const totalVeiculos = resumoPorVeiculo.length
  const totalPremio = resumoPorVeiculo.reduce((acc, item) => acc + item.totalSeguro, 0)

  return (
    <ProtectedRoute requiredRoles={[Role.CLIENT]}>
      <DashboardLayout title="Meu Painel">
        <div className="row">
          <div className="col-12 mb-4">
            <div className="card card-profile shadow-lg border-0">
              <div className="card-body d-flex flex-wrap align-items-center gap-3">
                <div className="avatar avatar-xl position-relative">
                  <img
                    src={profileImage}
                    alt="Foto do perfil"
                    className="w-100 border-radius-lg shadow-sm"
                    style={{ objectFit: 'cover' }}
                  />
                </div>
                <div className="flex-grow-1">
                  <h4 className="mb-1">{user?.name}</h4>
                  <p className="mb-0 text-sm text-muted">
                    {user?.email}
                    {clienteDesde ? ` • Cliente desde ${clienteDesde}` : ''}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row">
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <p className="text-uppercase text-xs text-muted mb-2">Compras totais</p>
                <h3 className="mb-0">{totalCompras}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <p className="text-uppercase text-xs text-muted mb-2">Veículos diferentes</p>
                <h3 className="mb-0">{totalVeiculos}</h3>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-4">
            <div className="card shadow-sm border-0">
              <div className="card-body">
                <p className="text-uppercase text-xs text-muted mb-2">Investimento em seguros</p>
                <h3 className="mb-0">{formatCurrency(totalPremio)}</h3>
              </div>
            </div>
          </div>
        </div>

        {/* Seção Minhas Contratações */}
        <div className="row mt-4 mb-5">
          <div className="col-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom-0">
                <h5 className="mb-0 d-flex align-items-center">
                  <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                  Minhas Contratações
                </h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="d-flex justify-content-center align-items-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Carregando contratações...</span>
                    </div>
                  </div>
                ) : error ? (
                  <div className="alert alert-danger" role="alert">
                    <i className="bi bi-exclamation-triangle me-2"></i>
                    {error}
                  </div>
                ) : vendas.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="bi bi-info-circle text-muted" style={{ fontSize: '2rem' }}></i>
                    <p className="text-muted mt-2">Você ainda não possui contratações realizadas.</p>
                    <small className="text-muted">Suas solicitações de contratação aparecerão aqui assim que forem processadas.</small>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th className="border-0">Veículo</th>
                          <th className="border-0">Valor do Seguro</th>
                          <th className="border-0">Status</th>
                          <th className="border-0">Data da Solicitação</th>
                          <th className="border-0">Loja</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendas.map((venda) => (
                          <tr key={venda.id}>
                            <td>
                              <div>
                                <strong>{venda.modelo} {venda.ano}</strong>
                                <br />
                                <small className="text-muted">
                                  {venda.tipoVeiculo} • {venda.marca}
                                  {venda.placa && (
                                    <>
                                      <br />
                                      Placa: {venda.placa}
                                    </>
                                  )}
                                </small>
                              </div>
                            </td>
                            <td>
                              <span className="fw-semibold text-success">
                                {formatCurrency(parseCurrency(venda.valorSeguro))}
                              </span>
                            </td>
                            <td>
                              <span className={getStatusBadge(venda.status)}>
                                {formatStatus(venda.status)}
                              </span>
                              {venda.status?.toLowerCase() === 'pendente' && (
                                <div className="mt-1">
                                  <small className="text-muted">
                                    <i className="bi bi-clock me-1"></i>
                                    Aguardando processamento
                                  </small>
                                </div>
                              )}
                            </td>
                            <td>
                              <span className="text-nowrap">
                                {formatDateTime(venda.createdAt)}
                              </span>
                            </td>
                            <td>
                              {venda.tipoCotacaoLoja?.nome || (
                                <span className="text-muted">Não informado</span>
                              )}
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

        {loading ? (
          <div className="d-flex justify-content-center align-items-center py-5">
            <div className="spinner-border" role="status">
              <span className="visualmente-hidden">Carregando...</span>
            </div>
          </div>
        ) : error ? (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        ) : resumoPorVeiculo.length === 0 ? (
          <div className="alert alert-secondary" role="alert">
            Você ainda não possui compras realizadas com seus veículos.
          </div>
        ) : (
          <div className="row">
            {resumoPorVeiculo.map((veiculo) => (
              <div key={veiculo.key} className="col-12 col-lg-6 mb-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start flex-wrap gap-2">
                      <div>
                        <h5 className="mb-1">{veiculo.modelo} {veiculo.ano}</h5>
                        <p className="text-sm text-muted mb-2">
                          {veiculo.tipoVeiculo} • {veiculo.marca}
                        </p>
                        {veiculo.placa ? (
                          <span className="badge bg-primary">
                            Placa: {veiculo.placa}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">Sem placa informada</span>
                        )}
                      </div>
                      <div className="text-end">
                        <p className="text-xs text-muted mb-1">Compras</p>
                        <h3 className="mb-0">{veiculo.totalCompras}</h3>
                      </div>
                    </div>

                    <hr className="my-3" />

                    <div className="row g-3">
                      <div className="col-sm-6">
                        <p className="text-xs text-muted mb-1">Valor total em seguros</p>
                        <h6 className="mb-0">{formatCurrency(veiculo.totalSeguro)}</h6>
                      </div>
                      <div className="col-sm-6 text-sm-end">
                        <p className="text-xs text-muted mb-1">Última compra</p>
                        <h6 className="mb-0">{formatDateTime(veiculo.ultimaCompra)}</h6>
                      </div>
                    </div>

                    <div className="mt-3">
                      <p className="text-xs text-muted mb-2">Status das compras</p>
                      <div className="d-flex flex-wrap gap-2">
                        {Object.entries(veiculo.statusCount).map(([status, quantidade]) => (
                          <span key={status} className={getStatusBadge(status)}>
                            {formatStatus(status)}: {quantidade}
                          </span>
                        ))}
                      </div>
                    </div>

                    {veiculo.planosUtilizados.size > 0 ? (
                      <div className="mt-3">
                        <p className="text-xs text-muted mb-2">Planos contratados</p>
                        <div className="d-flex flex-wrap gap-2">
                          {Array.from(veiculo.planosUtilizados).map((plano) => (
                            <span key={plano} className="badge bg-info text-dark">
                              {plano}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}

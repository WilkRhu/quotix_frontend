'use client'

import { useState, useEffect, FormEvent } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import Link from 'next/link'
import { formatCurrency } from '../../../lib/formatters'
import { useRouter } from 'next/navigation'
import { useToast } from '../../../stories/toastStore'

export default function VendasVendedor() {
  const { token } = useAuth()
  const router = useRouter()
  const { showToast } = useToast()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [inicio, setInicio] = useState('')
  const [fim, setFim] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<'confirmar' | 'cancelar' | null>(null)

  const toNumber = (valor: unknown) => {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor
    }

    if (typeof valor === 'string') {
      const trimmed = valor.trim()
      if (!trimmed) {
        return 0
      }

      const sanitized = trimmed.replace(/[^0-9,.-]/g, '')
      if (!sanitized) {
        return 0
      }

      const direct = Number(sanitized)
      if (Number.isFinite(direct)) {
        return direct
      }

      const normalized = Number(sanitized.replace(/\./g, '').replace(',', '.'))
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
  }

  const formatMoney = (valor: unknown) => {
    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return formatCurrency(valor)
    }

    if (typeof valor === 'string') {
      const trimmed = valor.trim()
      if (!trimmed) {
        return formatCurrency(0)
      }

      const sanitized = trimmed.replace(/[^0-9,.-]/g, '')
      if (!sanitized) {
        return formatCurrency(0)
      }

      const direct = Number(sanitized)

      if (Number.isFinite(direct)) {
        return formatCurrency(direct)
      }

      const normalized = Number(sanitized.replace(/\./g, '').replace(',', '.'))

      if (Number.isFinite(normalized)) {
        return formatCurrency(normalized)
      }
    }

    if (valor !== undefined && valor !== null) {
      const coerced = Number(valor)

      if (Number.isFinite(coerced)) {
        return formatCurrency(coerced)
      }
    }

    return formatCurrency(0)
  }

  const obterValorVenda = (venda: any) => {
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
  }

  const calcularComissao = (venda: any) => {
    const valorBaseVenda = obterValorVenda(venda)
    const tipo = venda?.tipoCotacaoLoja

    if (tipo?.comissaoVendasTipo === 'valor') {
      const valorFixo = toNumber(tipo.comissaoVendasValor)
      if (valorFixo > 0) {
        return valorFixo
      }
    }

    if (tipo?.comissaoVendasTipo === 'percentual') {
      const percentual = toNumber(tipo.comissaoVendasPercentual)
      if (percentual > 0) {
        return valorBaseVenda * (percentual / 100)
      }
    }

    const percentualComissao = toNumber(venda?.percentualComissao)
    if (percentualComissao > 0) {
      return valorBaseVenda * (percentualComissao / 100)
    }

    const valorComissaoRegistrado = toNumber(venda?.valorComissao)
    if (valorComissaoRegistrado > 0) {
      const percentual = toNumber(venda?.percentualComissao)
      if (percentual > 0) {
        const esperado = valorBaseVenda * (percentual / 100)
        if (Math.abs(esperado - valorComissaoRegistrado) <= Math.max(1, esperado * 0.02)) {
          return valorComissaoRegistrado
        }
      } else if (!Number.isFinite(valorBaseVenda) || valorBaseVenda === 0) {
        return valorComissaoRegistrado
      }
    }

    return 0
  }

  const carregarVendas = async (filtros: { inicio?: string; fim?: string } = {}) => {
    if (!token) {
      return;
    }

    try {
      setLoading(true);

      const params: Record<string, string> = {};
      if (filtros.inicio) {
        // Adiciona T00:00:00 para evitar problemas de fuso horário
        params.inicio = new Date(filtros.inicio + 'T00:00:00').toISOString();
      }
      if (filtros.fim) {
        // Adiciona T23:59:59 para incluir todo o dia final
        const dataFim = new Date(filtros.fim + 'T00:00:00');
        dataFim.setHours(23, 59, 59, 999);
        params.fim = dataFim.toISOString();
      }

      console.log('Fazendo requisição para vendas com params:', params);

  const response = await axios.get(`${API_BASE_URL}/api/vendas/vendedor/vendas`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      console.log('Resposta recebida:', response.data);
      setVendas(response.data);
    } catch (error) {
      console.error('Erro ao carregar vendas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFiltrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    carregarVendas({ inicio, fim });
  };

  const handleLimparFiltro = () => {
    setInicio('');
    setFim('');
    carregarVendas({});
  };

  const atualizarStatusVenda = async (id: number, acao: 'confirmar' | 'cancelar') => {
    if (!token) {
      return
    }

    try {
      setActionLoadingId(id)
      setActionType(acao)

      // Validação específica para confirmação: verificar se a placa está preenchida
      if (acao === 'confirmar') {
        const venda = vendas.find(v => v.id === id)
        if (!venda?.placa || venda.placa.trim() === '') {
          // Em vez de bloquear, redirecionar para nova venda com dados pré-preenchidos
          const params = new URLSearchParams()
          
          if (venda?.clienteId) params.append('clienteId', venda.clienteId)
          if (venda?.cliente?.telefone) params.append('telefone', venda.cliente.telefone)
          if (venda?.tipoVeiculo) params.append('tipoVeiculo', venda.tipoVeiculo)
          if (venda?.marca) params.append('marca', venda.marca)
          if (venda?.modelo) params.append('modelo', venda.modelo)
          if (venda?.ano) params.append('ano', venda.ano)
          if (venda?.valorVeiculo) params.append('valorVeiculo', venda.valorVeiculo.toString())
          
          router.push(`/vendedor/nova-venda?${params.toString()}`)
          setActionLoadingId(null)
          setActionType(null)
          return
        }
      }

      await axios.patch(
        `${API_BASE_URL}/vendas/${id}/${acao}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setVendas((prevVendas) => prevVendas.map((venda) => (
        venda.id === id ? { ...venda, status: acao === 'confirmar' ? 'confirmada' : 'cancelada' } : venda
      )))

      showToast(
        `Venda ${acao === 'confirmar' ? 'confirmada' : 'cancelada'} com sucesso!`,
        'success'
      )
    } catch (error) {
      console.error(`Erro ao ${acao} venda:`, error)
      showToast(
        `Erro ao ${acao} venda. Tente novamente.`,
        'error'
      )
    } finally {
      setActionLoadingId(null)
      setActionType(null)
    }
  }

  useEffect(() => {
    if (token) {
      carregarVendas()
    }
  }, [token])

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title="Minhas Vendas">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Histórico de Vendas</h6>
              </div>
              <div className="card-body">
                <form className="row g-3 align-items-end mb-4" onSubmit={handleFiltrar}>
                  <div className="col-sm-6 col-md-3">
                    <label htmlFor="data-inicio" className="form-label">Data inicial</label>
                    <input
                      id="data-inicio"
                      type="date"
                      className="form-control"
                      value={inicio}
                      onChange={(event) => setInicio(event.target.value)}
                    />
                  </div>
                  <div className="col-sm-6 col-md-3">
                    <label htmlFor="data-fim" className="form-label">Data final</label>
                    <input
                      id="data-fim"
                      type="date"
                      className="form-control"
                      value={fim}
                      onChange={(event) => setFim(event.target.value)}
                    />
                  </div>
                  <div className="col-sm-6 col-md-3 d-flex gap-2">
                    <button type="submit" className="btn btn-primary flex-grow-1" disabled={loading}>
                      Filtrar
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary flex-grow-1"
                      onClick={handleLimparFiltro}
                      disabled={loading || (!inicio && !fim)}
                    >
                      Limpar
                    </button>
                  </div>
                </form>
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Carregando...</span>
                    </div>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Contatos</th>
                          <th>Veículo</th>
                          <th>Placa</th>
                          <th>Valor do Veículo</th>
                          <th>Valor do Seguro</th>
                          <th>Comissão</th>
                          <th>Status</th>
                          <th>Data</th>
                          <th className="text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendas.map((venda: any) => (
                          <tr key={venda.id}>
                            <td>
                              <div>
                                <h6 className="mb-0">{venda.cliente?.name}</h6>
                              </div>
                            </td>
                            <td>
                              <div>
                                <small className="text-muted d-block">
                                  <i className="fas fa-envelope me-1"></i>
                                  {venda.clienteEmail || venda.cliente?.email}
                                </small>
                                <small className="text-muted d-block">
                                  <i className="fas fa-phone me-1"></i>
                                  {venda.clienteTelefone || 'Não informado'}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <h6 className="mb-0">{venda.marca} {venda.modelo}</h6>
                                <small className="text-muted">{venda.ano}</small>
                                {venda?.formaPagamento === 'parcelado' && venda?.numeroParcelas > 1 ? (
                                  <small className="text-muted d-block">
                                    Venda parcelada em {venda.numeroParcelas}x
                                  </small>
                                ) : null}
                                {venda?.valorTaxa ? (
                                  <small className="text-muted d-block">
                                    Taxa adicional: {formatMoney(venda.valorTaxa)}
                                  </small>
                                ) : null}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${
                                venda.placa && venda.placa.trim() !== ''
                                  ? 'bg-light text-dark'
                                  : 'bg-warning text-dark'
                              }`}>
                                {venda.placa && venda.placa.trim() !== '' ? venda.placa.toUpperCase() : 'Não informada'}
                              </span>
                            </td>
                            <td>{formatMoney(venda?.valorVeiculo)}</td>
                            <td>{formatMoney(obterValorVenda(venda))}</td>
                            <td>{formatMoney(calcularComissao(venda))}</td>
                            <td>
                              <span className={`badge badge-sm ${
                                venda.status === 'confirmada' ? 'bg-gradient-success' :
                                venda.status === 'pendente' ? 'bg-gradient-warning' :
                                'bg-gradient-danger'
                              }`}>
                                {venda.status}
                              </span>
                            </td>
                            <td>{new Date(venda.createdAt).toLocaleDateString('pt-BR')}</td>
                            <td className="text-center">
                              {(venda.status === 'pendente' || venda.status === 'em_atendimento') ? (
                                <div className="d-inline-flex align-items-center gap-2">
                                  <Link
                                    href={`/vendedor/vendas/${venda.id}/editar`}
                                    className="btn btn-link text-primary p-0"
                                    title="Editar venda"
                                  >
                                    <i className="fas fa-pen"></i>
                                  </Link>
                                  <button
                                    type="button"
                                    className="btn btn-success btn-sm px-2"
                                    onClick={() => atualizarStatusVenda(venda.id, 'confirmar')}
                                    disabled={actionLoadingId === venda.id}
                                    title="Confirmar venda"
                                  >
                                    {actionLoadingId === venda.id && actionType === 'confirmar' ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fas fa-check"></i>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger px-2"
                                    onClick={() => atualizarStatusVenda(venda.id, 'cancelar')}
                                    disabled={actionLoadingId === venda.id}
                                    title="Cancelar venda"
                                  >
                                    {actionLoadingId === venda.id && actionType === 'cancelar' ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fas fa-times"></i>
                                    )}
                                  </button>
                                </div>
                              ) : (
                                <span className="text-muted">—</span>
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}
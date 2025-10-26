"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import DashboardLayout from '../../../../../components/DashboardLayout'
import ProtectedRoute from '../../../../../components/ProtectedRoute'
import { Role } from '../../../../../types/auth'
import { useAuth } from '../../../../../stories/authStore'
import { API_BASE_URL } from '../../../../../lib/api'
import { formatCurrency } from '../../../../../lib/formatters'

interface TipoCotacaoLoja {
  id: string
  nome: string
  descricao?: string
  temTaxaAdesao?: boolean
  taxaAdesaoTipo?: 'valor' | 'percentual' | null
  taxaAdesaoValor?: number | string | null
  taxaAdesaoPercentual?: number | string | null
  comissaoVendasTipo?: 'percentual' | 'valor' | null
  comissaoVendasPercentual?: number | string | null
  comissaoVendasValor?: number | string | null
}

export default function EditarVendaPendente() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [venda, setVenda] = useState<any>(null)
  const [tiposCotacao, setTiposCotacao] = useState<TipoCotacaoLoja[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState({ valorTaxa: 0, valorComissao: 0, percentualComissao: 0 })

  const toNumber = (value: unknown) => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    if (typeof value === 'string') {
      const sanitized = value.trim().replace(/[^0-9,.-]/g, '').replace(',', '.')
      if (!sanitized) {
        return 0
      }
      const parsed = Number(sanitized)
      return Number.isFinite(parsed) ? parsed : 0
    }

    if (value !== undefined && value !== null) {
      const parsed = Number(value)
      return Number.isFinite(parsed) ? parsed : 0
    }

    return 0
  }

  const roundTwo = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100

  const calcularResumo = (tipoId: string | null, dadosVenda: any) => {
    if (!dadosVenda) {
      return { valorTaxa: 0, valorComissao: 0, percentualComissao: 0 }
    }

    const tipoSelecionado = tipoId ? tiposCotacao.find((tipo) => tipo.id === tipoId) : null

    const valorSeguro = toNumber(dadosVenda.valorSeguro)
    const valorVeiculo = toNumber(dadosVenda.valorVeiculo)
    const baseCalculoVeiculo = valorVeiculo > 0 ? valorVeiculo : valorSeguro

    let valorTaxa = 0
    if (tipoSelecionado?.temTaxaAdesao) {
      if (tipoSelecionado.taxaAdesaoTipo === 'valor') {
        valorTaxa = toNumber(tipoSelecionado.taxaAdesaoValor)
      } else if (tipoSelecionado.taxaAdesaoTipo === 'percentual') {
        const percentualTaxa = toNumber(tipoSelecionado.taxaAdesaoPercentual)
        valorTaxa = (baseCalculoVeiculo * percentualTaxa) / 100
      }
    }

    let percentualComissao = toNumber(dadosVenda.percentualComissao)
    let valorComissao = toNumber(dadosVenda.valorComissao)

    if (tipoSelecionado) {
      if (tipoSelecionado.comissaoVendasTipo === 'percentual') {
        percentualComissao = toNumber(tipoSelecionado.comissaoVendasPercentual)
        valorComissao = (valorSeguro * percentualComissao) / 100
      } else if (tipoSelecionado.comissaoVendasTipo === 'valor') {
        valorComissao = toNumber(tipoSelecionado.comissaoVendasValor)
        percentualComissao = valorSeguro > 0 ? (valorComissao / valorSeguro) * 100 : 0
      } else {
        valorComissao = (valorSeguro * percentualComissao) / 100
      }
    } else {
      valorComissao = (valorSeguro * percentualComissao) / 100
    }

    return {
      valorTaxa: roundTwo(valorTaxa),
      valorComissao: roundTwo(valorComissao),
      percentualComissao: roundTwo(percentualComissao)
    }
  }

  useEffect(() => {
    const carregarDados = async () => {
      if (!token) {
        return
      }

      try {
        setLoading(true)
        setErrorMessage(null)

        const vendaId = params?.id?.toString()
        if (!vendaId) {
          setErrorMessage('Venda não encontrada.')
          return
        }

        const vendaResponse = await axios.get(`${API_BASE_URL}/vendas/${vendaId}`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const tiposLojaResponse = await axios.get(`${API_BASE_URL}/api/vendas/vendedor/tipos-cotacao`, {
          headers: { Authorization: `Bearer ${token}` }
        })

        if (vendaResponse.data?.status !== 'pendente') {
          setErrorMessage('Apenas vendas pendentes podem ser editadas.')
          return
        }

        const tipos = Array.isArray(tiposLojaResponse.data) ? tiposLojaResponse.data : []
        const dadosVenda = vendaResponse.data

        setVenda(dadosVenda)
        setTiposCotacao(tipos)
        setPreview(calcularResumo(dadosVenda.tipoCotacaoLojaId ?? null, dadosVenda))
      } catch (error) {
        console.error('Erro ao carregar venda para edição:', error)
        setErrorMessage('Não foi possível carregar os dados da venda. Tente novamente mais tarde.')
      } finally {
        setLoading(false)
      }
    }

    carregarDados()
  }, [token, params?.id])

  const handleChangePlano = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    if (!venda) {
      return
    }

    const novoTipoId = event.target.value

    const vendaAtualizada = { ...venda, tipoCotacaoLojaId: novoTipoId }
    setVenda(vendaAtualizada)
    setPreview(calcularResumo(novoTipoId || null, vendaAtualizada))
  }

  const handleSalvar = async () => {
    if (!token || !venda) {
      return
    }

    try {
      setSaving(true)
      setErrorMessage(null)

      const payload = {
        tipoCotacaoLojaId: venda.tipoCotacaoLojaId ? venda.tipoCotacaoLojaId : null,
        placa: venda.placa?.trim() || null,
      }

      await axios.patch(
        `${API_BASE_URL}/vendas/${venda.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      router.push('/vendedor/vendas')
    } catch (error) {
      console.error('Erro ao atualizar venda:', error)
      setErrorMessage('Não foi possível salvar as alterações. Tente novamente.')
    } finally {
      setSaving(false)
    }
  }

  if (!token) {
    return null
  }

  useEffect(() => {
    if (venda) {
      setPreview(calcularResumo(venda.tipoCotacaoLojaId ?? null, venda))
    }
  }, [tiposCotacao, venda])

  const formatPercent = (value: number) => {
    if (!Number.isFinite(value)) {
      return '0%'
    }
    return `${value.toFixed(2).replace('.', ',')}%`
  }

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title="Editar Venda Pendente">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                <h6>Atualizar plano da venda</h6>
                <button
                  type="button"
                  className="btn btn-link text-secondary"
                  onClick={() => router.back()}
                >
                  <i className="fas fa-arrow-left me-1"></i>
                  Voltar
                </button>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Carregando...</span>
                    </div>
                  </div>
                ) : errorMessage ? (
                  <div className="alert alert-danger" role="alert">
                    {errorMessage}
                  </div>
                ) : venda ? (
                  <>
                    <div className="mb-4">
                      <h6 className="text-uppercase text-muted">Resumo da venda</h6>
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Cliente:</strong> {venda.cliente?.name}</p>
                          <p className="mb-1"><strong>Veículo:</strong> {venda.marca} {venda.modelo} ({venda.ano})</p>
                          <p className="mb-1"><strong>Placa:</strong> {venda.placa || 'Não informada'}</p>
                          <p className="mb-1"><strong>Valor do Seguro:</strong> {formatCurrency(Number(venda.valorSeguro || 0))}</p>
                          <p className="mb-1"><strong>Valor do Veículo (base):</strong> {formatCurrency(Number(venda.valorVeiculo || 0))}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1"><strong>Comissão atual:</strong> {formatCurrency(Number(venda.valorComissao || 0))}</p>
                          <p className="mb-1"><strong>Status atual:</strong> {venda.status}</p>
                          <p className="mb-1"><strong>Plano atual:</strong> {venda.tipoCotacaoLoja?.nome || 'Padrão da Loja'}</p>
                          <p className="mb-1"><strong>Comissão prevista:</strong> {formatCurrency(preview.valorComissao)} ({formatPercent(preview.percentualComissao)})</p>
                          <p className="mb-1"><strong>Taxa de adesão prevista:</strong> {formatCurrency(preview.valorTaxa)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="form-label">Placa do Veículo</label>
                      <input
                        type="text"
                        className="form-control"
                        value={venda.placa || ''}
                        onChange={(e) => setVenda({ ...venda, placa: e.target.value.toUpperCase() })}
                        placeholder="ABC-1234"
                        maxLength={8}
                        style={{ textTransform: 'uppercase' }}
                      />
                      <small className="text-muted">
                        Informe a placa do veículo para poder confirmar a venda
                      </small>
                    </div>

                    <div className="d-flex justify-content-end gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={() => router.back()}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleSalvar}
                        disabled={saving}
                      >
                        {saving ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Salvar alterações
                          </>
                        )}
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="alert alert-warning" role="alert">
                    Venda não encontrada ou não está disponível para edição.
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
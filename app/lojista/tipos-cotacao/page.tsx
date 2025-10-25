'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { API_BASE_URL } from '../../../lib/api'
import { formatCurrency } from '../../../lib/formatters'
import { useAuth } from '../../../stories/authStore'

interface TipoCotacaoLoja {
  id: string
  lojaId: string
  nome: string
  tipoVeiculo?: string
  descricao?: string
  temTaxaAdesao: boolean
  taxaAdesaoTipo?: 'valor' | 'percentual'
  taxaAdesaoValor?: number
  taxaAdesaoPercentual?: number
  temBaseCalculo: boolean
  baseCalculoTipo?: 'percentual' | 'fixa'
  baseCalculoPercentual?: number
  baseCalculoValorFixo?: number
  ativo: boolean
  createdAt: string
  comissaoVendasTipo?: 'percentual' | 'valor' | null
  comissaoVendasPercentual?: number | string | null
  comissaoVendasValor?: number | string | null
}

export default function TiposCotacaoLojista() {
  const { user, token } = useAuth()
  const [tiposCotacao, setTiposCotacao] = useState<TipoCotacaoLoja[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [editingTipo, setEditingTipo] = useState<TipoCotacaoLoja | null>(null)
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [form, setForm] = useState({
    nome: '',
    tipoVeiculo: '',
    descricao: '',
    temTaxaAdesao: false,
    taxaAdesaoTipo: 'valor' as 'valor' | 'percentual',
    taxaAdesaoValor: '',
    taxaAdesaoPercentual: '',
    temBaseCalculo: false,
    baseCalculoTipo: 'percentual' as 'percentual' | 'fixa',
    baseCalculoPercentual: '',
    baseCalculoValorFixo: '',
    temComissaoVendas: false,
    comissaoVendasTipo: 'percentual' as 'percentual' | 'valor',
    comissaoVendasPercentual: '',
    comissaoVendasValor: ''
  })

  const parseNumberInput = (value: string) => {
    if (value === undefined || value === null || value === '') {
      return undefined
    }

    const parsed = parseFloat(value)
    return Number.isNaN(parsed) ? undefined : parsed
  }

  const toInputString = (value: unknown) => {
    if (value === null || value === undefined) {
      return ''
    }

    if (typeof value === 'number') {
      return Number.isFinite(value) ? `${value}` : ''
    }

    if (typeof value === 'string') {
      return value
    }

    return ''
  }

  const formatPercent = (value: unknown) => {
    if (value === null || value === undefined) {
      return null
    }

    const numeric = Number(value)

    if (!Number.isFinite(numeric)) {
      return null
    }

    return `${numeric.toFixed(2).replace('.', ',')}%`
  }

  useEffect(() => {
    loadTiposCotacao()
  }, [token, user?.lojaId, user?.role])

  const loadTiposCotacao = async () => {
    try {
      if (!token) {
        return
      }

      const response = await fetch(`${API_BASE_URL}/api/tipos-cotacao-loja`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        const isAdmin = user?.role === Role.ADMIN
        const lojaId = user?.lojaId

        const filtrados = !isAdmin && lojaId
          ? data.filter((tipo: TipoCotacaoLoja) => tipo.lojaId === lojaId)
          : data

        setTiposCotacao(filtrados)
      }
    } catch (error) {
      console.error('Erro ao carregar tipos de cotação:', error)
    }
  }

  const resetForm = () => {
    setForm({
      nome: '',
      tipoVeiculo: '',
      descricao: '',
      temTaxaAdesao: false,
      taxaAdesaoTipo: 'valor',
      taxaAdesaoValor: '',
      taxaAdesaoPercentual: '',
      temBaseCalculo: false,
      baseCalculoTipo: 'percentual',
      baseCalculoPercentual: '',
      baseCalculoValorFixo: '',
      temComissaoVendas: false,
      comissaoVendasTipo: 'percentual',
      comissaoVendasPercentual: '',
      comissaoVendasValor: ''
    })
  }

  const openCreateModal = () => {
    setEditingTipo(null)
    resetForm()
    setShowModal(true)
  }

  const openEditModal = (tipo: TipoCotacaoLoja) => {
    setEditingTipo(tipo)
    setForm({
      nome: tipo.nome || '',
      tipoVeiculo: tipo.tipoVeiculo || '',
      descricao: tipo.descricao || '',
      temTaxaAdesao: Boolean(tipo.temTaxaAdesao),
      taxaAdesaoTipo: (tipo.taxaAdesaoTipo ?? 'valor') as 'valor' | 'percentual',
      taxaAdesaoValor: tipo.taxaAdesaoTipo === 'valor' ? toInputString(tipo.taxaAdesaoValor) : '',
      taxaAdesaoPercentual: tipo.taxaAdesaoTipo === 'percentual' ? toInputString(tipo.taxaAdesaoPercentual) : '',
      temBaseCalculo: Boolean(tipo.temBaseCalculo),
      baseCalculoTipo: (tipo.baseCalculoTipo ?? 'percentual') as 'percentual' | 'fixa',
      baseCalculoPercentual: tipo.temBaseCalculo && tipo.baseCalculoTipo === 'percentual' ? toInputString(tipo.baseCalculoPercentual) : '',
      baseCalculoValorFixo: tipo.temBaseCalculo && tipo.baseCalculoTipo === 'fixa' ? toInputString(tipo.baseCalculoValorFixo) : '',
      temComissaoVendas: Boolean(tipo.comissaoVendasTipo),
      comissaoVendasTipo: (tipo.comissaoVendasTipo ?? 'percentual') as 'percentual' | 'valor',
      comissaoVendasPercentual: tipo.comissaoVendasTipo === 'percentual' ? toInputString(tipo.comissaoVendasPercentual) : '',
      comissaoVendasValor: tipo.comissaoVendasTipo === 'valor' ? toInputString(tipo.comissaoVendasValor) : ''
    })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingTipo(null)
    resetForm()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage(null)

    if (!token) {
      console.error('Token de autenticação não encontrado para criar tipo de cotação')
      setErrorMessage('Não foi possível encontrar o token de autenticação. Faça login novamente e tente outra vez.')
      setLoading(false)
      return
    }

    try {
      const payload: Record<string, unknown> = {
        nome: form.nome,
        tipoVeiculo: form.tipoVeiculo || null,
        ...(form.descricao && { descricao: form.descricao }),
        temTaxaAdesao: form.temTaxaAdesao,
        taxaAdesaoTipo: form.temTaxaAdesao ? form.taxaAdesaoTipo : undefined,
        taxaAdesaoValor: form.temTaxaAdesao && form.taxaAdesaoTipo === 'valor' ? parseNumberInput(form.taxaAdesaoValor) : undefined,
        taxaAdesaoPercentual: form.temTaxaAdesao && form.taxaAdesaoTipo === 'percentual' ? parseNumberInput(form.taxaAdesaoPercentual) : undefined,
        temBaseCalculo: form.temBaseCalculo,
        baseCalculoTipo: form.temBaseCalculo ? form.baseCalculoTipo : undefined,
        baseCalculoPercentual: form.temBaseCalculo && form.baseCalculoTipo === 'percentual' ? parseNumberInput(form.baseCalculoPercentual) : undefined,
        baseCalculoValorFixo: form.temBaseCalculo && form.baseCalculoTipo === 'fixa' ? parseNumberInput(form.baseCalculoValorFixo) : undefined
      }

      if (form.temComissaoVendas) {
        payload.comissaoVendasTipo = form.comissaoVendasTipo
        payload.comissaoVendasPercentual = form.comissaoVendasTipo === 'percentual'
          ? parseNumberInput(form.comissaoVendasPercentual)
          : undefined
        payload.comissaoVendasValor = form.comissaoVendasTipo === 'valor'
          ? parseNumberInput(form.comissaoVendasValor)
          : undefined
      } else {
        payload.comissaoVendasTipo = null
        payload.comissaoVendasPercentual = null
        payload.comissaoVendasValor = null
      }

      const lojaIdForPayload = editingTipo?.lojaId ?? user?.lojaId

      if (!lojaIdForPayload) {
        console.error('Usuário não possui loja associada para criar ou atualizar tipo de cotação')
        setErrorMessage('Não foi possível identificar a loja associada. Verifique se seu usuário está vinculado a uma loja.')
        setLoading(false)
        return
      }

      payload.lojaId = lojaIdForPayload

      const endpoint = editingTipo
        ? `${API_BASE_URL}/api/tipos-cotacao-loja/${editingTipo.id}`
        : `${API_BASE_URL}/api/tipos-cotacao-loja`

      const method = editingTipo ? 'PATCH' : 'POST'

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setShowModal(false)
        setEditingTipo(null)
        resetForm()
        loadTiposCotacao()
        return
      }

      const errorData = await response.json().catch(() => null)
      const backendMessage = Array.isArray(errorData?.message)
        ? errorData?.message.join(', ')
        : (errorData?.message || 'Não foi possível salvar o tipo de cotação. Verifique os dados e tente novamente.')

      setErrorMessage(backendMessage)
      console.error('Erro ao salvar tipo de cotação:', errorData)
    } catch (error) {
      console.error('Erro ao salvar tipo de cotação:', error)
      setErrorMessage('Erro inesperado ao salvar o tipo de cotação. Tente novamente em instantes.')
    } finally {
      setLoading(false)
      }
  }

  const handleToggleAtivo = async (tipo: TipoCotacaoLoja) => {
    try {
      if (!token) {
        return
      }
      setActionLoadingId(tipo.id)
      const endpoint = `${API_BASE_URL}/api/tipos-cotacao-loja/${tipo.id}/${tipo.ativo ? 'desativar' : 'ativar'}`
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        loadTiposCotacao()
      }
    } catch (error) {
      console.error('Erro ao alterar status do tipo de cotação:', error)
    } finally {
      setActionLoadingId(null)
    }
  }

  const formatPercentWithSymbol = (value: unknown) => {
    const percentText = formatPercent(value)
    return percentText ? `${percentText}` : null
  }

  const renderPercentCommission = (percentValue: number | string | null | undefined, tipo?: TipoCotacaoLoja) => {
    const percentText = formatPercentWithSymbol(percentValue)

    if (!percentText) {
      return <span className="text-muted">Percentual não configurado</span>
    }

    const previewBase = 1000
    const numericPercent = Number(percentValue)
    const previewValue = Number.isFinite(numericPercent) ? (previewBase * numericPercent) / 100 : 0

    return (
      <div>
        <strong>{percentText} do valor da venda</strong>
        <small className="d-block text-muted">
          Exemplo: {formatCurrency(previewValue)} a cada {formatCurrency(previewBase)} vendidos
        </small>
        {tipo?.nome && (
          <small className="d-block text-muted">Regra do tipo {tipo.nome}</small>
        )}
      </div>
    )
  }

  const renderComissao = (tipo: TipoCotacaoLoja) => {
    if (!tipo.comissaoVendasTipo) {
      return <span className="text-muted">Padrão da loja</span>
    }

    if (tipo.comissaoVendasTipo === 'percentual') {
      return renderPercentCommission(tipo.comissaoVendasPercentual, tipo)
    }

    if (tipo.comissaoVendasTipo === 'valor' && tipo.comissaoVendasValor !== null && tipo.comissaoVendasValor !== undefined) {
      const valor = Number(tipo.comissaoVendasValor)
      if (Number.isFinite(valor)) {
        return (
          <div>
            <strong>{formatCurrency(valor)}</strong>
            {tipo?.nome && (
              <small className="d-block text-muted">Regra do tipo {tipo.nome}</small>
            )}
            <small className="d-block text-muted">Valor fixo creditado em cada venda</small>
          </div>
        )
      }
    }

    return <span className="text-muted">Configuração de comissão indisponível</span>
  }

  const isEditing = Boolean(editingTipo)

  return (
    <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST, Role.ADMIN]}>
      <DashboardLayout title="Tipos de Cotação">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between">
                <h6>Gerenciar Tipos de Cotação</h6>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={openCreateModal}
                >
                  <i className="fas fa-plus me-1"></i>
                  Novo Tipo
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Base de Cálculo</th>
                        <th>Taxa de Adesão</th>
                        <th>Comissão de Vendas</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tiposCotacao.map((tipo) => (
                        <tr key={tipo.id}>
                          <td>
                            <h6 className="mb-0">{tipo.nome}</h6>
                            {tipo.descricao && <small className="text-muted">{tipo.descricao}</small>}
                          </td>
                          <td>
                            {tipo.temBaseCalculo ? (
                              <div>
                                <span>{tipo.baseCalculoTipo === 'percentual' ? 'Percentual da FIPE' : 'Valor Fixo'}</span>
                                <br />
                                <small className="text-muted">
                                  {(() => {
                                    if (tipo.baseCalculoTipo === 'percentual') {
                                      const percentText = formatPercent(tipo.baseCalculoPercentual)
                                      return percentText ? `${percentText} da FIPE` : 'N/A'
                                    }

                                    if (tipo.baseCalculoTipo === 'fixa') {
                                      const numeric = Number(tipo.baseCalculoValorFixo)
                                      return Number.isFinite(numeric) ? formatCurrency(numeric) : 'N/A'
                                    }

                                    return 'N/A'
                                  })()}
                                </small>
                              </div>
                            ) : (
                              <span className="text-muted">N/A</span>
                            )}
                          </td>
                          <td>
                            {tipo.temTaxaAdesao ? (
                              <div>
                                {(() => {
                                  if (tipo.taxaAdesaoTipo === 'valor') {
                                    const numeric = Number(tipo.taxaAdesaoValor)
                                    return Number.isFinite(numeric) ? <span>{formatCurrency(numeric)}</span> : null
                                  }

                                  if (tipo.taxaAdesaoTipo === 'percentual') {
                                    const percentText = formatPercent(tipo.taxaAdesaoPercentual)
                                    return percentText ? <span>{percentText}</span> : null
                                  }

                                  return null
                                })()}
                              </div>
                            ) : (
                              <span className="text-muted">Sem taxa</span>
                            )}
                          </td>
                          <td>{renderComissao(tipo)}</td>
                          <td>
                            <span className={`badge badge-sm ${tipo.ativo ? 'bg-gradient-success' : 'bg-gradient-danger'}`}>
                              {tipo.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-2">
                              <button
                                className="btn btn-link p-0 text-primary"
                                onClick={() => openEditModal(tipo)}
                                title="Editar tipo"
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className="btn btn-link p-0 text-warning"
                                onClick={() => handleToggleAtivo(tipo)}
                                disabled={actionLoadingId === tipo.id}
                                title={tipo.ativo ? 'Desativar' : 'Ativar'}
                              >
                                {actionLoadingId === tipo.id ? (
                                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                ) : (
                                  <i className={`fas fa-toggle-${tipo.ativo ? 'on' : 'off'}`}></i>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Novo Tipo de Cotação */}
        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editingTipo ? 'Editar Tipo de Cotação' : 'Novo Tipo de Cotação'}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={handleCloseModal}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    {errorMessage && (
                      <div className="alert alert-danger" role="alert">
                        {errorMessage}
                      </div>
                    )}
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nome</label>
                        <input
                          type="text"
                          className="form-control"
                          value={form.nome}
                          onChange={(e) => setForm({ ...form, nome: e.target.value })}
                          required
                        />
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo de Veículo</label>
                        <select
                          className="form-control"
                          value={form.tipoVeiculo}
                          onChange={(e) => setForm({ ...form, tipoVeiculo: e.target.value })}
                          required={!editingTipo}
                        >
                          <option value="">Selecione o tipo</option>
                          <option value="carros">Carros</option>
                          <option value="motos">Motos</option>
                          <option value="caminhoes">Caminhões</option>
                        </select>
                      </div>
                      <div className="col-12 mb-3">
                        <label className="form-label">Descrição</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={form.descricao}
                          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                        />
                      </div>
                      <div className="col-12 mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="temBaseCalculo"
                            checked={form.temBaseCalculo}
                            onChange={(e) => setForm({...form, temBaseCalculo: e.target.checked})}
                          />
                          <label className="form-check-label" htmlFor="temBaseCalculo">
                            Possui base de cálculo
                          </label>
                        </div>
                      </div>
                      {form.temBaseCalculo && (
                        <>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Tipo de Base</label>
                            <select
                              className="form-control"
                              value={form.baseCalculoTipo}
                              onChange={(e) => setForm({...form, baseCalculoTipo: e.target.value as 'percentual' | 'fixa'})}
                            >
                              <option value="percentual">Percentual da FIPE</option>
                              <option value="fixa">Valor Fixo</option>
                            </select>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              {form.baseCalculoTipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}
                            </label>
                            <input
                              type="number"
                              step={form.baseCalculoTipo === 'percentual' ? '0.01' : '0.01'}
                              className="form-control"
                              value={form.baseCalculoTipo === 'percentual' ? form.baseCalculoPercentual : form.baseCalculoValorFixo}
                              onChange={(e) => {
                                if (form.baseCalculoTipo === 'percentual') {
                                  setForm({...form, baseCalculoPercentual: e.target.value})
                                } else {
                                  setForm({...form, baseCalculoValorFixo: e.target.value})
                                }
                              }}
                              required
                            />
                          </div>
                        </>
                      )}
                      <div className="col-12 mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="temTaxaAdesao"
                            checked={form.temTaxaAdesao}
                            onChange={(e) => setForm({...form, temTaxaAdesao: e.target.checked})}
                          />
                          <label className="form-check-label" htmlFor="temTaxaAdesao">
                            Possui taxa de adesão
                          </label>
                        </div>
                      </div>
                      {form.temTaxaAdesao && (
                        <>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Tipo de Taxa</label>
                            <select
                              className="form-control"
                              value={form.taxaAdesaoTipo}
                              onChange={(e) => setForm({...form, taxaAdesaoTipo: e.target.value as 'valor' | 'percentual'})}
                            >
                              <option value="valor">Valor Fixo</option>
                              <option value="percentual">Percentual</option>
                            </select>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              {form.taxaAdesaoTipo === 'valor' ? 'Valor (R$)' : 'Percentual (%)'}
                            </label>
                            <input
                              type="number"
                              step={form.taxaAdesaoTipo === 'valor' ? '0.01' : '0.01'}
                              className="form-control"
                              value={form.taxaAdesaoTipo === 'valor' ? form.taxaAdesaoValor : form.taxaAdesaoPercentual}
                              onChange={(e) => {
                                if (form.taxaAdesaoTipo === 'valor') {
                                  setForm({...form, taxaAdesaoValor: e.target.value})
                                } else {
                                  setForm({...form, taxaAdesaoPercentual: e.target.value})
                                }
                              }}
                              required
                            />
                          </div>
                        </>
                      )}
                      <div className="col-12 mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            id="temComissaoVendas"
                            checked={form.temComissaoVendas}
                            onChange={(e) => setForm({
                              ...form,
                              temComissaoVendas: e.target.checked,
                              ...(e.target.checked ? {} : {
                                comissaoVendasPercentual: '',
                                comissaoVendasValor: ''
                              })
                            })}
                          />
                          <label className="form-check-label" htmlFor="temComissaoVendas">
                            Definir comissão de vendas personalizada
                          </label>
                        </div>
                      </div>
                      {form.temComissaoVendas && (
                        <>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">Tipo de Comissão</label>
                            <select
                              className="form-control"
                              value={form.comissaoVendasTipo}
                              onChange={(e) => setForm({
                                ...form,
                                comissaoVendasTipo: e.target.value as 'percentual' | 'valor'
                              })}
                            >
                              <option value="percentual">Percentual da venda</option>
                              <option value="valor">Valor fixo (R$)</option>
                            </select>
                          </div>
                          <div className="col-md-6 mb-3">
                            <label className="form-label">
                              {form.comissaoVendasTipo === 'percentual' ? 'Percentual (%)' : 'Valor (R$)'}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              className="form-control"
                              value={form.comissaoVendasTipo === 'percentual' ? form.comissaoVendasPercentual : form.comissaoVendasValor}
                              onChange={(e) => {
                                if (form.comissaoVendasTipo === 'percentual') {
                                  setForm({ ...form, comissaoVendasPercentual: e.target.value })
                                } else {
                                  setForm({ ...form, comissaoVendasValor: e.target.value })
                                }
                              }}
                              required={form.temComissaoVendas}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleCloseModal}
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : (isEditing ? 'Salvar Alterações' : 'Criar Tipo')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
'use client'

import { useState, useEffect, useMemo } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import { useToast } from '../../../stories/toastStore'
import { formatCurrency } from '../../../lib/formatters'

interface Cliente {
  id: string
  name: string
  email: string
  role: string
  lojaId?: string
  createdAt: string
}

interface VendaResumo {
  id: number
  valorSeguro: number
  valorComissao: number
  valorTaxa?: number
  valorVeiculo?: number | null
  status: string
  createdAt: string
  metodoPagamento?: string
  tipoCotacaoLoja?: { nome?: string } | null
  vendedor?: { nome?: string } | null
}

export default function ListaClientes() {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null)
  const [modalMode, setModalMode] = useState<'view' | 'edit' | null>(null)
  const [modalForm, setModalForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [clienteVendas, setClienteVendas] = useState<VendaResumo[]>([])
  const [carregandoVendas, setCarregandoVendas] = useState(false)

  useEffect(() => {
    if (!token) {
      return
    }

    fetchClientes()
  }, [token, user?.lojaId, user?.role])

  const fetchClientes = async () => {
    if (!token) {
      setClientes([])
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/users/clientes`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          }
        }
      )
      const data: Cliente[] = response.data
      const isAdmin = user?.role === Role.ADMIN
      const lojaId = user?.lojaId
      const filtrados = !isAdmin && lojaId
        ? data.filter((cliente) => cliente.lojaId === lojaId)
        : data
      setClientes(filtrados)
    } catch (error: any) {
      console.error('Erro ao buscar clientes:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao buscar clientes'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
  }

  const abrirModal = (cliente: Cliente, modo: 'view' | 'edit') => {
    setClienteSelecionado(cliente)
    setModalMode(modo)
    setModalForm({
      name: cliente.name ?? '',
      email: cliente.email ?? ''
    })

    if (modo === 'view') {
      carregarVendasCliente(cliente.id)
    }
  }

  const fecharModal = () => {
    setClienteSelecionado(null)
    setModalMode(null)
    setModalForm({ name: '', email: '' })
    setSaving(false)
    setClienteVendas([])
    setCarregandoVendas(false)
  }

  const handleModalInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target
    setModalForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleSalvarCliente = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!clienteSelecionado) {
      return
    }

    setSaving(true)

    try {
      await axios.patch(
        `${API_BASE_URL}/api/users/${clienteSelecionado.id}`,
        {
          name: modalForm.name,
          email: modalForm.email
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      setClientes((prev) =>
        prev.map((cliente) =>
          cliente.id === clienteSelecionado.id
            ? { ...cliente, name: modalForm.name, email: modalForm.email }
            : cliente
        )
      )

      showToast('Cliente atualizado com sucesso!', 'success')
      fecharModal()
    } catch (error: any) {
      console.error('Erro ao atualizar cliente:', error)
      const mensagem =
        error.response?.data?.message ||
        error.message ||
        'Erro ao atualizar cliente'
      showToast(mensagem, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleExcluirCliente = (cliente: Cliente) => {
    showToast(
      `Deseja realmente excluir o cliente ${cliente.name}?`,
      'confirmation',
      () => confirmarExclusao(cliente)
    )
  }

  const confirmarExclusao = async (cliente: Cliente) => {
    setDeletingId(cliente.id)

    try {
      await axios.delete(`${API_BASE_URL}/api/users/${cliente.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      setClientes((prev) => prev.filter((item) => item.id !== cliente.id))
      showToast('Cliente excluído com sucesso!', 'success')
    } catch (error: any) {
      console.error('Erro ao excluir cliente:', error)
      const mensagem =
        error.response?.data?.message ||
        error.message ||
        'Erro ao excluir cliente'
      showToast(mensagem, 'error')
    } finally {
      setDeletingId(null)
    }
  }

  const carregarVendasCliente = async (clienteId: string) => {
    if (!token) {
      return
    }

    setCarregandoVendas(true)
    setClienteVendas([])

    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/vendas/cliente/${clienteId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      const vendas: VendaResumo[] = Array.isArray(response.data) ? response.data : []
      setClienteVendas(vendas)
    } catch (error: any) {
      console.error('Erro ao carregar compras do cliente:', error)
      const message = error.response?.data?.message || 'Erro ao carregar compras do cliente'
      showToast(message, 'error')
    } finally {
      setCarregandoVendas(false)
    }
  }

  const clientesOrdenados = useMemo(() => {
    return [...clientes].sort((a, b) => {
      const dataA = new Date(a.createdAt).getTime()
      const dataB = new Date(b.createdAt).getTime()
      return dataB - dataA
    })
  }, [clientes])

  const clientesFiltrados = useMemo(() => {
    const termo = searchTerm.trim().toLowerCase()

    if (!termo) {
      return clientesOrdenados.slice(0, 5)
    }

    return clientesOrdenados.filter((cliente) => {
      const nome = cliente.name?.toLowerCase() ?? ''
      const email = cliente.email?.toLowerCase() ?? ''
      return nome.includes(termo) || email.includes(termo)
    })
  }, [clientesOrdenados, searchTerm])

  return (
  <ProtectedRoute requiredRoles={[Role.ADMIN, Role.SELLER, Role.LOGIST, Role.LOJISTA]}>
      <DashboardLayout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="card-title mb-0">
                    <i className="fas fa-users me-2"></i>
                    Lista de Clientes
                  </h4>
                </div>
                <div className="card-body">
                  <div className="row align-items-end mb-4">
                    <div className="col-md-8">
                      <label htmlFor="busca-clientes" className="form-label">Buscar cliente por nome ou email</label>
                      <input
                        id="busca-clientes"
                        type="text"
                        className="form-control"
                        placeholder="Digite para filtrar..."
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                      />
                    </div>
                    <div className="col-md-4 mt-3 mt-md-0">
                      <small className="text-muted d-block">
                        {searchTerm.trim()
                          ? `${clientesFiltrados.length} resultado(s) encontrado(s)`
                          : `Mostrando os 5 clientes mais recentes de ${clientesOrdenados.length}`}
                      </small>
                    </div>
                  </div>
                  {loading ? (
                    <div className="text-center">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Carregando...</span>
                      </div>
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-striped">
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Email</th>
                            <th>Data de Cadastro</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientesFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="text-center">
                                Nenhum cliente encontrado
                              </td>
                            </tr>
                          ) : (
                            clientesFiltrados.map((cliente) => (
                              <tr key={cliente.id}>
                                <td>{cliente.name}</td>
                                <td>{cliente.email}</td>
                                <td>{new Date(cliente.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-info me-2"
                                    onClick={() => abrirModal(cliente, 'view')}
                                  >
                                    <i className="fas fa-eye"></i> Ver
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-warning me-2"
                                    onClick={() => abrirModal(cliente, 'edit')}
                                  >
                                    <i className="fas fa-edit"></i> Editar
                                  </button>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-danger"
                                    onClick={() => handleExcluirCliente(cliente)}
                                    disabled={deletingId === cliente.id}
                                  >
                                    {deletingId === cliente.id ? (
                                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                                    ) : (
                                      <i className="fas fa-trash"></i>
                                    )}
                                    <span className="ms-1">Excluir</span>
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {modalMode && clienteSelecionado ? (
          <div
            className="modal fade show d-block"
            tabIndex={-1}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={fecharModal}
          >
            <div className="modal-dialog" onClick={(event) => event.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    {modalMode === 'view' ? 'Detalhes do Cliente' : 'Editar Cliente'}
                  </h5>
                  <button type="button" className="btn-close" aria-label="Fechar" onClick={fecharModal}></button>
                </div>
                {modalMode === 'view' ? (
                  <div className="modal-body">
                    <dl className="row mb-0">
                      <dt className="col-sm-4">Nome</dt>
                      <dd className="col-sm-8">{clienteSelecionado.name || '—'}</dd>
                      <dt className="col-sm-4">Email</dt>
                      <dd className="col-sm-8">{clienteSelecionado.email || '—'}</dd>
                      <dt className="col-sm-4">Criado em</dt>
                      <dd className="col-sm-8">{new Date(clienteSelecionado.createdAt).toLocaleString('pt-BR')}</dd>
                      {clienteSelecionado.lojaId ? (
                        <>
                          <dt className="col-sm-4">Loja</dt>
                          <dd className="col-sm-8">{clienteSelecionado.lojaId}</dd>
                        </>
                      ) : null}
                    </dl>

                    <div className="mt-4 pt-3 border-top">
                      <h6 className="mb-3">Histórico de Compras</h6>

                      {carregandoVendas ? (
                        <div className="text-center py-3">
                          <div className="spinner-border" role="status">
                            <span className="visually-hidden">Carregando compras...</span>
                          </div>
                        </div>
                      ) : clienteVendas.length === 0 ? (
                        <div className="alert alert-secondary mb-0">
                          Nenhuma compra encontrada para este cliente.
                        </div>
                      ) : (
                        <div className="list-group">
                          {clienteVendas.map((venda) => (
                            <div key={venda.id} className="list-group-item list-group-item-action flex-column align-items-start">
                              <div className="d-flex w-100 justify-content-between">
                                <h6 className="mb-1">Venda #{venda.id}</h6>
                                <small className="text-muted">{new Date(venda.createdAt).toLocaleString('pt-BR')}</small>
                              </div>
                              <p className="mb-1">
                                <strong>Valor do seguro:</strong> {formatCurrency(Number(venda.valorSeguro) || 0)}
                              </p>
                              <div className="d-flex flex-wrap gap-3 small text-muted">
                                <span><strong>Status:</strong> {venda.status}</span>
                                {typeof venda.valorComissao === 'number' ? (
                                  <span><strong>Comissão:</strong> {formatCurrency(Number(venda.valorComissao) || 0)}</span>
                                ) : null}
                                {typeof venda.valorTaxa === 'number' && Number(venda.valorTaxa) > 0 ? (
                                  <span><strong>Taxas:</strong> {formatCurrency(Number(venda.valorTaxa) || 0)}</span>
                                ) : null}
                                {venda.metodoPagamento ? (
                                  <span><strong>Pagamento:</strong> {venda.metodoPagamento}</span>
                                ) : null}
                                {venda.tipoCotacaoLoja?.nome ? (
                                  <span><strong>Plano:</strong> {venda.tipoCotacaoLoja.nome}</span>
                                ) : null}
                                {venda.vendedor?.nome ? (
                                  <span><strong>Vendedor:</strong> {venda.vendedor.nome}</span>
                                ) : null}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSalvarCliente}>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label htmlFor="modal-nome" className="form-label">Nome</label>
                        <input
                          id="modal-nome"
                          name="name"
                          type="text"
                          className="form-control"
                          value={modalForm.name}
                          onChange={handleModalInputChange}
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label htmlFor="modal-email" className="form-label">Email</label>
                        <input
                          id="modal-email"
                          name="email"
                          type="email"
                          className="form-control"
                          value={modalForm.email}
                          onChange={handleModalInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="button" className="btn btn-secondary" onClick={fecharModal} disabled={saving}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={saving}>
                        {saving ? (
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        ) : (
                          <i className="fas fa-save me-1"></i>
                        )}
                        {saving ? ' Salvando...' : ' Salvar'}
                      </button>
                    </div>
                  </form>
                )}
                {modalMode === 'view' ? (
                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={fecharModal}>
                      Fechar
                    </button>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
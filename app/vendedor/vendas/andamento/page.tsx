'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../../components/DashboardLayout'
import ProtectedRoute from '../../../../components/ProtectedRoute'
import { Role } from '../../../../types/auth'
import { useAuth } from '../../../../stories/authStore'
import { API_BASE_URL } from '../../../../lib/api'
import Link from 'next/link'
import { formatCurrency } from '../../../../lib/formatters'
import { useToast } from '../../../../stories/toastStore'

export default function VendasAndamento() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  const carregarVendas = async () => {
    if (!token) return

    try {
      setLoading(true)
      const response = await axios.get(`${API_BASE_URL}/api/vendas/vendedor/vendas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      const vendasAndamento = response.data.filter((v: any) => 
        v.status === 'pendente' || v.status === 'em_atendimento'
      )
      setVendas(vendasAndamento)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
      showToast('Erro ao carregar vendas', 'error')
    } finally {
      setLoading(false)
    }
  }

  const confirmarVenda = async (id: number) => {
    if (!token) return

    const venda = vendas.find(v => v.id === id)
    if (!venda?.placa || venda.placa.trim() === '') {
      const params = new URLSearchParams()
      if (venda?.clienteId) params.append('clienteId', venda.clienteId)
      if (venda?.clienteTelefone) params.append('telefone', venda.clienteTelefone)
      if (venda?.tipoVeiculo) params.append('tipoVeiculo', venda.tipoVeiculo)
      if (venda?.marca) params.append('marca', venda.marca)
      if (venda?.modelo) params.append('modelo', venda.modelo)
      if (venda?.ano) params.append('ano', venda.ano)
      if (venda?.valorVeiculo) params.append('valorVeiculo', venda.valorVeiculo.toString())
      
      window.location.href = `/vendedor/nova-venda?${params.toString()}`
      return
    }

    try {
      setActionLoadingId(id)
      await axios.patch(
        `${API_BASE_URL}/api/vendas/${id}/confirmar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      showToast('Venda confirmada com sucesso!', 'success')
      carregarVendas()
    } catch (error) {
      console.error('Erro ao confirmar venda:', error)
      showToast('Erro ao confirmar venda', 'error')
    } finally {
      setActionLoadingId(null)
    }
  }

  useEffect(() => {
    if (token) {
      carregarVendas()
      const interval = setInterval(carregarVendas, 30000)
      return () => clearInterval(interval)
    }
  }, [token])

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title="Vendas em Andamento">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                <h6>Vendas em Andamento</h6>
                <span className="badge bg-gradient-info">{vendas.length} vendas</span>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Carregando...</span>
                    </div>
                  </div>
                ) : vendas.length === 0 ? (
                  <div className="text-center py-4">
                    <i className="fas fa-check-circle text-success" style={{ fontSize: '3rem' }}></i>
                    <p className="mt-3 text-muted">Nenhuma venda em andamento</p>
                    <Link href="/vendedor/nova-venda" className="btn btn-primary mt-2">
                      <i className="fas fa-plus me-2"></i>Nova Venda
                    </Link>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th>Cliente</th>
                          <th>Veículo</th>
                          <th>Valor</th>
                          <th>Status</th>
                          <th>Prazo</th>
                          <th className="text-center">Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {vendas.map((venda: any) => (
                          <tr key={venda.id}>
                            <td>
                              <div>
                                <h6 className="mb-0">{venda.cliente?.name}</h6>
                                <small className="text-muted">{venda.clienteTelefone || 'Sem telefone'}</small>
                              </div>
                            </td>
                            <td>
                              <div>
                                <h6 className="mb-0">{venda.marca} {venda.modelo}</h6>
                                <small className="text-muted">{venda.ano}</small>
                              </div>
                            </td>
                            <td>{formatCurrency(venda.valorSeguro)}</td>
                            <td>
                              <span className={`badge badge-sm ${
                                venda.status === 'em_atendimento' ? 'bg-gradient-info' : 'bg-gradient-warning'
                              }`}>
                                {venda.status === 'em_atendimento' ? 'Em Atendimento' : 'Pendente'}
                              </span>
                            </td>
                            <td>
                              {venda.prazoContato ? (
                                <small className="text-muted">
                                  {new Date(venda.prazoContato) > new Date() ? (
                                    <>{new Date(venda.prazoContato).toLocaleString('pt-BR')}</>
                                  ) : (
                                    <span className="text-danger">Expirado</span>
                                  )}
                                </small>
                              ) : (
                                <small className="text-muted">-</small>
                              )}
                            </td>
                            <td className="text-center">
                              <div className="d-inline-flex gap-2">
                                <Link href={`/vendedor/vendas/${venda.id}/editar`} className="btn btn-link text-primary p-0">
                                  <i className="fas fa-pen"></i>
                                </Link>
                                <button
                                  type="button"
                                  className="btn btn-success btn-sm px-2"
                                  onClick={() => confirmarVenda(venda.id)}
                                  disabled={actionLoadingId === venda.id}
                                >
                                  {actionLoadingId === venda.id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <i className="fas fa-check"></i>
                                  )}
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}

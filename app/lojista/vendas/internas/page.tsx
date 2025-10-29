'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import ProtectedRoute from '../../../../components/ProtectedRoute'
import { Role } from '../../../../types/auth'
import { useAuth } from '../../../../stories/authStore'
import { API_BASE_URL } from '../../../../lib/api'
import { formatCurrency } from '../../../../lib/formatters'

export default function VendasInternasPage() {
  const { token } = useAuth()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarVendas()
  }, [])

  const carregarVendas = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lojas/me/vendas/internas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setVendas(data)
      }
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      'pendente': 'bg-warning',
      'em_atendimento': 'bg-info',
      'confirmada': 'bg-success',
      'cancelada': 'bg-danger'
    }
    return badges[status as keyof typeof badges] || 'bg-secondary'
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
        <DashboardLayout title="Vendas Internas">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
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
      <DashboardLayout title="Vendas Internas">
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-users me-2"></i>
              Vendas dos Vendedores Internos
            </h5>
            <span className="badge bg-primary">{vendas.length} vendas</span>
          </div>
          <div className="card-body">
            {vendas.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Nenhuma venda interna encontrada</h5>
                <p className="text-muted">Vendas realizadas pelos vendedores da sua loja aparecerão aqui.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Vendedor</th>
                      <th>Veículo</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((venda) => (
                      <tr key={venda.id}>
                        <td>
                          <div>
                            <strong>{venda.cliente?.name || 'N/A'}</strong>
                            <br />
                            <small className="text-muted">{venda.cliente?.email}</small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{venda.vendedor?.nome}</strong>
                            <br />
                            <small className="text-success">
                              <i className="fas fa-user-tie me-1"></i>
                              Interno
                            </small>
                          </div>
                        </td>
                        <td>
                          <div>
                            <strong>{venda.marca} {venda.modelo}</strong>
                            <br />
                            <small className="text-muted">{venda.ano}</small>
                          </div>
                        </td>
                        <td>
                          <strong>{formatCurrency(venda.valorSeguro)}</strong>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(venda.status)}`}>
                            {venda.status}
                          </span>
                        </td>
                        <td>
                          {new Date(venda.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
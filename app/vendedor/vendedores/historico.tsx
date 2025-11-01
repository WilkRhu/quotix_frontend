import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import { formatCurrency } from '../../../lib/formatters'

export default function HistoricoVendasAprovadas() {
  const { token } = useAuth()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    setLoading(true)
    fetch(`${API_BASE_URL}/api/vendedor/vendas`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setVendas(Array.isArray(data) ? data.filter(v => v.status === 'confirmada') : [])
      })
      .finally(() => setLoading(false))
  }, [token])

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title="Histórico de Vendas Aprovadas">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Veículo</th>
                <th>Valor</th>
                <th>Vendedor</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {vendas.map((venda: any) => (
                <tr key={venda.id}>
                  <td>{venda.cliente?.name || 'Cliente'}</td>
                  <td>{venda.tipoVeiculo} {venda.marca} {venda.modelo}</td>
                  <td>{formatCurrency(venda.valorSeguro)}</td>
                  <td>{venda.vendedor?.nome || venda.vendedor?.name || 'Não atribuído'}</td>
                  <td>{new Date(venda.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-center mt-4">
          <Link href="/vendedor/vendedores" className="btn btn-outline-secondary">
            Voltar
          </Link>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}

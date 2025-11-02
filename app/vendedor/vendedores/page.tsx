import { useState, useEffect } from 'react'
import Link from 'next/link'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import { formatCurrency } from '../../../lib/formatters'

export default function VendedoresAprovados() {
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

  const cards = vendas.slice(0, 3)

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title="Vendas Aprovadas">
        <div className="row mb-4">
          {cards.map((venda: any) => (
            <div className="col-md-4 mb-3" key={venda.id}>
              <div className="card h-100">
                <div className="card-body">
                  <h6 className="card-title">{venda.cliente?.name || 'Cliente'}</h6>
                  <p className="mb-1"><strong>Veículo:</strong> {venda.tipoVeiculo} {venda.marca} {venda.modelo}</p>
                  <p className="mb-1"><strong>Valor:</strong> {formatCurrency(venda.valorSeguro)}</p>
                  <p className="mb-1"><strong>Vendedor:</strong> {venda.vendedor?.nome || venda.vendedor?.name || 'Não atribuído'}</p>
                  <p className="mb-1"><strong>Data:</strong> {new Date(venda.createdAt).toLocaleDateString('pt-BR')}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="text-center mb-4">
          <Link href="/vendedor/vendedores/historico" className="btn btn-outline-primary">
            Ver mais
          </Link>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
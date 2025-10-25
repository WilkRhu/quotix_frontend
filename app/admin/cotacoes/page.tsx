'use client'

import { useState } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'

export default function GestaoCotacoes() {
  const [cotacoes, setCotacoes] = useState([])

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <DashboardLayout title="Gestão de Cotações">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Cotações Solicitadas</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Veículo</th>
                        <th>Valor FIPE</th>
                        <th>Data</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cotacoes.map((cotacao: any) => (
                        <tr key={cotacao.id}>
                          <td>
                            <div>
                              <h6 className="mb-0">{cotacao.cliente?.name}</h6>
                              <small className="text-muted">{cotacao.cliente?.email}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <h6 className="mb-0">{cotacao.marca} {cotacao.modelo}</h6>
                              <small className="text-muted">{cotacao.ano}</small>
                            </div>
                          </td>
                          <td>{cotacao.valorFipe}</td>
                          <td>{new Date(cotacao.createdAt).toLocaleDateString()}</td>
                          <td>
                            <span className={`badge badge-sm ${
                              cotacao.status === 'pendente' ? 'bg-gradient-warning' :
                              cotacao.status === 'processada' ? 'bg-gradient-info' :
                              'bg-gradient-success'
                            }`}>
                              {cotacao.status}
                            </span>
                          </td>
                          <td>
                            <button className="btn btn-link text-dark p-0 me-2">
                              <i className="fas fa-eye"></i>
                            </button>
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}
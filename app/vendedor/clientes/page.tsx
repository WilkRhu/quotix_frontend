'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { api } from '../../../lib/api'
import { useToast } from '../../../stories/toastStore'

export default function ClientesVendedorPage() {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [clientes, setClientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    carregarClientes()
  }, [])

  const carregarClientes = async () => {
    try {
      const response = await api.get('/api/users/clientes')
      setClientes(response.data)
    } catch (error) {
      console.error('Erro ao carregar clientes:', error)
      showToast('Erro ao carregar clientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = clientes.filter(cliente =>
    cliente.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cliente.email?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h4 className="card-title mb-0">
                    <i className="fas fa-users me-2"></i>
                    Meus Clientes
                  </h4>
                  <button
                    type="button"
                    className="btn btn-light btn-sm"
                    onClick={() => router.push('/vendedor/cadastrar-cliente')}
                  >
                    <i className="fas fa-plus me-2"></i>
                    Novo Cliente
                  </button>
                </div>
                <div className="card-body">
                  <div className="row mb-4">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Buscar por nome ou email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="text-center py-5">
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
                            <th>Telefone</th>
                            <th>Documentos</th>
                            <th>Data Cadastro</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientesFiltrados.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="text-center py-4">
                                {searchTerm ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}
                              </td>
                            </tr>
                          ) : (
                            clientesFiltrados.map((cliente) => (
                              <tr key={cliente.id}>
                                <td>{cliente.name}</td>
                                <td>{cliente.email}</td>
                                <td>{cliente.telefone || '-'}</td>
                                <td>
                                  {cliente.documentosValidados ? (
                                    <span className="badge bg-success">
                                      <i className="fas fa-check me-1"></i>
                                      Validados
                                    </span>
                                  ) : (
                                    <span className="badge bg-warning">
                                      <i className="fas fa-clock me-1"></i>
                                      Pendentes
                                    </span>
                                  )}
                                </td>
                                <td>{new Date(cliente.createdAt).toLocaleDateString('pt-BR')}</td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary"
                                    onClick={() => router.push(`/vendedor/clientes/${cliente.id}/editar`)}
                                  >
                                    <i className="fas fa-edit"></i> Editar
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}
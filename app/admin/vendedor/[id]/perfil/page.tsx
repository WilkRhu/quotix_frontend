'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import axios from 'axios'
import DashboardLayout from '../../../../../components/DashboardLayout'
import ProtectedRoute from '../../../../../components/ProtectedRoute'
import { Role } from '../../../../../types/auth'
import { useAuth } from '@/stories/authStore'
import { API_BASE_URL } from '../../../../../lib/api'

export default function PerfilVendedorAdmin() {
  const { token } = useAuth()
  const params = useParams() as { id?: string } | null
  const vendedorId = params?.id
  const [vendedor, setVendedor] = useState<any>(null)
  const [vendas, setVendas] = useState([])
  const [estatisticas, setEstatisticas] = useState({
    vendasMes: 0,
    comissaoMes: 0,
    vendasTotal: 0,
    comissaoTotal: 0
  })

  const carregarVendedor = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lojas/vendedores/${vendedorId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendedor(response.data)
    } catch (error) {
      console.error('Erro ao carregar vendedor:', error)
    }
  }

  const carregarVendas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lojas/vendedores/${vendedorId}/vendas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendas(response.data)
    } catch (error) {
      console.error('Erro ao carregar vendas:', error)
    }
  }

  const carregarEstatisticas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lojas/vendedores/${vendedorId}/estatisticas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setEstatisticas(response.data)
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error)
    }
  }

  useEffect(() => {
    if (token && vendedorId) {
      carregarVendedor()
      carregarVendas()
      carregarEstatisticas()
    }
  }, [token, vendedorId])

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <DashboardLayout title={`Perfil - ${vendedor?.nome || 'Vendedor'}`}>
        <div className="row">
          <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Vendas do Mês</p>
                      <h5 className="font-weight-bolder mb-0">
                        {estatisticas.vendasMes}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                      <i className="ni ni-money-coins text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Comissão do Mês</p>
                      <h5 className="font-weight-bolder mb-0">
                        R$ {estatisticas.comissaoMes.toFixed(2).replace('.', ',')}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-success shadow text-center border-radius-md">
                      <i className="ni ni-world text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6 mb-xl-0 mb-4">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Total de Vendas</p>
                      <h5 className="font-weight-bolder mb-0">
                        {estatisticas.vendasTotal}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-info shadow text-center border-radius-md">
                      <i className="ni ni-chart-bar-32 text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-xl-3 col-sm-6">
            <div className="card">
              <div className="card-body p-3">
                <div className="row">
                  <div className="col-8">
                    <div className="numbers">
                      <p className="text-sm mb-0 text-capitalize font-weight-bold">Comissão Total</p>
                      <h5 className="font-weight-bolder mb-0">
                        R$ {estatisticas.comissaoTotal.toFixed(2).replace('.', ',')}
                      </h5>
                    </div>
                  </div>
                  <div className="col-4 text-end">
                    <div className="icon icon-shape bg-gradient-warning shadow text-center border-radius-md">
                      <i className="ni ni-cart text-lg opacity-10"></i>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-lg-8 mb-lg-0 mb-4">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Vendas do Vendedor</h6>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Veículo</th>
                        <th>Valor</th>
                        <th>Comissão</th>
                        <th>Status</th>
                        <th>Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendas.map((venda: any) => (
                        <tr key={venda.id}>
                          <td>
                            <div>
                              <h6 className="mb-0">{venda.cliente?.name}</h6>
                              <small className="text-muted">{venda.cliente?.email}</small>
                            </div>
                          </td>
                          <td>
                            <div>
                              <h6 className="mb-0">{venda.marca} {venda.modelo}</h6>
                              <small className="text-muted">{venda.ano}</small>
                            </div>
                          </td>
                          <td>R$ {venda.valorSeguro}</td>
                          <td>R$ {venda.valorComissao}</td>
                          <td>
                            <span className={`badge badge-sm ${
                              venda.status === 'confirmada' ? 'bg-gradient-success' :
                              venda.status === 'pendente' ? 'bg-gradient-warning' :
                              'bg-gradient-danger'
                            }`}>
                              {venda.status}
                            </span>
                          </td>
                          <td>{new Date(venda.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Dados do Vendedor</h6>
              </div>
              <div className="card-body">
                {vendedor && (
                  <>
                    <div className="text-center mb-4">
                      {vendedor.foto ? (
                        <img 
                          src={`${API_BASE_URL}/uploads/vendedores/fotos/${vendedor.foto}`}
                          alt="Foto"
                          className="rounded-circle mb-3"
                          style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                        />
                      ) : (
                        <div 
                          className="bg-gradient-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                          style={{ width: '100px', height: '100px' }}
                        >
                          <i className="fas fa-user text-white fa-3x"></i>
                        </div>
                      )}
                      <h5>{vendedor.nome}</h5>
                      <p className="text-muted">{vendedor.loja?.nome}</p>
                      <span className={`badge ${vendedor.ativo ? 'bg-gradient-success' : 'bg-gradient-secondary'}`}>
                        {vendedor.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                    <div className="row">
                      <div className="col-12 mb-2">
                        <strong>Email:</strong> {vendedor.email}
                      </div>
                      <div className="col-12 mb-2">
                        <strong>Telefone:</strong> {vendedor.telefone}
                      </div>
                      <div className="col-12 mb-2">
                        <strong>CPF:</strong> {vendedor.cpf}
                      </div>
                      {vendedor.nisPis && (
                        <div className="col-12 mb-2">
                          <strong>NIS/PIS:</strong> {vendedor.nisPis}
                        </div>
                      )}
                      <div className="col-12 mb-2">
                        <strong>Endereço:</strong> {vendedor.endereco}, {vendedor.numero}
                      </div>
                      {vendedor.complemento && (
                        <div className="col-12 mb-2">
                          <strong>Complemento:</strong> {vendedor.complemento}
                        </div>
                      )}
                      <div className="col-12 mb-2">
                        <strong>Cidade:</strong> {vendedor.cidade}/{vendedor.estado}
                      </div>
                      <div className="col-12 mb-2">
                        <strong>CEP:</strong> {vendedor.cep}
                      </div>
                      {vendedor.salarioBase && (
                        <div className="col-12 mb-2">
                          <strong>Salário Base:</strong> R$ {Number(vendedor.salarioBase).toFixed(2).replace('.', ',')}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
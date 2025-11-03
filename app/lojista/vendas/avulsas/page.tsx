'use client'

import { useState, useEffect } from 'react'
import DashboardLayout from '../../../../components/DashboardLayout'
import ProtectedRoute from '../../../../components/ProtectedRoute'
import { Role } from '../../../../types/auth'
import { useAuth } from '../../../../stories/authStore'
import { formatCurrency } from '../../../../lib/formatters'
import { API_BASE_URL } from '@/lib/api'

export default function VendasAvulsasPage() {
  const { token } = useAuth()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [vendaSelecionada, setVendaSelecionada] = useState<any>(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    carregarVendas()
  }, [])

  const carregarVendas = async () => {
    try {
      if (!token) {
        setErro('Token de autenticação não encontrado. Faça login novamente.')
        setLoading(false)
        return
      }
      const response = await fetch(`${API_BASE_URL}/api/lojas/me/vendas/avulsas`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })
      if (response.ok) {
        const data = await response.json()
        setVendas(data)
      } else {
        const errorText = await response.text()
        setErro(`Erro na resposta da API: ${response.status} - ${errorText}`)
      }
    } catch (error: any) {
      setErro(`Erro ao carregar vendas: ${error?.message || error}`)
    } finally {
      setLoading(false)
    }
  }

  const abrirDetalhes = (venda: any) => {
    setVendaSelecionada(venda)
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
      <ProtectedRoute>
        <DashboardLayout title="Vendas Avulsas">
          {erro && (
            <div className="alert alert-danger mt-3" role="alert">
              {erro}
            </div>
          )}
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
    <ProtectedRoute>
      <DashboardLayout title="Vendas Avulsas">
        {erro && (
          <div className="alert alert-danger mt-3" role="alert">
            {erro}
          </div>
        )}
        <div className="card">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <i className="fas fa-user-friends me-2"></i>
              Vendas dos Vendedores Avulsos
            </h5>
            <span className="badge bg-info">{vendas.length} vendas</span>
          </div>
          <div className="card-body">
            {vendas.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-user-plus fa-3x text-muted mb-3"></i>
                <h5 className="text-muted">Nenhuma venda avulsa encontrada</h5>
                <p className="text-muted">
                  Vendas realizadas por vendedores independentes aparecerão aqui.
                </p>
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
                      <th>Comissão</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendas.map((venda) => (
                      <tr key={venda.id}>
                        <td>
                          <strong>{venda.cliente?.name || 'N/A'}</strong>
                          <br />
                          <small className="text-muted">{venda.cliente?.email}</small>
                        </td>
                        <td>
                          <strong>{venda.vendedor?.nome}</strong>
                          <br />
                          <small className="text-info">Avulso</small>
                        </td>
                        <td>
                          <strong>{venda.marca} {venda.modelo}</strong>
                          <br />
                          <small className="text-muted">{venda.ano}</small>
                        </td>
                        <td>
                          <strong>{formatCurrency(venda.valorSeguro)}</strong>
                        </td>
                        <td>
                          <strong className="text-success">
                            {formatCurrency(venda.valorComissao)}
                          </strong>
                          <br />
                          <small className="text-muted">
                            {venda.percentualComissao}%
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(venda.status)}`}>
                            {venda.status}
                          </span>
                        </td>
                        <td>
                          {new Date(venda.createdAt).toLocaleDateString('pt-BR')}
                        </td>
                        <td>
                          <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => abrirDetalhes(venda)}
                          >
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {vendaSelecionada && (
          <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    Detalhes da Venda #{vendaSelecionada.id}
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => setVendaSelecionada(null)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="row">
                    {/* Informações do Cliente */}
                    <div className="col-md-6 mb-4">
                      <h6 className="text-primary"><i className="fas fa-user me-2"></i>Cliente</h6>
                      <p className="mb-1"><strong>{vendaSelecionada.cliente?.name}</strong></p>
                      <p className="mb-1 text-muted"><i className="fas fa-envelope me-1"></i>{vendaSelecionada.cliente?.email}</p>
                      {vendaSelecionada.cliente?.telefone && (
                        <p className="mb-1 text-muted"><i className="fas fa-phone me-1"></i>{vendaSelecionada.cliente?.telefone}</p>
                      )}
                      {vendaSelecionada.cliente?.cpf && (
                        <p className="mb-0 text-muted"><i className="fas fa-id-card me-1"></i>{vendaSelecionada.cliente?.cpf}</p>
                      )}
                    </div>

                    {/* Informações do Vendedor */}
                    <div className="col-md-6 mb-4">
                      <h6 className="text-primary"><i className="fas fa-user-tie me-2"></i>Vendedor Avulso</h6>
                      <p className="mb-1"><strong>{vendaSelecionada.vendedor?.nome}</strong></p>
                      {vendaSelecionada.vendedor?.email && (
                        <p className="mb-1 text-muted"><i className="fas fa-envelope me-1"></i>{vendaSelecionada.vendedor?.email}</p>
                      )}
                      {vendaSelecionada.vendedor?.telefone && (
                        <p className="mb-1 text-muted"><i className="fas fa-phone me-1"></i>{vendaSelecionada.vendedor?.telefone}</p>
                      )}
                      <span className="badge bg-info">Vendedor Independente</span>
                    </div>

                    {/* Informações do Veículo */}
                    <div className="col-md-6 mb-4">
                      <h6 className="text-primary"><i className="fas fa-car me-2"></i>Veículo</h6>
                      <p className="mb-1"><strong>{vendaSelecionada.marca} {vendaSelecionada.modelo}</strong></p>
                      <p className="mb-1 text-muted">Ano: {vendaSelecionada.ano}</p>
                      {vendaSelecionada.placa && (
                        <p className="mb-1 text-muted">Placa: {vendaSelecionada.placa}</p>
                      )}
                      {vendaSelecionada.valorVeiculo && (
                        <p className="mb-0 text-muted">Valor FIPE: {formatCurrency(vendaSelecionada.valorVeiculo)}</p>
                      )}
                    </div>

                    {/* Informações do Seguro */}
                    <div className="col-md-6 mb-4">
                      <h6 className="text-primary"><i className="fas fa-shield-alt me-2"></i>Seguro</h6>
                      {vendaSelecionada.seguradora && (
                        <p className="mb-1"><strong>Seguradora:</strong> {vendaSelecionada.seguradora}</p>
                      )}
                      {vendaSelecionada.tipoCobertura && (
                        <p className="mb-1">Cobertura: {vendaSelecionada.tipoCobertura}</p>
                      )}
                      <p className="mb-1"><strong>Valor do Prêmio:</strong> {formatCurrency(vendaSelecionada.valorSeguro)}</p>
                      {vendaSelecionada.vigenciaInicio && vendaSelecionada.vigenciaFim && (
                        <p className="mb-0 text-muted">Vigência: {new Date(vendaSelecionada.vigenciaInicio).toLocaleDateString('pt-BR')} a {new Date(vendaSelecionada.vigenciaFim).toLocaleDateString('pt-BR')}</p>
                      )}
                    </div>

                    {/* Valores e Comissão */}
                    <div className="col-md-6 mb-4">
                      <h6 className="text-primary"><i className="fas fa-dollar-sign me-2"></i>Valores</h6>
                      <p className="mb-1"><strong>Comissão:</strong> <span className="text-success">{formatCurrency(vendaSelecionada.valorComissao)}</span></p>
                      <p className="mb-1">Percentual: {vendaSelecionada.percentualComissao}%</p>
                      {vendaSelecionada.metodoPagamento && (
                        <p className="mb-1">Pagamento: {vendaSelecionada.metodoPagamento}</p>
                      )}
                      {vendaSelecionada.parcelas && vendaSelecionada.parcelas > 1 && (
                        <p className="mb-0 text-muted">{vendaSelecionada.parcelas}x de {formatCurrency(vendaSelecionada.valorSeguro / vendaSelecionada.parcelas)}</p>
                      )}
                    </div>

                    {/* Status e Datas */}
                    <div className="col-md-6 mb-4">
                      <h6 className="text-primary"><i className="fas fa-info-circle me-2"></i>Status</h6>
                      <p className="mb-2">
                        <span className={`badge ${getStatusBadge(vendaSelecionada.status)} fs-6`}>
                          {vendaSelecionada.status.toUpperCase()}
                        </span>
                      </p>
                      <p className="mb-1 text-muted"><strong>Criado em:</strong> {new Date(vendaSelecionada.createdAt).toLocaleString('pt-BR')}</p>
                      {vendaSelecionada.dataAssinaturaContrato && (
                        <p className="mb-1 text-muted"><strong>Contrato assinado:</strong> {new Date(vendaSelecionada.dataAssinaturaContrato).toLocaleString('pt-BR')}</p>
                      )}
                      <p className="mb-0">
                        <i className={`fas ${vendaSelecionada.contratoAssinado ? 'fa-check-circle text-success' : 'fa-clock text-warning'} me-1`}></i>
                        {vendaSelecionada.contratoAssinado ? 'Contrato Assinado' : 'Aguardando Assinatura'}
                      </p>
                    </div>

                    {/* Observações */}
                    {vendaSelecionada.observacoes && (
                      <div className="col-12">
                        <h6 className="text-primary"><i className="fas fa-sticky-note me-2"></i>Observações</h6>
                        <div className="alert alert-light">
                          <p className="mb-0">{vendaSelecionada.observacoes}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary" 
                    onClick={() => setVendaSelecionada(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
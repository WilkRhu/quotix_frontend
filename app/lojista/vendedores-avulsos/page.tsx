'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'

export default function VendedoresAvulsosPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [lojaConfig, setLojaConfig] = useState<any>(null)
  const [vendedoresAprovados, setVendedoresAprovados] = useState<any[]>([])

  useEffect(() => {
    carregarDados()
  }, [])

  const carregarDados = async () => {
    await Promise.all([carregarSolicitacoes(), carregarConfigLoja(), carregarVendedoresAprovados()])
  }

  const carregarVendedoresAprovados = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/api/vendedores-avulsos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const vendedores = await response.json()
        setVendedoresAprovados(vendedores)
      }
    } catch (error) {
      console.error('Erro ao carregar vendedores aprovados:', error)
    }
  }

  const carregarConfigLoja = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/lojas/me`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const loja = await response.json()
        setLojaConfig(loja)
      }
    } catch (error) {
      console.error('Erro ao carregar configurações da loja:', error)
    }
  }

  const carregarSolicitacoes = async () => {
    console.log('Carregando solicitações...')
    console.log('Token:', token)
    console.log('URL:', `${API_BASE_URL}/api/vendedores-avulsos/solicitacoes`)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/api/vendedores-avulsos/solicitacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      
      if (response.ok) {
        const data = await response.json()
        console.log('Dados recebidos:', data)
        setSolicitacoes(data)
      } else {
        const errorText = await response.text()
        console.log('Erro response:', errorText)
        setMessage(`Erro ao carregar solicitações: ${response.status}`)
        setMessageType('error')
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
      setMessage('Erro ao carregar solicitações')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const responderSolicitacao = async (solicitacaoId: string, status: 'aprovada' | 'rejeitada', comissaoNegociada?: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/api/vendedores-avulsos/solicitacoes/${solicitacaoId}/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          comissaoNegociada,
          mensagem: status === 'aprovada' ? 'Solicitação aprovada!' : 'Solicitação rejeitada.'
        })
      })

      if (response.ok) {
        setMessage(`Solicitação ${status === 'aprovada' ? 'aprovada' : 'rejeitada'} com sucesso!`)
        setMessageType('success')
        carregarSolicitacoes()
      } else {
        setMessage('Erro ao responder solicitação')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Erro ao responder solicitação:', error)
      setMessage('Erro ao responder solicitação')
      setMessageType('error')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
        <DashboardLayout title="Vendedores Avulsos">
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
      <DashboardLayout title="Vendedores Avulsos">
        {lojaConfig && (
          <div className={`card mb-4 ${lojaConfig.aceitaVendedorAvulso ? 'border-success' : 'border-warning'}`}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-shrink-0">
                  <i className={`fas ${lojaConfig.aceitaVendedorAvulso ? 'fa-check-circle text-success' : 'fa-exclamation-triangle text-warning'} fa-2x`}></i>
                </div>
                <div className="flex-grow-1 ms-3">
                  <h6 className="mb-1">
                    {lojaConfig.aceitaVendedorAvulso ? 'Vendedores Avulsos Ativados' : 'Vendedores Avulsos Desativados'}
                  </h6>
                  <p className="mb-0 text-muted">
                    {lojaConfig.aceitaVendedorAvulso 
                      ? `Sua loja está aceitando vendedores avulsos com comissão de ${lojaConfig.comissaoVendedorAvulso || 5}%`
                      : 'Ative a funcionalidade nas configurações para receber solicitações de vendedores avulsos'
                    }
                  </p>
                  {!lojaConfig.aceitaVendedorAvulso && (
                    <a href="/lojista/configuracoes" className="btn btn-sm btn-primary mt-2">
                      <i className="fas fa-cog me-1"></i>
                      Ir para Configurações
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {vendedoresAprovados.length > 0 && (
          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">
                <i className="fas fa-users me-2"></i>
                Vendedores Avulsos Aprovados
                <span className="badge bg-success ms-2">{vendedoresAprovados.length}</span>
              </h5>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Contato</th>
                      <th>Localização</th>
                      <th>Comissão</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendedoresAprovados.map((vendedor: any) => (
                      <tr key={vendedor.id}>
                        <td>
                          <strong>{vendedor.nome}</strong>
                        </td>
                        <td>
                          <div>
                            <small className="d-block">{vendedor.email}</small>
                            <small className="d-block">{vendedor.telefone}</small>
                          </div>
                        </td>
                        <td>
                          <small>{vendedor.cidade} - {vendedor.estado}</small>
                        </td>
                        <td>
                          <span className="badge bg-info">
                            {vendedor.comissoesNegociadas?.[lojaConfig?.id] || lojaConfig?.comissaoVendedorAvulso || 5}%
                          </span>
                        </td>
                        <td>
                          <span className="badge bg-success">Ativo</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
        
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Solicitações de Vendedores Avulsos
                {solicitacoes.filter(s => s.status === 'pendente').length > 0 && (
                  <span className="badge bg-danger ms-2">
                    {solicitacoes.filter(s => s.status === 'pendente').length}
                  </span>
                )}
              </h5>
            </div>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} mb-4`}>
                <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                {message}
              </div>
            )}

            {solicitacoes.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">Nenhuma solicitação encontrada</h6>
                <p className="text-sm text-muted">Quando vendedores avulsos solicitarem acesso à sua loja, eles aparecerão aqui.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Contato</th>
                      <th>Localização</th>
                      <th>Comissão</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Ações</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitacoes.map((solicitacao: any) => (
                      <React.Fragment key={solicitacao.id}>
                        <tr>
                          <td>
                            <div>
                              <strong>{solicitacao.vendedor?.nome}</strong>
                              {solicitacao.mensagemVendedor && (
                                <small className="d-block text-muted">
                                  "{solicitacao.mensagemVendedor}"
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <small className="d-block">{solicitacao.vendedor?.email}</small>
                              <small className="d-block">{solicitacao.vendedor?.telefone}</small>
                            </div>
                          </td>
                          <td>
                            <small>{solicitacao.vendedor?.cidade} - {solicitacao.vendedor?.estado}</small>
                          </td>
                          <td>
                            <span className="badge bg-info">{solicitacao.comissaoNegociada}%</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              solicitacao.status === 'pendente' ? 'bg-warning' :
                              solicitacao.status === 'aprovada' ? 'bg-success' : 'bg-danger'
                            }`}>
                              {solicitacao.status === 'pendente' ? 'Pendente' :
                               solicitacao.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                            </span>
                          </td>
                          <td>
                            <small>{new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')}</small>
                          </td>
                          <td>
                            {solicitacao.status === 'pendente' && (
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-success btn-sm" 
                                  title="Aprovar"
                                  onClick={() => responderSolicitacao(solicitacao.id, 'aprovada', solicitacao.comissaoNegociada)}
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  title="Rejeitar"
                                  onClick={() => responderSolicitacao(solicitacao.id, 'rejeitada')}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={() => setExpandedRow(expandedRow === solicitacao.id ? null : solicitacao.id)}
                              title="Ver mais informações"
                            >
                              <i className={`fas fa-${expandedRow === solicitacao.id ? 'chevron-up' : 'info-circle'}`}></i>
                            </button>
                          </td>
                        </tr>
                        {expandedRow === solicitacao.id && (
                          <tr>
                            <td colSpan={8}>
                              <div className="card card-body bg-light">
                                <h6 className="mb-3">Informações Detalhadas</h6>
                                <div className="row">
                                  <div className="col-md-3 text-center">
                                    {solicitacao.vendedor?.foto ? (
                                      <img
                                        src={solicitacao.vendedor.foto.startsWith('http')
                                          ? solicitacao.vendedor.foto
                                          : `${API_BASE_URL}${solicitacao.vendedor.foto}`}
                                        alt="Foto do vendedor"
                                        className="rounded-circle shadow-sm"
                                        style={{ width: '120px', height: '120px', objectFit: 'cover', border: '3px solid #764ba2' }}
                                      />
                                    ) : (
                                      <span className="text-muted">Sem foto cadastrada</span>
                                    )}
                                  </div>
                                  <div className="col-md-4">
                                    <div className="mb-2">
                                      <strong>CPF:</strong> {solicitacao.vendedor?.cpf}
                                    </div>
                                    <div className="mb-2">
                                      <strong>CEP:</strong> {solicitacao.vendedor?.cep}
                                    </div>
                                    {solicitacao.vendedor?.nisPis && (
                                      <div className="mb-2">
                                        <strong>NIS/PIS:</strong> {solicitacao.vendedor.nisPis}
                                      </div>
                                    )}
                                  </div>
                                  <div className="col-md-5">
                                    <div className="mb-2">
                                      <strong>Endereço:</strong> {solicitacao.vendedor?.endereco}, {solicitacao.vendedor?.numero}
                                      {solicitacao.vendedor?.complemento && `, ${solicitacao.vendedor.complemento}`}
                                    </div>
                                    {solicitacao.vendedor?.experiencia && (
                                      <div className="mb-2">
                                        <strong>Experiência:</strong> {solicitacao.vendedor.experiencia}
                                      </div>
                                    )}
                                    <div className="mb-2">
                                      <strong>Cadastrado em:</strong> {new Date(solicitacao.vendedor?.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
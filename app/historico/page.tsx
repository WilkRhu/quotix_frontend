'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../components/DashboardLayout'
import ProtectedRoute from '../../components/ProtectedRoute'
import { Role } from '../../types/auth'
import { API_BASE_URL } from '../../lib/api'

export default function Historico() {
  const [cotacoes, setCotacoes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    carregarHistorico()
  }, [])

  const carregarHistorico = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get(`${API_BASE_URL}/ofertas/historico`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      setCotacoes(response.data)
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <ProtectedRoute requiredRoles={[Role.CLIENT]}>
      <DashboardLayout title="Histórico de Cotações">
      <div className="row">
        <div className="col-12">
          <div className="card">
            <div className="card-header pb-0">
              <h6>Suas últimas 5 cotações</h6>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Carregando...</span>
                  </div>
                </div>
              ) : cotacoes.length === 0 ? (
                <div className="text-center py-4">
                  <i className="fas fa-search fa-3x text-muted mb-3"></i>
                  <p className="text-muted">Nenhuma cotação encontrada</p>
                </div>
              ) : (
                <div className="row">
                  {cotacoes.map((cotacao: any) => (
                    <div key={cotacao.id} className="col-md-6 mb-4">
                      <div className="card border">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <h6 className="card-title mb-0">
                              {cotacao.marca} {cotacao.modelo}
                            </h6>
                            <small className="text-muted">
                              {formatarData(cotacao.createdAt)}
                            </small>
                          </div>
                          
                          <div className="mb-3">
                            <p className="text-sm mb-1">
                              <strong>Ano:</strong> {cotacao.ano}
                            </p>
                            <p className="text-sm mb-1">
                              <strong>Valor FIPE:</strong> {cotacao.valorFipe}
                            </p>
                            <p className="text-sm mb-0">
                              <strong>Ofertas:</strong> {(() => {
                                try {
                                  return cotacao.ofertas && typeof cotacao.ofertas === 'string' 
                                    ? JSON.parse(cotacao.ofertas).length 
                                    : (Array.isArray(cotacao.ofertas) ? cotacao.ofertas.length : 0)
                                } catch {
                                  return 0
                                }
                              })()}
                            </p>
                          </div>

                          {(() => {
                            try {
                              const ofertas = cotacao.ofertas && typeof cotacao.ofertas === 'string' 
                                ? JSON.parse(cotacao.ofertas) 
                                : (Array.isArray(cotacao.ofertas) ? cotacao.ofertas : [])
                              
                              return ofertas.length > 0 && (
                                <div className="mb-3">
                                  <small className="text-muted">Ofertas encontradas:</small>
                                  <div className="mt-2">
                                    {ofertas.slice(0, 2).map((oferta: any, idx: number) => (
                                      <div key={idx} className="d-flex justify-content-between align-items-center border rounded p-2 mb-2">
                                        <div>
                                          <strong className="text-primary">{oferta.valorMensal}</strong>
                                          {oferta.taxaAdesao && (
                                            <small className="text-warning d-block">+ {oferta.taxaAdesao}</small>
                                          )}
                                          <small className="text-muted d-block">{oferta.loja.nome}</small>
                                        </div>
                                      </div>
                                    ))}
                                    {ofertas.length > 2 && (
                                      <small className="text-muted">+ {ofertas.length - 2} outras ofertas</small>
                                    )}
                                  </div>
                                </div>
                              )
                            } catch {
                              return null
                            }
                          })()}

                          <button 
                            className="btn btn-outline-primary btn-sm"
                            onClick={() => window.location.href = '/cotacao'}
                          >
                            <i className="fas fa-redo me-1"></i>
                            Cotar novamente
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
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
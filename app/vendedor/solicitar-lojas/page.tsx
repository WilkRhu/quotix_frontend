'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../lib/api';
import { useToast } from '../../../stories/toastStore';
import { useAuth } from '../../../stories/authStore';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Role } from '../../../types/auth';

interface Loja {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  email: string;
  comissao: number;
  status: 'autorizada' | 'pendente' | 'disponivel';
}

export default function SolicitarLojas() {
  const { showToast } = useToast();
  const { token } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  // Modal e estados removidos

  useEffect(() => {
    carregarLojas();
  }, []);

  const carregarLojas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendas-avulso/lojas-disponiveis`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLojas(response.data || []);
    } catch (error) {
      console.error('Erro ao carregar lojas:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarAutorizacao = async (loja: Loja) => {
    try {
      await axios.post(`${API_BASE_URL}/api/vendas-avulso/solicitar-loja`, {
        lojaId: loja.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Solicitação enviada com sucesso!', 'success');
      // Atualiza status da loja para pendente imediatamente
      setLojas((prevLojas) => prevLojas.map((l) =>
        l.id === loja.id ? { ...l, status: 'pendente' } : l
      ));
      carregarLojas();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao enviar solicitação', 'error');
    }
  }

  const cancelarSolicitacao = async (loja: Loja) => {
    try {
      await axios.post(`${API_BASE_URL}/api/vendas-avulso/cancelar-solicitacao`, {
        lojaId: loja.id
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showToast('Solicitação cancelada com sucesso!', 'success');
      // Atualiza status da loja para disponível imediatamente
      setLojas((prevLojas) => prevLojas.map((l) =>
        l.id === loja.id ? { ...l, status: 'disponivel' } : l
      ));
      carregarLojas();
    } catch (error: any) {
      showToast(error.response?.data?.message || 'Erro ao cancelar solicitação', 'error');
    }
  }

  // Função antiga de envio removida

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'autorizada':
        return <span className="badge bg-success">Autorizada</span>;
      case 'pendente':
        return <span className="badge bg-warning">Pendente</span>;
      case 'disponivel':
        return <span className="badge bg-secondary">Disponível</span>;
      default:
        return <span className="badge bg-secondary">{status}</span>;
    }
  };

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout title="Solicitar Autorização para Lojas">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header">
                <h6>Lojas Disponíveis</h6>
                <p className="text-sm mb-0">Solicite autorização para vender em novas lojas</p>
              </div>
              <div className="card-body">
                {loading ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Carregando...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    {lojas.map(loja => (
                      <div key={loja.id} className="col-md-6 col-lg-4 mb-3">
                        <div className="card h-100">
                          <div className="card-body">
                            <div className="d-flex justify-content-between align-items-start mb-2">
                              <h6 className="mb-0">{loja.nome}</h6>
                              {getStatusBadge(loja.status)}
                            </div>
                            <p className="text-sm text-muted mb-2">
                              <i className="fas fa-map-marker-alt me-1"></i>
                              {loja.cidade}/{loja.estado}
                            </p>
                            <p className="text-sm text-muted mb-2">
                              <i className="fas fa-envelope me-1"></i>
                              {loja.email}
                            </p>
                            <p className="text-sm text-success mb-3">
                              <i className="fas fa-percentage me-1"></i>
                              Comissão: {loja.comissao}%
                            </p>
                            {loja.status === 'disponivel' && (
                              <button 
                                className="btn btn-primary btn-sm w-100"
                                onClick={() => solicitarAutorizacao(loja)}
                              >
                                <i className="fas fa-paper-plane me-1"></i>
                                Solicitar Autorização
                              </button>
                            )}
                            {loja.status === 'pendente' && (
                              <div>
                                <div className="alert alert-warning mt-2 mb-2 p-2 text-center">
                                  <i className="fas fa-clock me-1"></i>
                                  Solicitação enviada, aguardando resposta
                                </div>
                                <button 
                                  className="btn btn-outline-danger btn-sm w-100"
                                  onClick={() => cancelarSolicitacao(loja)}
                                >
                                  <i className="fas fa-times me-1"></i>
                                  Cancelar Solicitação
                                </button>
                              </div>
                            )}
                            {loja.status === 'autorizada' && (
                              <button className="btn btn-success btn-sm w-100" disabled>
                                <i className="fas fa-check me-1"></i>
                                Já Autorizado
                              </button>
                            )}
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
  );
}
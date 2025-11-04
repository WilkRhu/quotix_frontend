'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../lib/api';
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
  status: 'autorizada' | 'pendente' | 'disponivel';
}

export default function SolicitarLojas() {
  const { token } = useAuth();
  const [lojas, setLojas] = useState<Loja[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [lojaSelecionada, setLojaSelecionada] = useState<Loja | null>(null);
  const [formData, setFormData] = useState({
    mensagem: '',
    comissaoSolicitada: 5
  });

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

  const abrirModal = (loja: Loja) => {
    setLojaSelecionada(loja);
    setModalAberto(true);
    setFormData({ mensagem: '', comissaoSolicitada: 5 });
  };

  const enviarSolicitacao = async () => {
    if (!lojaSelecionada) return;

    try {
      await axios.post(`${API_BASE_URL}/api/vendas-avulso/solicitar-loja`, {
        lojaId: lojaSelecionada.id,
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('Solicitação enviada com sucesso!');
      setModalAberto(false);
      carregarLojas();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Erro ao enviar solicitação');
    }
  };

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
                            <p className="text-sm text-muted mb-3">
                              <i className="fas fa-envelope me-1"></i>
                              {loja.email}
                            </p>
                            
                            {loja.status === 'disponivel' && (
                              <button 
                                className="btn btn-primary btn-sm w-100"
                                onClick={() => abrirModal(loja)}
                              >
                                <i className="fas fa-paper-plane me-1"></i>
                                Solicitar Autorização
                              </button>
                            )}
                            
                            {loja.status === 'pendente' && (
                              <button className="btn btn-warning btn-sm w-100" disabled>
                                <i className="fas fa-clock me-1"></i>
                                Aguardando Resposta
                              </button>
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

        {/* Modal de Solicitação */}
        {modalAberto && lojaSelecionada && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Solicitar Autorização</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setModalAberto(false)}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <strong>Loja:</strong> {lojaSelecionada.nome}<br/>
                    <strong>Localização:</strong> {lojaSelecionada.cidade}/{lojaSelecionada.estado}
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Comissão Desejada (%)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={formData.comissaoSolicitada}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        comissaoSolicitada: Number(e.target.value)
                      }))}
                      min="0"
                      max="100"
                      step="0.1"
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label className="form-label">Mensagem (opcional)</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={formData.mensagem}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        mensagem: e.target.value
                      }))}
                      placeholder="Apresente-se e explique por que deseja trabalhar com esta loja..."
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setModalAberto(false)}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary"
                    onClick={enviarSolicitacao}
                  >
                    Enviar Solicitação
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  );
}
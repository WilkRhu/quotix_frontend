'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../../lib/api';
import { formatCurrency } from '../../../lib/formatters';
import DashboardLayout from '../../../components/DashboardLayout';
import ProtectedRoute from '../../../components/ProtectedRoute';
import { Role } from '../../../types/auth';
import { useAuth } from '../../../stories/authStore';
import { useToast } from '../../../stories/toastStore';

interface PlanoTemplate {
  id: string;
  nome: string;
  descricao: string;
  preco: number;
  duracaoMeses: number;
  limiteCotacoes?: number;
  ativo: boolean;
  createdAt: string;
}

export default function PlanosTemplatesPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<PlanoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'pago',
    precoMensal: '',
    precoTrimestral: '',
    precoSemestral: '',
    precoAnual: '',
    percentualPlataforma: '',
    limiteCotacoes: '',
    isTrial: false,
    ativo: true,
  });

  useEffect(() => {
    if (token) {
      fetchTemplates();
    }
  }, [token]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/planos-templates`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
      showToast('Erro ao carregar templates', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    const payload = {
      ...formData,
      precoMensal: formData.precoMensal ? parseFloat(formData.precoMensal) : null,
      precoTrimestral: formData.precoTrimestral ? parseFloat(formData.precoTrimestral) : null,
      precoSemestral: formData.precoSemestral ? parseFloat(formData.precoSemestral) : null,
      precoAnual: formData.precoAnual ? parseFloat(formData.precoAnual) : null,
      percentualPlataforma: formData.percentualPlataforma ? parseFloat(formData.percentualPlataforma) : null,
      limiteCotacoes: formData.limiteCotacoes ? parseInt(formData.limiteCotacoes) : null,
    };
    
    try {
      await axios.post(`${API_BASE_URL}/api/planos-templates`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast('Template criado com sucesso!', 'success');
      setShowModal(false);
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'pago',
        precoMensal: '',
        precoTrimestral: '',
        precoSemestral: '',
        precoAnual: '',
        percentualPlataforma: '',
        limiteCotacoes: '',
        isTrial: false,
        ativo: true,
      });
      fetchTemplates();
    } catch (error: any) {
      console.error('Erro ao criar template:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro desconhecido';
      setError(errorMsg);
      showToast('Erro ao criar template: ' + errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, ativo: boolean) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/planos-templates/${id}`, { ativo }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
      showToast('Status atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showToast('Erro ao atualizar status', 'error');
    }
  };

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.ADMIN]}>
        <DashboardLayout>
          <div className="text-center">Carregando...</div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <DashboardLayout>
        <div className="container-fluid py-4">
          <div className="row">
            <div className="col-12">
              <div className="card mb-4">
                <div className="card-header pb-0">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6>Templates de Planos para Vendedores</h6>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => setShowModal(true)}
                    >
                      <i className="fas fa-plus"></i> Novo Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header pb-0">
                  <h6>Lista de Templates</h6>
                </div>
                <div className="card-body">
                  <div className="table-responsive">
                    <table className="table align-items-center mb-0">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Descrição</th>
                          <th>Tipo</th>
                          <th>Preços</th>
                          <th>Limite</th>
                          <th>Status</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templates.map((template) => (
                          <tr key={template.id}>
                            <td>
                              <h6 className="mb-0">{template.nome}</h6>
                            </td>
                            <td>
                              <span className="text-sm" dangerouslySetInnerHTML={{ __html: template.descricao || '' }} />
                            </td>
                            <td>
                              <span className={`badge ${(template as any).tipo === 'parceria' ? 'bg-warning' : 'bg-info'}`}>
                                {(template as any).tipo === 'parceria' ? 'Parceria' : 'Pago'}
                              </span>
                              {(template as any).isTrial && <span className="badge bg-success ms-1">Trial</span>}
                            </td>
                            <td>
                              <div className="text-sm">
                                {(template as any).precoMensal && <div>Mensal: {formatCurrency((template as any).precoMensal)}</div>}
                                {(template as any).precoTrimestral && <div>Trimestral: {formatCurrency((template as any).precoTrimestral)}</div>}
                                {(template as any).precoSemestral && <div>Semestral: {formatCurrency((template as any).precoSemestral)}</div>}
                                {(template as any).precoAnual && <div>Anual: {formatCurrency((template as any).precoAnual)}</div>}
                                {(template as any).percentualPlataforma && <div>Comissão: {(template as any).percentualPlataforma}%</div>}
                              </div>
                            </td>
                            <td>
                              <span className="text-sm">
                                {template.limiteCotacoes ? `${template.limiteCotacoes} cotações` : 'Ilimitado'}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${template.ativo ? 'bg-gradient-success' : 'bg-gradient-secondary'}`}>
                                {template.ativo ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            <td>
                              <button
                                className={`btn btn-sm ${template.ativo ? 'btn-warning' : 'btn-success'}`}
                                onClick={() => toggleStatus(template.id, !template.ativo)}
                              >
                                {template.ativo ? 'Desativar' : 'Ativar'}
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

          {showModal && (
            <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <div className="modal-header">
                    <h5 className="modal-title">Novo Template de Plano</h5>
                    <button 
                      type="button" 
                      className="btn-close"
                      onClick={() => setShowModal(false)}
                    ></button>
                  </div>
                  <form onSubmit={handleSubmit}>
                    <div className="modal-body">
                      {error && (
                        <div className="alert alert-danger">
                          {error}
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="form-label">Nome do Plano</label>
                        <input
                          type="text"
                          className="form-control"
                          value={formData.nome}
                          onChange={(e) => setFormData({...formData, nome: e.target.value})}
                          placeholder="Ex: Plano Básico, Plano Premium"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Descrição</label>
                        <textarea
                          className="form-control"
                          rows={3}
                          value={formData.descricao}
                          onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                          placeholder="Descreva os benefícios e características do plano"
                          required
                        />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Tipo de Plano</label>
                        <select
                          className="form-select"
                          value={formData.tipo}
                          onChange={(e) => setFormData({...formData, tipo: e.target.value})}
                        >
                          <option value="pago">Plano Pago</option>
                          <option value="parceria">Plano Parceria</option>
                        </select>
                      </div>
                      <div className="mb-3">
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={formData.isTrial}
                            onChange={(e) => setFormData({...formData, isTrial: e.target.checked})}
                          />
                          <label className="form-check-label">É um plano trial</label>
                        </div>
                      </div>
                      {formData.tipo === 'pago' && (
                        <>
                          <div className="row">
                            <div className="col-6">
                              <label className="form-label">Preço Mensal (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.precoMensal}
                                onChange={(e) => setFormData({...formData, precoMensal: e.target.value})}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label">Preço Trimestral (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.precoTrimestral}
                                onChange={(e) => setFormData({...formData, precoTrimestral: e.target.value})}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                          <div className="row mt-3">
                            <div className="col-6">
                              <label className="form-label">Preço Semestral (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.precoSemestral}
                                onChange={(e) => setFormData({...formData, precoSemestral: e.target.value})}
                                placeholder="0.00"
                              />
                            </div>
                            <div className="col-6">
                              <label className="form-label">Preço Anual (R$)</label>
                              <input
                                type="number"
                                step="0.01"
                                className="form-control"
                                value={formData.precoAnual}
                                onChange={(e) => setFormData({...formData, precoAnual: e.target.value})}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </>
                      )}
                      {formData.tipo === 'parceria' && (
                        <div className="mb-3">
                          <label className="form-label">Percentual da Plataforma (%)</label>
                          <input
                            type="number"
                            step="0.1"
                            min="0"
                            max="100"
                            className="form-control"
                            value={formData.percentualPlataforma}
                            onChange={(e) => setFormData({...formData, percentualPlataforma: e.target.value})}
                            placeholder="15.0"
                          />
                        </div>
                      )}
                      <div className="mb-3">
                        <label className="form-label">Limite de Cotações (opcional)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={formData.limiteCotacoes}
                          onChange={(e) => setFormData({...formData, limiteCotacoes: e.target.value})}
                          placeholder="Deixe vazio para ilimitado"
                        />
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button 
                        type="button" 
                        className="btn btn-secondary"
                        onClick={() => setShowModal(false)}
                      >
                        Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={submitting}>
                        {submitting ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Criando...
                          </>
                        ) : (
                          'Criar Template'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
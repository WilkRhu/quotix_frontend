'use client';

import { useState, useEffect, useRef } from 'react';
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
  tipo?: 'pago' | 'parceria';
  precoMensal?: number;
  precoTrimestral?: number;
  precoSemestral?: number;
  precoAnual?: number;
  percentualPlataforma?: number;
  isTrial: boolean;
  status: 'ativo' | 'inativo';
  createdAt: string;
}

interface Estatisticas {
  totalPlanos: number;
  planosAtivos: number;
  planosMensais: number;
  planosParceria: number;
  receitaMensal: number;
}

export default function PlanosVendedorPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [templates, setTemplates] = useState<PlanoTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PlanoTemplate | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{show: boolean, template: PlanoTemplate | null}>({show: false, template: null});
  const [showEditor, setShowEditor] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    tipo: 'pago' as 'pago' | 'parceria',
    precoMensal: '',
    precoTrimestral: '',
    precoSemestral: '',
    precoAnual: '',
    percentualPlataforma: '',
    isTrial: false,
  });

  useEffect(() => {
    if (token) {
      fetchTemplates();
    }
  }, [token]);

  const fetchTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/planos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTemplates(response.data);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    
    const payload = {
      nome: formData.nome,
      descricao: formData.descricao || undefined,
      tipo: formData.tipo,
      precoMensal: formData.precoMensal ? parseFloat(formData.precoMensal) : undefined,
      precoTrimestral: formData.precoTrimestral ? parseFloat(formData.precoTrimestral) : undefined,
      precoSemestral: formData.precoSemestral ? parseFloat(formData.precoSemestral) : undefined,
      precoAnual: formData.precoAnual ? parseFloat(formData.precoAnual) : undefined,
      percentualPlataforma: formData.percentualPlataforma ? parseFloat(formData.percentualPlataforma) : undefined,
      isTrial: formData.isTrial,
    };
    
    try {
      if (editingTemplate) {
        await axios.patch(`${API_BASE_URL}/api/planos/${editingTemplate.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Template atualizado com sucesso!', 'success');
      } else {
        await axios.post(`${API_BASE_URL}/api/planos`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast('Template criado com sucesso!', 'success');
      }
      
      setShowModal(false);
      setEditingTemplate(null);
      setFormData({
        nome: '',
        descricao: '',
        tipo: 'pago',
        precoMensal: '',
        precoTrimestral: '',
        precoSemestral: '',
        precoAnual: '',
        percentualPlataforma: '',
        isTrial: false,
      });
      fetchTemplates();
    } catch (error: any) {
      console.error('Erro ao salvar template:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Erro desconhecido';
      setError(errorMsg);
      showToast('Erro ao salvar template: ' + errorMsg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleStatus = async (id: string, ativo: boolean) => {
    try {
      await axios.patch(`${API_BASE_URL}/api/planos/${id}`, { status: ativo ? 'ativo' : 'inativo' }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
      showToast('Status atualizado com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handleEdit = (template: PlanoTemplate) => {
    setEditingTemplate(template);
    setFormData({
      nome: template.nome,
      descricao: template.descricao || '',
      tipo: template.tipo || 'pago',
      precoMensal: template.precoMensal?.toString() || '',
      precoTrimestral: template.precoTrimestral?.toString() || '',
      precoSemestral: template.precoSemestral?.toString() || '',
      precoAnual: template.precoAnual?.toString() || '',
      percentualPlataforma: template.percentualPlataforma?.toString() || '',
      isTrial: template.isTrial,
    });
    setShowModal(true);
  };

  const handleDelete = (template: PlanoTemplate) => {
    setDeleteConfirm({show: true, template});
  };

  const confirmDelete = async () => {
    if (!deleteConfirm.template) return;
    
    try {
      await axios.delete(`${API_BASE_URL}/api/planos/${deleteConfirm.template.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTemplates();
      showToast('Template excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      showToast('Erro ao excluir template', 'error');
    } finally {
      setDeleteConfirm({show: false, template: null});
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingTemplate(null);
    setFormData({
      nome: '',
      descricao: '',
      tipo: 'pago',
      precoMensal: '',
      precoTrimestral: '',
      precoSemestral: '',
      precoAnual: '',
      percentualPlataforma: '',
      isTrial: false,
    });
  };

  if (loading) {
    return <div className="text-center">Carregando...</div>;
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
                <h6>Templates de Planos</h6>
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
        <div className="col-xl-6 col-sm-6 mb-xl-0 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="row">
                <div className="col-8">
                  <div className="numbers">
                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Total de Templates</p>
                    <h5 className="font-weight-bolder mb-0">{templates.length}</h5>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <div className="icon icon-shape bg-gradient-primary shadow text-center border-radius-md">
                    <i className="fas fa-clipboard-list text-lg opacity-10"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-6 col-sm-6 mb-xl-0 mb-4">
          <div className="card">
            <div className="card-body p-3">
              <div className="row">
                <div className="col-8">
                  <div className="numbers">
                    <p className="text-sm mb-0 text-capitalize font-weight-bold">Templates Ativos</p>
                    <h5 className="font-weight-bolder mb-0">{templates.filter(t => t.status === 'ativo').length}</h5>
                  </div>
                </div>
                <div className="col-4 text-end">
                  <div className="icon icon-shape bg-gradient-success shadow text-center border-radius-md">
                    <i className="fas fa-check-circle text-lg opacity-10"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
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
                      <th>Preços</th>
                      <th>Tipo</th>
                      <th>-</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.id}>
                        <td>
                          <div>
                            <h6 className="mb-0">{template.nome}</h6>
                            {template.descricao && (
                              <small className="text-muted" dangerouslySetInnerHTML={{ 
                                __html: template.descricao.length > 80 
                                  ? `${template.descricao.substring(0, 80)}...` 
                                  : template.descricao
                              }} />
                            )}
                          </div>
                        </td>
                        <td>
                          <div>
                            {template.tipo === 'parceria' ? (
                              <small>{template.percentualPlataforma || 0}% sobre comissão</small>
                            ) : (
                              <>
                                {template.precoMensal && template.precoMensal > 0 && <small>Mensal: {formatCurrency(template.precoMensal)}</small>}
                                {template.precoTrimestral && template.precoTrimestral > 0 && <><br/><small>Trimestral: {formatCurrency(template.precoTrimestral)}</small></>}
                                {template.precoSemestral && template.precoSemestral > 0 && <><br/><small>Semestral: {formatCurrency(template.precoSemestral)}</small></>}
                                {template.precoAnual && template.precoAnual > 0 && <><br/><small>Anual: {formatCurrency(template.precoAnual)}</small></>}
                              </>
                            )}
                          </div>
                        </td>
                        <td>
                          {template.isTrial ? (
                            <span className="badge bg-gradient-info">Trial</span>
                          ) : (template.tipo || 'pago') === 'parceria' ? (
                            <span className="badge bg-gradient-warning">Parceria</span>
                          ) : (
                            <span className="badge bg-gradient-primary">Pago</span>
                          )}
                        </td>
                        <td>-</td>
                        <td>
                          <span className={`badge ${template.status === 'ativo' ? 'bg-gradient-success' : 'bg-gradient-secondary'}`}>
                            {template.status === 'ativo' ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            <button 
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleEdit(template)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              className={`btn btn-sm ${template.status === 'ativo' ? 'btn-warning' : 'btn-success'}`}
                              onClick={() => toggleStatus(template.id, template.status !== 'ativo')}
                              title={template.status === 'ativo' ? 'Desativar' : 'Ativar'}
                            >
                              <i className={`fas ${template.status === 'ativo' ? 'fa-pause' : 'fa-play'}`}></i>
                            </button>
                            <button 
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDelete(template)}
                              title="Excluir"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </div>
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
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingTemplate ? 'Editar Template' : 'Novo Template de Plano'}</h5>
                <button 
                  type="button" 
                  className="btn-close"
                  onClick={handleCloseModal}
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
                    <label className="form-label d-flex justify-content-between align-items-center">
                      Descrição
                      <button
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setShowEditor(!showEditor)}
                      >
                        <i className={`fas ${showEditor ? 'fa-keyboard' : 'fa-edit'} me-1`}></i>
                        {showEditor ? 'Editor Texto' : 'Editor Visual'}
                      </button>
                    </label>
                    
                    {showEditor ? (
                      <div className="border rounded">
                        <div className="border-bottom p-2 bg-light">
                          <div className="btn-toolbar" role="toolbar">
                            <div className="btn-group btn-group-sm me-2" role="group">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => document.execCommand('bold', false)}
                                title="Negrito"
                              >
                                <i className="fas fa-bold"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => document.execCommand('italic', false)}
                                title="Itálico"
                              >
                                <i className="fas fa-italic"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => document.execCommand('underline', false)}
                                title="Sublinhado"
                              >
                                <i className="fas fa-underline"></i>
                              </button>
                            </div>
                            <div className="btn-group btn-group-sm me-2" role="group">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => document.execCommand('insertUnorderedList', false)}
                                title="Lista com marcadores"
                              >
                                <i className="fas fa-list-ul"></i>
                              </button>
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => document.execCommand('insertOrderedList', false)}
                                title="Lista numerada"
                              >
                                <i className="fas fa-list-ol"></i>
                              </button>
                            </div>
                            <div className="btn-group btn-group-sm" role="group">
                              <button
                                type="button"
                                className="btn btn-outline-secondary"
                                onClick={() => {
                                  if (editorRef.current) {
                                    editorRef.current.innerHTML = '';
                                    setFormData({...formData, descricao: ''});
                                  }
                                }}
                                title="Limpar"
                              >
                                <i className="fas fa-eraser"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div
                          ref={editorRef}
                          contentEditable
                          className="form-control border-0"
                          style={{ minHeight: '150px', maxHeight: '300px', overflow: 'auto' }}
                          onInput={(e) => {
                            const content = e.currentTarget.innerHTML;
                            setFormData({...formData, descricao: content});
                          }}
                          onPaste={(e) => {
                            e.preventDefault();
                            const text = e.clipboardData.getData('text/plain');
                            document.execCommand('insertText', false, text);
                          }}
                          dangerouslySetInnerHTML={{ __html: formData.descricao }}
                        />
                        
                        <div className="border-top p-2 bg-light">
                          <small className="text-muted">
                            <i className="fas fa-info-circle me-1"></i>
                            Use a barra de ferramentas para formatar o texto. Cole texto simples para evitar formatação indesejada.
                          </small>
                        </div>
                      </div>
                    ) : (
                      <textarea
                        className="form-control"
                        rows={4}
                        value={formData.descricao.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')}
                        onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                        placeholder="Descreva os benefícios e características do plano"
                      />
                    )}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Tipo de Plano</label>
                    <select
                      className="form-control"
                      value={formData.tipo}
                      onChange={(e) => setFormData({...formData, tipo: e.target.value as 'pago' | 'parceria'})}
                    >
                      <option value="pago">Plano Pago (Mensalidade Fixa)</option>
                      <option value="parceria">Plano Parceria (% sobre Comissão)</option>
                    </select>
                  </div>
                  {formData.tipo === 'pago' && (
                    <>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Preço Mensal (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.precoMensal}
                            onChange={(e) => setFormData({...formData, precoMensal: e.target.value})}
                            placeholder="Deixe vazio se não oferece"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Preço Trimestral (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.precoTrimestral}
                            onChange={(e) => setFormData({...formData, precoTrimestral: e.target.value})}
                            placeholder="Deixe vazio se não oferece"
                          />
                        </div>
                      </div>
                      <div className="row">
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Preço Semestral (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.precoSemestral}
                            onChange={(e) => setFormData({...formData, precoSemestral: e.target.value})}
                            placeholder="Deixe vazio se não oferece"
                          />
                        </div>
                        <div className="col-md-6 mb-3">
                          <label className="form-label">Preço Anual (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            className="form-control"
                            value={formData.precoAnual}
                            onChange={(e) => setFormData({...formData, precoAnual: e.target.value})}
                            placeholder="Deixe vazio se não oferece"
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
                        step="0.01"
                        min="0"
                        max="100"
                        className="form-control"
                        value={formData.percentualPlataforma}
                        onChange={(e) => setFormData({...formData, percentualPlataforma: e.target.value})}
                        placeholder="Ex: 15 (15% sobre a comissão do vendedor)"
                        required
                      />
                      <small className="text-muted">Percentual que a plataforma receberá sobre a comissão do vendedor</small>
                    </div>
                  )}
                  <div className="mb-3 form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="isTrial"
                      checked={formData.isTrial}
                      onChange={(e) => setFormData({...formData, isTrial: e.target.checked})}
                    />
                    <label className="form-check-label" htmlFor="isTrial">
                      Plano Trial
                    </label>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={handleCloseModal}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={submitting}>
                    {submitting ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2"></span>
                        {editingTemplate ? 'Atualizando...' : 'Criando...'}
                      </>
                    ) : (
                      editingTemplate ? 'Atualizar Template' : 'Criar Template'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
        </div>

        {/* Modal de Confirmação de Exclusão */}
        {deleteConfirm.show && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-sm">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Confirmar Exclusão</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setDeleteConfirm({show: false, template: null})}
                  ></button>
                </div>
                <div className="modal-body">
                  <p>Tem certeza que deseja excluir o template <strong>{deleteConfirm.template?.nome}</strong>?</p>
                  <p className="text-muted small">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setDeleteConfirm({show: false, template: null})}
                  >
                    Cancelar
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-danger"
                    onClick={confirmDelete}
                  >
                    Excluir
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
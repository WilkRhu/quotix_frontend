'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../stories/toastStore';

const IDENTITY_DOCS = [
  { key: 'rg', label: 'RG' },
  { key: 'cpf', label: 'CPF' },
  { key: 'habilitacao', label: 'CNH' },
];

interface DocumentUploadCardsProps {
  clienteId: string;
  onUploadComplete?: () => void;
}

interface Documento {
  id: string;
  tipo: string;
  arquivo?: string;
  arquivoVerso?: string;
  status: string;
  observacoes?: string;
}

export default function DocumentUploadCards({ clienteId, onUploadComplete }: DocumentUploadCardsProps) {
  const { showToast } = useToast();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedIdentityType, setSelectedIdentityType] = useState('rg');
  const [previews, setPreviews] = useState<{[key: string]: string}>({});
  const [selectedFiles, setSelectedFiles] = useState<{[key: string]: File}>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (clienteId) {
      loadDocumentos();
    }
  }, [clienteId]);

  const loadDocumentos = async () => {
    try {
      const response = await api.get(`/api/documentos/cliente/${clienteId}`);
      setDocumentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const handleFileSelect = (file: File, tipo: string, lado: 'frente' | 'verso') => {
    const key = `${tipo}-${lado}`;
    
    setSelectedFiles(prev => ({ ...prev, [key]: file }));
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setPreviews(prev => ({ ...prev, [key]: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadClick = async (tipo: string, lado: 'frente' | 'verso') => {
    const key = `${tipo}-${lado}`;
    const file = selectedFiles[key];
    
    if (!file) {
      showToast('Selecione um arquivo primeiro', 'warning');
      return;
    }
    
    await handleFileUpload(file, tipo, lado);
  };

  const handleDeleteDocument = async (documentoId: string) => {
    if (!confirm('Tem certeza que deseja deletar este documento?')) {
      return;
    }
    
    setDeleting(documentoId);
    
    try {
      await api.delete(`/api/documentos/${documentoId}`);
      await loadDocumentos();
      showToast('Documento deletado com sucesso!', 'success');
    } catch (error: any) {
      console.error('Erro ao deletar documento:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao deletar documento';
      showToast(errorMessage, 'error');
    } finally {
      setDeleting(null);
    }
  };

  const handleFileUpload = async (file: File, tipo: string, lado: 'frente' | 'verso') => {
    setUploading(`${tipo}-${lado}`);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', tipo);
      formData.append('lado', lado);
      formData.append('clienteId', clienteId);

      const response = await api.post('/api/documentos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        await loadDocumentos();
        onUploadComplete?.();
        showToast(`${lado === 'frente' ? 'Frente' : 'Verso'} enviado com sucesso!`, 'success');
        // Limpar preview e arquivo selecionado após upload
        const key = `${tipo}-${lado}`;
        setPreviews(prev => {
          const newPreviews = { ...prev };
          delete newPreviews[key];
          return newPreviews;
        });
        setSelectedFiles(prev => {
          const newFiles = { ...prev };
          delete newFiles[key];
          return newFiles;
        });
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao fazer upload do documento';
      showToast(errorMessage, 'error');
    } finally {
      setUploading(null);
    }
  };

  const getDocumento = (tipo: string) => {
    return documentos.find(d => d.tipo === tipo);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'text-success';
      case 'rejeitado': return 'text-danger';
      default: return 'text-warning';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  return (
    <div className="card mt-4">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-file-alt me-2"></i>
          Documentos do Cliente
        </h5>
      </div>
      <div className="card-body">
        <p className="text-muted mb-3">
          Para validar a conta, o cliente precisa enviar:
        </p>
        <ul className="text-muted mb-4">
          <li>Comprovante de residência (obrigatório)</li>
          <li>Um documento de identidade: RG, CPF ou Habilitação (obrigatório)</li>
        </ul>

        <div className="row">
          {/* Card Documento de Identificação */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h6 className="mb-0">Documento de Identificação</h6>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label small">Tipo de Documento</label>
                  <select 
                    className="form-select form-select-sm"
                    value={selectedIdentityType}
                    onChange={(e) => setSelectedIdentityType(e.target.value)}
                  >
                    {IDENTITY_DOCS.map(doc => (
                      <option key={doc.key} value={doc.key}>{doc.label}</option>
                    ))}
                  </select>
                </div>
                
                {getDocumento(selectedIdentityType)?.observacoes && (
                  <div className="alert alert-info small mb-3">
                    {getDocumento(selectedIdentityType)!.observacoes}
                  </div>
                )}

                <div className="row">
                  {/* Frente */}
                  <div className="col-6">
                    <label className="form-label small">Frente</label>
                    <div 
                      className="border rounded p-3 text-center mb-2"
                      style={{ minHeight: '120px' }}
                    >
                      {previews[`${selectedIdentityType}-frente`] || getDocumento(selectedIdentityType)?.arquivo ? (
                        <img 
                          src={previews[`${selectedIdentityType}-frente`] || getDocumento(selectedIdentityType)!.arquivo} 
                          alt="Frente" 
                          className="img-fluid rounded"
                          style={{ maxHeight: '100px' }}
                        />
                      ) : (
                        <div>
                          <i className="fas fa-image fa-2x text-muted mb-2"></i>
                          <p className="small text-muted mb-0">Frente</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, selectedIdentityType, 'frente');
                      }}
                      className="d-none"
                      id="identity-frente-upload"
                    />
                    <div className="d-flex gap-1">
                      <button 
                        className="btn btn-outline-primary btn-sm flex-fill"
                        onClick={() => document.getElementById('identity-frente-upload')?.click()}
                      >
                        <i className="fas fa-folder-open me-1"></i>
                        Selecionar
                      </button>
                      <button 
                        className="btn btn-primary btn-sm flex-fill"
                        onClick={() => handleUploadClick(selectedIdentityType, 'frente')}
                        disabled={uploading === `${selectedIdentityType}-frente` || !selectedFiles[`${selectedIdentityType}-frente`]}
                      >
                        {uploading === `${selectedIdentityType}-frente` ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                          <i className="fas fa-upload me-1"></i>
                        )}
                        Enviar
                      </button>
                    </div>
                  </div>

                  {/* Verso */}
                  <div className="col-6">
                    <label className="form-label small">Verso</label>
                    <div 
                      className="border rounded p-3 text-center mb-2"
                      style={{ minHeight: '120px' }}
                    >
                      {previews[`${selectedIdentityType}-verso`] || getDocumento(selectedIdentityType)?.arquivoVerso ? (
                        <img 
                          src={previews[`${selectedIdentityType}-verso`] || getDocumento(selectedIdentityType)!.arquivoVerso} 
                          alt="Verso" 
                          className="img-fluid rounded"
                          style={{ maxHeight: '100px' }}
                        />
                      ) : (
                        <div>
                          <i className="fas fa-image fa-2x text-muted mb-2"></i>
                          <p className="small text-muted mb-0">Verso</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, selectedIdentityType, 'verso');
                      }}
                      className="d-none"
                      id="identity-verso-upload"
                    />
                    <div className="d-flex gap-1">
                      <button 
                        className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={() => document.getElementById('identity-verso-upload')?.click()}
                      >
                        <i className="fas fa-folder-open me-1"></i>
                        Selecionar
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm flex-fill"
                        onClick={() => handleUploadClick(selectedIdentityType, 'verso')}
                        disabled={uploading === `${selectedIdentityType}-verso` || !selectedFiles[`${selectedIdentityType}-verso`]}
                      >
                        {uploading === `${selectedIdentityType}-verso` ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                          <i className="fas fa-upload me-1"></i>
                        )}
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card Comprovante de Residência */}
          <div className="col-md-6 mb-4">
            <div className="card h-100">
              <div className="card-header">
                <h6 className="mb-0">Comprovante de Residência</h6>
              </div>
              <div className="card-body">
                {getDocumento('comprovante_residencia')?.observacoes && (
                  <div className="alert alert-info small mb-3">
                    {getDocumento('comprovante_residencia')!.observacoes}
                  </div>
                )}

                <div className="row">
                  {/* Frente */}
                  <div className="col-6">
                    <label className="form-label small">Frente</label>
                    <div 
                      className="border rounded p-3 text-center mb-2"
                      style={{ minHeight: '120px' }}
                    >
                      {previews['comprovante_residencia-frente'] || getDocumento('comprovante_residencia')?.arquivo ? (
                        <img 
                          src={previews['comprovante_residencia-frente'] || getDocumento('comprovante_residencia')!.arquivo} 
                          alt="Frente" 
                          className="img-fluid rounded"
                          style={{ maxHeight: '100px' }}
                        />
                      ) : (
                        <div>
                          <i className="fas fa-image fa-2x text-muted mb-2"></i>
                          <p className="small text-muted mb-0">Frente</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'comprovante_residencia', 'frente');
                      }}
                      className="d-none"
                      id="residencia-frente-upload"
                    />
                    <div className="d-flex gap-1">
                      <button 
                        className="btn btn-outline-primary btn-sm flex-fill"
                        onClick={() => document.getElementById('residencia-frente-upload')?.click()}
                      >
                        <i className="fas fa-folder-open me-1"></i>
                        Selecionar
                      </button>
                      <button 
                        className="btn btn-primary btn-sm flex-fill"
                        onClick={() => handleUploadClick('comprovante_residencia', 'frente')}
                        disabled={uploading === 'comprovante_residencia-frente' || !selectedFiles['comprovante_residencia-frente']}
                      >
                        {uploading === 'comprovante_residencia-frente' ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                          <i className="fas fa-upload me-1"></i>
                        )}
                        Enviar
                      </button>
                    </div>
                  </div>

                  {/* Verso */}
                  <div className="col-6">
                    <label className="form-label small">Verso</label>
                    <div 
                      className="border rounded p-3 text-center mb-2"
                      style={{ minHeight: '120px' }}
                    >
                      {previews['comprovante_residencia-verso'] || getDocumento('comprovante_residencia')?.arquivoVerso ? (
                        <img 
                          src={previews['comprovante_residencia-verso'] || getDocumento('comprovante_residencia')!.arquivoVerso} 
                          alt="Verso" 
                          className="img-fluid rounded"
                          style={{ maxHeight: '100px' }}
                        />
                      ) : (
                        <div>
                          <i className="fas fa-image fa-2x text-muted mb-2"></i>
                          <p className="small text-muted mb-0">Verso</p>
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file, 'comprovante_residencia', 'verso');
                      }}
                      className="d-none"
                      id="residencia-verso-upload"
                    />
                    <div className="d-flex gap-1">
                      <button 
                        className="btn btn-outline-secondary btn-sm flex-fill"
                        onClick={() => document.getElementById('residencia-verso-upload')?.click()}
                      >
                        <i className="fas fa-folder-open me-1"></i>
                        Selecionar
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm flex-fill"
                        onClick={() => handleUploadClick('comprovante_residencia', 'verso')}
                        disabled={uploading === 'comprovante_residencia-verso' || !selectedFiles['comprovante_residencia-verso']}
                      >
                        {uploading === 'comprovante_residencia-verso' ? (
                          <span className="spinner-border spinner-border-sm me-2"></span>
                        ) : (
                          <i className="fas fa-upload me-1"></i>
                        )}
                        Enviar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Documentos Enviados */}
        {documentos.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-3">
              <i className="fas fa-check-circle me-2"></i>
              Documentos Enviados
            </h6>
            <div className="row">
              {documentos.map((documento) => (
                <div key={documento.id} className="col-md-6 mb-3">
                  <div className="card">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="mb-0">
                          {IDENTITY_DOCS.find(d => d.key === documento.tipo)?.label || 
                           (documento.tipo === 'comprovante_residencia' ? 'Comprovante de Residência' : documento.tipo)}
                        </h6>
                        <span className={`badge ${getStatusColor(documento.status)}`}>
                          {getStatusText(documento.status)}
                        </span>
                      </div>
                      
                      <div className="row">
                        {documento.arquivo && (
                          <div className="col-6">
                            <small className="text-muted">Frente</small>
                            <img 
                              src={documento.arquivo} 
                              alt="Frente" 
                              className="img-fluid rounded border mb-2"
                              style={{ maxHeight: '80px', width: '100%', objectFit: 'cover' }}
                            />
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-outline-primary btn-sm flex-fill"
                                onClick={() => window.open(documento.arquivo, '_blank')}
                                title="Visualizar frente"
                              >
                                <i className="fas fa-eye me-1"></i>Ver
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm flex-fill"
                                onClick={() => handleDeleteDocument(documento.id)}
                                disabled={deleting === documento.id || documento.status === 'aprovado'}
                                title={documento.status === 'aprovado' ? 'Não é possível deletar documento aprovado' : 'Deletar documento'}
                              >
                                {deleting === documento.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <>
                                    <i className="fas fa-trash me-1"></i>Del
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                        {documento.arquivoVerso && (
                          <div className="col-6">
                            <small className="text-muted">Verso</small>
                            <img 
                              src={documento.arquivoVerso} 
                              alt="Verso" 
                              className="img-fluid rounded border mb-2"
                              style={{ maxHeight: '80px', width: '100%', objectFit: 'cover' }}
                            />
                            <div className="d-flex gap-1">
                              <button
                                className="btn btn-outline-primary btn-sm flex-fill"
                                onClick={() => window.open(documento.arquivoVerso, '_blank')}
                                title="Visualizar verso"
                              >
                                <i className="fas fa-eye me-1"></i>Ver
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm flex-fill"
                                onClick={() => handleDeleteDocument(documento.id)}
                                disabled={deleting === documento.id || documento.status === 'aprovado'}
                                title={documento.status === 'aprovado' ? 'Não é possível deletar documento aprovado' : 'Deletar documento'}
                              >
                                {deleting === documento.id ? (
                                  <span className="spinner-border spinner-border-sm"></span>
                                ) : (
                                  <>
                                    <i className="fas fa-trash me-1"></i>Del
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {documento.observacoes && (
                        <div className="mt-2">
                          <small className="text-muted">Observações:</small>
                          <p className="small mb-0">{documento.observacoes}</p>
                        </div>
                      )}
                      
                      <small className="text-muted mt-2 d-block">
                        Enviado em: {new Date(documento.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
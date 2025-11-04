'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../stories/toastStore';
import DocumentValidationModal from './DocumentValidationModal';

interface Documento {
  id: string;
  tipo: string;
  arquivo: string;
  arquivoVerso?: string;
  status: string;
  observacoes?: string;
  createdAt: string;
  cliente: {
    id: string;
    name: string;
    email: string;
    foto?: string;
  };
}

export default function DocumentValidation() {
  const { showToast } = useToast();
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<{ id: string; tipo: string } | null>(null);
  const [modalAction, setModalAction] = useState<'approve' | 'reject'>('approve');

  const isPdfFile = (url: string) => {
    return url && (url.includes('.pdf') || url.includes('application/pdf'));
  };

  const renderFilePreview = (url: string, altText: string, isVerso = false) => {
    if (isPdfFile(url)) {
      return (
        <div className="d-flex align-items-center justify-content-center border rounded" style={{ height: '120px', backgroundColor: '#f8f9fa' }}>
          <div className="text-center">
            <i className="fas fa-file-pdf fa-2x text-danger mb-1"></i>
            <p className="small text-muted mb-1">PDF</p>
            <button
              className="btn btn-outline-primary btn-sm"
              onClick={() => window.open(url, '_blank')}
            >
              <i className="fas fa-eye"></i>
            </button>
          </div>
        </div>
      );
    }
    
    return (
      <img 
        src={url}
        alt={altText}
        className="img-fluid rounded border"
        style={{ height: '120px', width: '100%', objectFit: 'cover' }}
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const link = document.createElement('a');
          link.href = url;
          link.textContent = 'Ver';
          link.className = 'btn btn-link btn-sm';
          link.target = '_blank';
          target.parentNode?.appendChild(link);
        }}
      />
    );
  };

  const groupedDocuments = documentos.reduce((acc, doc) => {
    const clienteId = doc.cliente.id;
    if (!acc[clienteId]) {
      acc[clienteId] = {
        cliente: doc.cliente,
        documentos: []
      };
    }
    acc[clienteId].documentos.push(doc);
    return acc;
  }, {} as Record<string, { cliente: Documento['cliente']; documentos: Documento[] }>);

  useEffect(() => {
    loadDocumentosPendentes();
  }, []);

  const loadDocumentosPendentes = async () => {
    try {
      const response = await api.get('/api/documentos/pendentes');
      setDocumentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const validarDocumento = async (documentoId: string, status: string, observacoes?: string) => {
    setValidating(documentoId);
    
    try {
      await api.put(`/api/documentos/validar/${documentoId}`, {
        status,
        observacoes
      });
      
      await loadDocumentosPendentes();
    } catch (error) {
      console.error('Erro ao validar documento:', error);
      showToast('Erro ao validar documento', 'error');
    } finally {
      setValidating(null);
    }
  };

  const getTipoDocumento = (tipo: string) => {
    const tipos: Record<string, string> = {
      rg: 'RG',
      cpf: 'CPF',
      habilitacao: 'Habilitação',
      comprovante_residencia: 'Comprovante de Residência'
    };
    return tipos[tipo] || tipo;
  };

  if (loading) {
    return (
      <div className="text-center py-4">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Carregando documentos...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header">
        <h5 className="mb-0">
          <i className="fas fa-file-check me-2"></i>
          Validação de Documentos
        </h5>
      </div>
      <div className="card-body">
        {Object.keys(groupedDocuments).length === 0 ? (
          <div className="text-center py-5">
            <i className="fas fa-file-check fs-1 text-muted mb-3"></i>
            <h5 className="text-muted">Nenhum documento pendente</h5>
            <p className="text-muted">Todos os documentos foram validados</p>
          </div>
        ) : (
          <div className="row">
            {Object.values(groupedDocuments).map((group) => (
              <div key={group.cliente.id} className="col-12 mb-4">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-light border-0">
                    <div className="d-flex align-items-center">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-2 me-3">
                        {group.cliente.foto ? (
                          <img src={group.cliente.foto} alt={group.cliente.name} className="img-fluid rounded-circle"width={50} />
                        ) : (
                          <i className="fas fa-user text-primary"></i>
                        )}
                      </div>
                      <div>
                        <h6 className="mb-0 fw-bold">{group.cliente.name}</h6>
                        <small className="text-muted">{group.cliente.email}</small>
                      </div>
                      <div className="ms-auto">
                        <span className="badge bg-warning text-dark">
                          {group.documentos.length} documento{group.documentos.length > 1 ? 's' : ''} pendente{group.documentos.length > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="row g-3">
                      {group.documentos.map((documento) => (
                        <div key={documento.id} className="col-md-6">
                          <div className="card border">
                            <div className="card-body p-3">
                              <div className="d-flex justify-content-between align-items-center mb-2">
                                <h6 className="mb-0 small fw-bold">{getTipoDocumento(documento.tipo)}</h6>
                                <small className="text-muted">{new Date(documento.createdAt).toLocaleDateString('pt-BR')}</small>
                              </div>

                              <div className="row g-2 mb-3">
                                {documento.arquivo && (
                                  <div className={documento.arquivoVerso ? 'col-6' : 'col-12'}>
                                    <small className="text-muted d-block mb-1">Frente</small>
                                    {renderFilePreview(
                                      documento.arquivo,
                                      `${getTipoDocumento(documento.tipo)} - Frente`,
                                      false
                                    )}
                                  </div>
                                )}
                                {documento.arquivoVerso && (
                                  <div className="col-6">
                                    <small className="text-muted d-block mb-1">Verso</small>
                                    {renderFilePreview(
                                      documento.arquivoVerso,
                                      `${getTipoDocumento(documento.tipo)} - Verso`,
                                      true
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="d-flex gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedDocument({ id: documento.id, tipo: getTipoDocumento(documento.tipo) });
                                    setModalAction('approve');
                                    setModalOpen(true);
                                  }}
                                  disabled={validating === documento.id}
                                  className="btn btn-success btn-sm flex-fill"
                                >
                                  {validating === documento.id ? (
                                    <span className="spinner-border spinner-border-sm"></span>
                                  ) : (
                                    <i className="fas fa-check"></i>
                                  )}
                                </button>
                                
                                <button
                                  onClick={() => {
                                    setSelectedDocument({ id: documento.id, tipo: getTipoDocumento(documento.tipo) });
                                    setModalAction('reject');
                                    setModalOpen(true);
                                  }}
                                  disabled={validating === documento.id}
                                  className="btn btn-danger btn-sm flex-fill"
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <DocumentValidationModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedDocument(null);
        }}
        onConfirm={(observacoes) => {
          if (selectedDocument) {
            validarDocumento(
              selectedDocument.id, 
              modalAction === 'approve' ? 'aprovado' : 'rejeitado', 
              observacoes
            );
          }
        }}
        action={modalAction}
        documentType={selectedDocument?.tipo || ''}
      />
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../stories/toastStore';
import DocumentValidationModal from './DocumentValidationModal';

interface Documento {
  id: string;
  tipo: string;
  arquivo: string;
  status: string;
  observacoes?: string;
  createdAt: string;
  cliente: {
    id: string;
    name: string;
    email: string;
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
        {documentos.length === 0 ? (
          <div className="text-center py-5">
            <p className="text-muted">
              Nenhum documento pendente de validação
            </p>
          </div>
        ) : (
          <div className="row">
            {documentos.map((documento) => (
              <div key={documento.id} className="col-12 mb-4">
                <div className="card border">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                      <div>
                        <h6 className="card-title">{documento.cliente.name}</h6>
                        <p className="text-muted small mb-1">{documento.cliente.email}</p>
                        <p className="text-muted small">
                          {getTipoDocumento(documento.tipo)} - 
                          Enviado em {new Date(documento.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mb-3">
                      <img 
                        src={documento.arquivo}
                        alt={`Documento ${getTipoDocumento(documento.tipo)}`}
                        className="img-fluid rounded border"
                        style={{ maxHeight: '300px' }}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const link = document.createElement('a');
                          link.href = documento.arquivo;
                          link.textContent = 'Visualizar documento';
                          link.className = 'btn btn-link';
                          link.target = '_blank';
                          target.parentNode?.appendChild(link);
                        }}
                      />
                    </div>

                    <div className="d-flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedDocument({ id: documento.id, tipo: getTipoDocumento(documento.tipo) });
                          setModalAction('approve');
                          setModalOpen(true);
                        }}
                        disabled={validating === documento.id}
                        className="btn btn-success"
                      >
                        {validating === documento.id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2"></span>
                            Validando...
                          </>
                        ) : (
                          'Aprovar'
                        )}
                      </button>
                      
                      <button
                        onClick={() => {
                          setSelectedDocument({ id: documento.id, tipo: getTipoDocumento(documento.tipo) });
                          setModalAction('reject');
                          setModalOpen(true);
                        }}
                        disabled={validating === documento.id}
                        className="btn btn-danger"
                      >
                        Rejeitar
                      </button>
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
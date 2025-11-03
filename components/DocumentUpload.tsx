'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../stories/toastStore';

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

const TIPOS_DOCUMENTO = {
  rg: 'RG',
  cpf: 'CPF',
  habilitacao: 'Habilitação',
  comprovante_residencia: 'Comprovante de Residência'
};

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const { showToast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [tipoIdentidadeSelecionado, setTipoIdentidadeSelecionado] = useState('');
  const [previewResidencia, setPreviewResidencia] = useState<string | null>(null);
  const [previewIdentidade, setPreviewIdentidade] = useState<string | null>(null);
  const [fileInfoResidencia, setFileInfoResidencia] = useState<{name: string, type: string} | null>(null);
  const [fileInfoIdentidade, setFileInfoIdentidade] = useState<{name: string, type: string} | null>(null);

  useEffect(() => {
    loadDocumentos();
  }, []);

  const handleFileUpload = async (file: File, tipo: string) => {
    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('tipo', tipo);

      const response = await api.post('api/documentos/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data) {
        await loadDocumentos();
        onUploadComplete?.();
        showToast('Documento enviado com sucesso!', 'success');
        // Limpar previews após upload
        if (tipo === 'comprovante_residencia') {
          setPreviewResidencia(null);
          setFileInfoResidencia(null);
        }
        if (['rg', 'cpf', 'habilitacao'].includes(tipo)) {
          setPreviewIdentidade(null);
          setFileInfoIdentidade(null);
        }
      }
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao fazer upload do documento';
      showToast(errorMessage, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (file: File, tipo: string) => {
    // Verificar se já existe documento do mesmo tipo
    const documentoExistente = documentos.find(d => d.tipo === tipo);
    if (documentoExistente) {
      showToast('Já existe um documento deste tipo. Delete o anterior para enviar um novo.', 'warning');
      return;
    }

    // Validar tipo de arquivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      showToast('Tipo de arquivo não permitido. Use apenas JPG, PNG ou PDF.', 'error');
      return;
    }

    // Validar tamanho do arquivo (10MB)
    if (file.size > 10 * 1024 * 1024) {
      showToast('Arquivo muito grande. Tamanho máximo: 10MB.', 'error');
      return;
    }

    const fileInfo = { name: file.name, type: file.type };
    
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (tipo === 'comprovante_residencia') {
          setPreviewResidencia(result);
          setFileInfoResidencia(fileInfo);
        } else {
          setPreviewIdentidade(result);
          setFileInfoIdentidade(fileInfo);
        }
      };
      reader.readAsDataURL(file);
    } else if (file.type === 'application/pdf') {
      // Para PDFs, mostrar informações do arquivo
      if (tipo === 'comprovante_residencia') {
        setPreviewResidencia(null);
        setFileInfoResidencia(fileInfo);
      } else {
        setPreviewIdentidade(null);
        setFileInfoIdentidade(fileInfo);
      }
    }
  };

  const triggerFileInput = (inputId: string) => {
    document.getElementById(inputId)?.click();
  };

  const loadDocumentos = async () => {
    try {
      const response = await api.get('/api/documentos/meus-documentos');
      setDocumentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    }
  };

  const handleDeleteDocumento = async (documentoId: string) => {
    try {
      await api.delete(`/api/documentos/${documentoId}`);
      showToast('Documento deletado com sucesso!', 'success');
      await loadDocumentos();
    } catch (error: any) {
      console.error('Erro ao deletar documento:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao deletar documento';
      showToast(errorMessage, 'error');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-success';
      case 'rejeitado': return 'bg-danger';
      default: return 'bg-warning';
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
    <>
      <style jsx>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
        .border-dashed {
          border-style: dashed !important;
        }
        .border-2 {
          border-width: 2px !important;
        }
      `}</style>
      <div className="card mt-4">
        <div className="card-header">
          <h5 className="mb-0">
            <i className="fas fa-file-alt me-2"></i>
            Upload de Documentos
          </h5>
        </div>
      <div className="card-body">
        <p className="text-muted mb-3">
          Para validar sua conta, você precisa enviar:
        </p>
        <ul className="text-muted mb-4">
          <li>Comprovante de residência (obrigatório)</li>
          <li>Um documento de identidade: RG, CPF ou Habilitação (obrigatório)</li>
        </ul>

        <div className="row">
          {/* Comprovante de Residência */}
          <div className="col-md-6 mb-3">
            <div className="border rounded p-3">
              <div className="mb-2">
                <h6 className="mb-0">Comprovante de Residência</h6>
              </div>
              
              {documentos.find(d => d.tipo === 'comprovante_residencia')?.observacoes && (
                <p className="text-muted small mb-2">{documentos.find(d => d.tipo === 'comprovante_residencia').observacoes}</p>
              )}
              
              <input
                id="residencia-input"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleFileSelect(file, 'comprovante_residencia');
                  }
                }}
                disabled={uploading}
                className="d-none"
              />
              
              <div 
                className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${uploading ? 'border-secondary' : 'border-primary'} hover-bg-light`}
                onClick={() => !uploading && triggerFileInput('residencia-input')}
                style={{ cursor: uploading ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}
              >
                {previewResidencia || fileInfoResidencia ? (
                  <div className="position-relative">
                    {previewResidencia ? (
                      <img src={previewResidencia} alt="Preview" className="img-fluid rounded mb-2" style={{ maxHeight: '150px' }} />
                    ) : fileInfoResidencia ? (
                      <div className="mb-3">
                        <i className="fas fa-file-pdf fa-3x text-danger mb-2"></i>
                        <p className="mb-1 fw-bold">{fileInfoResidencia.name}</p>
                        <small className="text-muted">Arquivo PDF selecionado</small>
                      </div>
                    ) : null}
                    <div className="d-flex gap-2 justify-content-center">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.getElementById('residencia-input') as HTMLInputElement;
                          const file = input.files?.[0];
                          if (file) handleFileUpload(file, 'comprovante_residencia');
                        }}
                        disabled={uploading}
                      >
                        <i className="fas fa-upload me-1"></i>Enviar
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewResidencia(null);
                          setFileInfoResidencia(null);
                          const input = document.getElementById('residencia-input') as HTMLInputElement;
                          input.value = '';
                        }}
                      >
                        <i className="fas fa-times me-1"></i>Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <i className="fas fa-cloud-upload-alt fa-2x text-primary mb-2"></i>
                    <p className="mb-1">Clique para selecionar arquivo</p>
                    <small className="text-muted">Imagens (JPG, PNG) ou PDF até 10MB</small>
                  </div>
                )}
              </div>
              
              {documentos.find(d => d.tipo === 'comprovante_residencia') && (
                <div className="mt-2 text-muted small">
                  Enviado em: {new Date(documentos.find(d => d.tipo === 'comprovante_residencia').createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>

          {/* Documento de Identidade */}
          <div className="col-md-6 mb-3">
            <div className="border rounded p-3">
              <div className="mb-2">
                <h6 className="mb-0">Documento de Identidade</h6>
              </div>
              
              <div className="mb-2">
                <select 
                  className="form-select form-select-sm mb-2"
                  value={tipoIdentidadeSelecionado}
                  onChange={(e) => setTipoIdentidadeSelecionado(e.target.value)}
                  disabled={uploading}
                >
                  <option value="">Selecione o tipo de documento</option>
                  <option value="rg">RG</option>
                  <option value="cpf">CPF</option>
                  <option value="habilitacao">Habilitação (CNH)</option>
                </select>
              </div>
              
              {documentos.find(d => ['rg', 'cpf', 'habilitacao'].includes(d.tipo))?.observacoes && (
                <p className="text-muted small mb-2">{documentos.find(d => ['rg', 'cpf', 'habilitacao'].includes(d.tipo)).observacoes}</p>
              )}
              
              <input
                id="identidade-input"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file && tipoIdentidadeSelecionado) {
                    handleFileSelect(file, tipoIdentidadeSelecionado);
                  } else if (file && !tipoIdentidadeSelecionado) {
                    showToast('Selecione o tipo de documento primeiro', 'warning');
                  }
                }}
                disabled={uploading || !tipoIdentidadeSelecionado}
                className="d-none"
              />
              
              <div 
                className={`border-2 border-dashed rounded p-4 text-center cursor-pointer ${
                  uploading || !tipoIdentidadeSelecionado ? 'border-secondary' : 'border-primary'
                } hover-bg-light`}
                onClick={() => !uploading && tipoIdentidadeSelecionado && triggerFileInput('identidade-input')}
                style={{ 
                  cursor: uploading || !tipoIdentidadeSelecionado ? 'not-allowed' : 'pointer', 
                  transition: 'all 0.2s',
                  opacity: !tipoIdentidadeSelecionado ? 0.6 : 1
                }}
              >
                {previewIdentidade || fileInfoIdentidade ? (
                  <div className="position-relative">
                    {previewIdentidade ? (
                      <img src={previewIdentidade} alt="Preview" className="img-fluid rounded mb-2" style={{ maxHeight: '150px' }} />
                    ) : fileInfoIdentidade ? (
                      <div className="mb-3">
                        <i className="fas fa-file-pdf fa-3x text-danger mb-2"></i>
                        <p className="mb-1 fw-bold">{fileInfoIdentidade.name}</p>
                        <small className="text-muted">Arquivo PDF selecionado</small>
                      </div>
                    ) : null}
                    <div className="d-flex gap-2 justify-content-center">
                      <button 
                        className="btn btn-success btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          const input = document.getElementById('identidade-input') as HTMLInputElement;
                          const file = input.files?.[0];
                          if (file && tipoIdentidadeSelecionado) handleFileUpload(file, tipoIdentidadeSelecionado);
                        }}
                        disabled={uploading}
                      >
                        <i className="fas fa-upload me-1"></i>Enviar
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewIdentidade(null);
                          setFileInfoIdentidade(null);
                          const input = document.getElementById('identidade-input') as HTMLInputElement;
                          input.value = '';
                        }}
                      >
                        <i className="fas fa-times me-1"></i>Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <i className={`fas fa-id-card fa-2x mb-2 ${
                      !tipoIdentidadeSelecionado ? 'text-muted' : 'text-primary'
                    }`}></i>
                    <p className="mb-1">
                      {!tipoIdentidadeSelecionado 
                        ? 'Selecione o tipo de documento acima' 
                        : 'Clique para selecionar arquivo'
                      }
                    </p>
                    <small className="text-muted">Imagens (JPG, PNG) ou PDF até 10MB</small>
                  </div>
                )}
              </div>
              
              {documentos.find(d => ['rg', 'cpf', 'habilitacao'].includes(d.tipo)) && (
                <div className="mt-2 text-muted small">
                  Tipo: {TIPOS_DOCUMENTO[documentos.find(d => ['rg', 'cpf', 'habilitacao'].includes(d.tipo)).tipo as keyof typeof TIPOS_DOCUMENTO]} - 
                  Enviado em: {new Date(documentos.find(d => ['rg', 'cpf', 'habilitacao'].includes(d.tipo)).createdAt).toLocaleDateString()}
                </div>
              )}
            </div>
          </div>
        </div>

        {uploading && (
          <div className="text-center mt-3">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Enviando...</span>
            </div>
            <p className="mt-2 text-muted">Enviando documento...</p>
          </div>
        )}

        {/* Lista de Documentos Enviados */}
        {documentos.length > 0 && (
          <div className="mt-4">
            <h6 className="mb-3">
              <i className="fas fa-file-check me-2"></i>
              Documentos Enviados
            </h6>
            <div className="row">
              {documentos.map((documento) => (
                <div key={documento.id} className="col-md-6 mb-3">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body p-3">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <div>
                          <h6 className="mb-1">{TIPOS_DOCUMENTO[documento.tipo as keyof typeof TIPOS_DOCUMENTO]}</h6>
                          <small className="text-muted">
                            Enviado em {new Date(documento.createdAt).toLocaleDateString()}
                          </small>
                        </div>
                        <span className={`badge ${getStatusColor(documento.status)}`}>
                          {getStatusText(documento.status)}
                        </span>
                      </div>
                      
                      {documento.observacoes && (
                        <div className="alert alert-warning alert-sm p-2 mb-2">
                          <small><strong>Observação:</strong> {documento.observacoes}</small>
                        </div>
                      )}
                      
                      <div className="d-flex justify-content-between align-items-center">
                        <div className="d-flex gap-2">
                          <a 
                            href={documento.arquivo}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm"
                          >
                            <i className="fas fa-eye me-1"></i>Visualizar
                          </a>
                          
                          {documento.status === 'rejeitado' && (
                            <button 
                              className="btn btn-outline-secondary btn-sm"
                              onClick={() => {
                                if (documento.tipo === 'comprovante_residencia') {
                                  triggerFileInput('residencia-input');
                                } else {
                                  setTipoIdentidadeSelecionado(documento.tipo);
                                  setTimeout(() => triggerFileInput('identidade-input'), 100);
                                }
                              }}
                            >
                              <i className="fas fa-redo me-1"></i>Reenviar
                            </button>
                          )}
                        </div>
                        
                        {documento.status !== 'aprovado' && (
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => handleDeleteDocumento(documento.id)}
                            title="Deletar documento"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
}
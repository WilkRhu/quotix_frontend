'use client';

import { useState } from 'react';

interface DocumentUploadCardProps {
  tipo: string;
  titulo: string;
  onUpload: (file: File, lado: 'frente' | 'verso') => void;
  existingDoc?: {
    arquivo?: string;
    arquivoVerso?: string;
    status: string;
    observacoes?: string;
  };
  uploading: boolean;
}

export default function DocumentUploadCard({ 
  tipo, 
  titulo, 
  onUpload, 
  existingDoc, 
  uploading 
}: DocumentUploadCardProps) {
  const [previewFrente, setPreviewFrente] = useState<string | null>(null);
  const [previewVerso, setPreviewVerso] = useState<string | null>(null);

  const handleFileSelect = (file: File, lado: 'frente' | 'verso') => {
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        if (lado === 'frente') {
          setPreviewFrente(result);
        } else {
          setPreviewVerso(result);
        }
      };
      reader.readAsDataURL(file);
    }
    onUpload(file, lado);
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
    <div className="col-md-6 mb-4">
      <div className="card h-100">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h6 className="mb-0">{titulo}</h6>
          {existingDoc && (
            <span className={`badge ${getStatusColor(existingDoc.status)}`}>
              {getStatusText(existingDoc.status)}
            </span>
          )}
        </div>
        <div className="card-body">
          {existingDoc?.observacoes && (
            <div className="alert alert-info small mb-3">
              {existingDoc.observacoes}
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
                {previewFrente || existingDoc?.arquivo ? (
                  <img 
                    src={previewFrente || existingDoc?.arquivo} 
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
                  if (file) handleFileSelect(file, 'frente');
                }}
                className="d-none"
                id={`${tipo}-frente-upload`}
              />
              <button 
                className="btn btn-primary btn-sm w-100"
                onClick={() => document.getElementById(`${tipo}-frente-upload`)?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <i className="fas fa-upload me-1"></i>
                )}
                Upload Frente
              </button>
            </div>

            {/* Verso */}
            <div className="col-6">
              <label className="form-label small">Verso</label>
              <div 
                className="border rounded p-3 text-center mb-2"
                style={{ minHeight: '120px' }}
              >
                {previewVerso || existingDoc?.arquivoVerso ? (
                  <img 
                    src={previewVerso || existingDoc?.arquivoVerso} 
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
                  if (file) handleFileSelect(file, 'verso');
                }}
                className="d-none"
                id={`${tipo}-verso-upload`}
              />
              <button 
                className="btn btn-secondary btn-sm w-100"
                onClick={() => document.getElementById(`${tipo}-verso-upload`)?.click()}
                disabled={uploading}
              >
                {uploading ? (
                  <span className="spinner-border spinner-border-sm me-2"></span>
                ) : (
                  <i className="fas fa-upload me-1"></i>
                )}
                Upload Verso
              </button>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
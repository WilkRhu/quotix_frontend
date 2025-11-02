'use client';

import { useState } from 'react';

interface DocumentValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (observacoes: string) => void;
  action: 'approve' | 'reject';
  documentType: string;
}

export default function DocumentValidationModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  action, 
  documentType 
}: DocumentValidationModalProps) {
  const [observacoes, setObservacoes] = useState('');

  const handleConfirm = () => {
    onConfirm(observacoes);
    setObservacoes('');
    onClose();
  };

  const handleClose = () => {
    setObservacoes('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">
              {action === 'approve' ? 'Aprovar' : 'Rejeitar'} Documento
            </h5>
            <button 
              type="button" 
              className="btn-close" 
              onClick={handleClose}
            ></button>
          </div>
          <div className="modal-body">
            <p>
              Tem certeza que deseja <strong>{action === 'approve' ? 'aprovar' : 'rejeitar'}</strong> o documento <strong>{documentType}</strong>?
            </p>
            
            {action === 'reject' && (
              <div className="mb-3">
                <label htmlFor="observacoes" className="form-label">
                  Motivo da rejeição <span className="text-muted">(opcional)</span>:
                </label>
                <textarea
                  id="observacoes"
                  className="form-control"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Descreva o motivo da rejeição..."
                />
              </div>
            )}

            {action === 'approve' && (
              <div className="mb-3">
                <label htmlFor="observacoes" className="form-label">
                  Observações <span className="text-muted">(opcional)</span>:
                </label>
                <textarea
                  id="observacoes"
                  className="form-control"
                  rows={3}
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder="Adicione observações se necessário..."
                />
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleClose}
            >
              Cancelar
            </button>
            <button 
              type="button" 
              className={`btn ${action === 'approve' ? 'btn-success' : 'btn-danger'}`}
              onClick={handleConfirm}
            >
              {action === 'approve' ? 'Aprovar' : 'Rejeitar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
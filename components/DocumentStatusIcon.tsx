'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface DocumentStatusIconProps {
  className?: string;
}

export default function DocumentStatusIcon({ className = '' }: DocumentStatusIconProps) {
  const [hasDocuments, setHasDocuments] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkDocuments();
  }, []);

  const checkDocuments = async () => {
    try {
      const response = await api.get('/api/documentos/meus-documentos');
      const documentos = response.data || [];
      
      // Verificar se tem pelo menos um documento
      setHasDocuments(documentos.length > 0);
    } catch (error) {
      console.error('Erro ao verificar documentos:', error);
      setHasDocuments(false);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <i className={`fas fa-star ${className}`}></i>;
  }

  return (
    <i className={`fas fa-star ${hasDocuments ? 'text-success' : 'text-danger'} ${className}`}></i>
  );
}
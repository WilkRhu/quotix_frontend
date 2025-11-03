'use client';

import { useState, useEffect } from 'react';
import { api } from '../lib/api';

interface VendaDocumentosProps {
  clienteId: string;
  vendaId?: number;
}

interface Documento {
  id: string;
  tipo: string;
  arquivo: string;
  status: string;
  observacoes?: string;
  createdAt: string;
}

export default function VendaDocumentos({ clienteId, vendaId }: VendaDocumentosProps) {
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocumentos();
  }, [clienteId]);

  const loadDocumentos = async () => {
    try {
      const response = await api.get(`/documentos/cliente/${clienteId}`);
      setDocumentos(response.data);
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      default: return 'Pendente';
    }
  };

  const documentosAprovados = documentos.filter(d => d.status === 'aprovado');
  const temComprovanteResidencia = documentosAprovados.some(d => d.tipo === 'comprovante_residencia');
  const temDocumentoIdentidade = documentosAprovados.some(d => 
    ['rg', 'cpf', 'habilitacao'].includes(d.tipo)
  );
  const validacaoCompleta = temComprovanteResidencia && temDocumentoIdentidade;

  if (loading) {
    return <div className="text-center py-4">Carregando documentos...</div>;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Documentos do Cliente</h3>
        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
          validacaoCompleta ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {validacaoCompleta ? 'Validação Completa' : 'Documentos Pendentes'}
        </div>
      </div>

      {documentos.length === 0 ? (
        <p className="text-gray-500 text-center py-4">
          Nenhum documento enviado pelo cliente
        </p>
      ) : (
        <div className="space-y-3">
          {documentos.map((documento) => (
            <div key={documento.id} className="flex items-center justify-between p-3 border rounded">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span className="font-medium">{getTipoDocumento(documento.tipo)}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(documento.status)}`}>
                    {getStatusText(documento.status)}
                  </span>
                </div>
                {documento.observacoes && (
                  <p className="text-sm text-gray-600 mt-1">{documento.observacoes}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Enviado em: {new Date(documento.createdAt).toLocaleDateString()}
                </p>
              </div>
              
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}/${documento.arquivo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
              >
                Visualizar
              </a>
            </div>
          ))}
        </div>
      )}

      {!validacaoCompleta && (
        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-yellow-800">
            <strong>Atenção:</strong> Para aprovar esta venda, o cliente precisa ter:
          </p>
          <ul className="text-sm text-yellow-700 mt-1 list-disc list-inside">
            {!temComprovanteResidencia && <li>Comprovante de residência aprovado</li>}
            {!temDocumentoIdentidade && <li>Documento de identidade (RG, CPF ou Habilitação) aprovado</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
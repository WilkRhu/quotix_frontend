'use client'

import React, { useState, useEffect } from 'react'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'

// Componente de upload com preview
function UploadPreview({ vendedorId, fotoAtual, token }: { vendedorId: string, fotoAtual?: string, token: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (ev) => setPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setMessage('');
    try {
      const formData = new FormData();
      formData.append('foto', selectedFile);
      const response = await fetch(`${API_BASE_URL}/api/users/${vendedorId}/foto`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) throw new Error('Erro ao enviar foto');
      setMessage('Foto enviada com sucesso!');
      setPreview(null);
      setSelectedFile(null);
    } catch (err) {
      setMessage('Erro ao enviar foto');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="d-flex flex-column align-items-center">
      <div
        className="border-2 border-dashed border-primary rounded-circle d-flex flex-column align-items-center justify-content-center mb-2 cursor-pointer"
        style={{ width: '100px', height: '100px', cursor: 'pointer', background: preview || fotoAtual ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
        onClick={() => document.getElementById(`fotoInput-${vendedorId}`)?.click()}
      >
        {preview ? (
          <img src={preview} alt="Preview" className="rounded-circle shadow-sm" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
        ) : fotoAtual ? (
          <img src={`${API_BASE_URL}/uploads/vendedores/${fotoAtual}`} alt="Foto atual" className="rounded-circle shadow-sm" style={{ width: '100px', height: '100px', objectFit: 'cover' }} />
        ) : (
          <i className="fas fa-cloud-upload-alt fa-2x text-white"></i>
        )}
      </div>
      <input
        id={`fotoInput-${vendedorId}`}
        type="file"
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />
      {preview && (
        <button className="btn btn-info btn-sm mt-2" onClick={handleUpload} disabled={uploading}>
          {uploading ? 'Enviando...' : 'Enviar Foto'}
        </button>
      )}
      {message && <small className={`text-${message.includes('sucesso') ? 'success' : 'danger'} mt-2`}>{message}</small>}
    </div>
  );
}

export default function VendedoresAvulsosPage() {
  const { token } = useAuth()
  const [loading, setLoading] = useState(true)
  const [solicitacoes, setSolicitacoes] = useState<any[]>([])
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [expandedRow, setExpandedRow] = useState<string | null>(null)

  useEffect(() => {
    carregarSolicitacoes()
  }, [])

  const carregarSolicitacoes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendedores-avulsos/solicitacoes`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setSolicitacoes(data)
      } else {
        setMessage(`Erro ao carregar solicitações: ${response.status}`)
        setMessageType('error')
      }
    } catch (error) {
      console.error('Erro ao carregar solicitações:', error)
      setMessage('Erro ao carregar solicitações')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const responderSolicitacao = async (solicitacaoId: string, status: 'aprovada' | 'rejeitada', comissaoNegociada?: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vendedores-avulsos/solicitacoes/${solicitacaoId}/responder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          comissaoNegociada,
          mensagem: status === 'aprovada' ? 'Solicitação aprovada!' : 'Solicitação rejeitada.'
        })
      })

      if (response.ok) {
        setMessage(`Solicitação ${status === 'aprovada' ? 'aprovada' : 'rejeitada'} com sucesso!`)
        setMessageType('success')
        carregarSolicitacoes()
      } else {
        setMessage('Erro ao responder solicitação')
        setMessageType('error')
      }
    } catch (error) {
      console.error('Erro ao responder solicitação:', error)
      setMessage('Erro ao responder solicitação')
      setMessageType('error')
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
        <DashboardLayout title="Vendedores Avulsos">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
      <DashboardLayout title="Vendedores Avulsos">
        <div className="card">
          <div className="card-header">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-user-plus me-2"></i>
                Solicitações de Vendedores Avulsos
                {solicitacoes.filter(s => s.status === 'pendente').length > 0 && (
                  <span className="badge bg-danger ms-2">
                    {solicitacoes.filter(s => s.status === 'pendente').length}
                  </span>
                )}
              </h5>
            </div>
          </div>
          <div className="card-body">
            {message && (
              <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} mb-4`}>
                <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                {message}
              </div>
            )}

            {solicitacoes.length === 0 ? (
              <div className="text-center py-5">
                <i className="fas fa-inbox fa-3x text-muted mb-3"></i>
                <h6 className="text-muted">Nenhuma solicitação encontrada</h6>
                <p className="text-sm text-muted">Quando vendedores avulsos solicitarem acesso à sua loja, eles aparecerão aqui.</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover">
                  <thead>
                    <tr>
                      <th>Vendedor</th>
                      <th>Contato</th>
                      <th>Localização</th>
                      <th>Comissão</th>
                      <th>Status</th>
                      <th>Data</th>
                      <th>Ações</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {solicitacoes.map((solicitacao: any) => (
                      <React.Fragment key={solicitacao.id}>
                        <tr>
                          <td>
                            <div>
                              <strong>{solicitacao.vendedor?.nome}</strong>
                              {solicitacao.mensagemVendedor && (
                                <small className="d-block text-muted">
                                  "{solicitacao.mensagemVendedor}"
                                </small>
                              )}
                            </div>
                          </td>
                          <td>
                            <div>
                              <small className="d-block">{solicitacao.vendedor?.email}</small>
                              <small className="d-block">{solicitacao.vendedor?.telefone}</small>
                            </div>
                          </td>
                          <td>
                            <small>{solicitacao.vendedor?.cidade} - {solicitacao.vendedor?.estado}</small>
                          </td>
                          <td>
                            <span className="badge bg-info">{solicitacao.comissaoNegociada}%</span>
                          </td>
                          <td>
                            <span className={`badge ${
                              solicitacao.status === 'pendente' ? 'bg-warning' :
                              solicitacao.status === 'aprovada' ? 'bg-success' : 'bg-danger'
                            }`}>
                              {solicitacao.status === 'pendente' ? 'Pendente' :
                               solicitacao.status === 'aprovada' ? 'Aprovada' : 'Rejeitada'}
                            </span>
                          </td>
                          <td>
                            <small>{new Date(solicitacao.createdAt).toLocaleDateString('pt-BR')}</small>
                          </td>
                          <td>
                            {solicitacao.status === 'pendente' && (
                              <div className="btn-group btn-group-sm">
                                <button 
                                  className="btn btn-success btn-sm" 
                                  title="Aprovar"
                                  onClick={() => responderSolicitacao(solicitacao.id, 'aprovada', solicitacao.comissaoNegociada)}
                                >
                                  <i className="fas fa-check"></i>
                                </button>
                                <button 
                                  className="btn btn-danger btn-sm" 
                                  title="Rejeitar"
                                  onClick={() => responderSolicitacao(solicitacao.id, 'rejeitada')}
                                >
                                  <i className="fas fa-times"></i>
                                </button>
                              </div>
                            )}
                          </td>
                          <td>
                            <button 
                              className="btn btn-sm btn-outline-secondary" 
                              onClick={() => setExpandedRow(expandedRow === solicitacao.id ? null : solicitacao.id)}
                              title="Ver mais informações"
                            >
                              <i className={`fas fa-${expandedRow === solicitacao.id ? 'chevron-up' : 'info-circle'}`}></i>
                            </button>
                          </td>
                        </tr>
                        {expandedRow === solicitacao.id && (
                          <tr>
                            <td colSpan={8}>
                              <div className="card card-body bg-light">
                                <h6 className="mb-3">Informações Detalhadas</h6>
                                <div className="row">
                                  <div className="col-md-6">
                                    <div className="mb-2">
                                      <strong>CPF:</strong> {solicitacao.vendedor?.cpf}
                                    </div>
                                    <div className="mb-2">
                                      <strong>CEP:</strong> {solicitacao.vendedor?.cep}
                                    </div>
                                    {solicitacao.vendedor?.nisPis && (
                                      <div className="mb-2">
                                        <strong>NIS/PIS:</strong> {solicitacao.vendedor.nisPis}
                                      </div>
                                    )}
                                  </div>
                                  <div className="col-md-6">
                                    <div className="mb-2">
                                      <strong>Endereço:</strong> {solicitacao.vendedor?.endereco}, {solicitacao.vendedor?.numero}
                                      {solicitacao.vendedor?.complemento && `, ${solicitacao.vendedor.complemento}`}
                                    </div>
                                    {solicitacao.vendedor?.experiencia && (
                                      <div className="mb-2">
                                        <strong>Experiência:</strong> {solicitacao.vendedor.experiencia}
                                      </div>
                                    )}
                                    <div className="mb-2">
                                      <strong>Cadastrado em:</strong> {new Date(solicitacao.vendedor?.createdAt).toLocaleDateString('pt-BR')}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-4">
                                  <h6 className="mb-2">Foto do Vendedor</h6>
                                  <UploadPreview vendedorId={solicitacao.vendedor?.id} fotoAtual={solicitacao.vendedor?.foto} token={token} />
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import DashboardLayout from '../../../../../components/DashboardLayout'
import ProtectedRoute from '../../../../../components/ProtectedRoute'
import DocumentUploadCards from '../../../../../components/DocumentUploadCards'
import { Role } from '../../../../../types/auth'
import { useAuth } from '../../../../../stories/authStore'
import { API_BASE_URL } from '../../../../../lib/api'
import { useToast } from '../../../../../stories/toastStore'

export default function EditarClientePage() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const params = useParams()
  const clienteId = params && (typeof params.id === 'string' ? params.id : Array.isArray(params.id) ? params.id[0] : '');
  if (!clienteId) throw new Error('ID do cliente não encontrado');
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [cliente, setCliente] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  })

  useEffect(() => {
    if (clienteId) {
      carregarCliente()
    }
  }, [clienteId])

  const carregarCliente = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${clienteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (response.ok) {
        const data = await response.json()
        setCliente(data)
        setFormData({
          name: data.name || '',
          email: data.email || '',
          telefone: data.telefone || '',
          endereco: data.endereco || '',
          cidade: data.cidade || '',
          estado: data.estado || '',
          cep: data.cep || ''
        })
      }
    } catch (error) {
      console.error('Erro ao carregar cliente:', error)
      showToast('Erro ao carregar dados do cliente', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${clienteId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      if (response.ok) {
        showToast('Cliente atualizado com sucesso!', 'success')
        router.back()
      } else {
        throw new Error('Erro ao atualizar cliente')
      }
    } catch (error) {
      console.error('Erro ao atualizar cliente:', error)
      showToast('Erro ao atualizar cliente', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.SELLER]}>
        <DashboardLayout>
          <div className="text-center py-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={[Role.SELLER]}>
      <DashboardLayout>
        <div className="container-fluid">
          <div className="row">
            <div className="col-12">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="card-title mb-0">
                    <i className="fas fa-user-edit me-2"></i>
                    Editar Cliente: {cliente?.name}
                  </h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="name">Nome Completo</label>
                          <input
                            type="text"
                            className="form-control"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="email">Email</label>
                          <input
                            type="email"
                            className="form-control"
                            id="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="telefone">Telefone</label>
                          <input
                            type="tel"
                            className="form-control"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group mb-3">
                          <label htmlFor="cep">CEP</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cep"
                            name="cep"
                            value={formData.cep}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-8">
                        <div className="form-group mb-3">
                          <label htmlFor="endereco">Endereço</label>
                          <input
                            type="text"
                            className="form-control"
                            id="endereco"
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group mb-3">
                          <label htmlFor="cidade">Cidade</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cidade"
                            name="cidade"
                            value={formData.cidade}
                            onChange={handleInputChange}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row mt-4">
                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                              Salvando...
                            </>
                          ) : (
                            'Salvar Alterações'
                          )}
                        </button>
                        <button
                          type="button"
                          className="btn btn-secondary ms-2"
                          onClick={() => router.back()}
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>

              <DocumentUploadCards 
                clienteId={clienteId}
                onUploadComplete={() => {}}
              />
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '../../stories/authStore'
import ProtectedRoute from '../../components/ProtectedRoute'
import ProfileLayout from '../../components/ProfileLayout'
import { API_BASE_URL, UPLOAD_URL } from '../../lib/api'
import { formatCurrency } from '../../lib/formatters'
import { resolveImageUrl } from '../../lib/images'
import { translateRole } from '../../lib/roles'
import { Role } from '../../types/auth'

export default function Perfil() {
  const { user, token } = useAuth()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [vendedor, setVendedor] = useState<any | null>(null)
  const [fotoVendedor, setFotoVendedor] = useState<string | null>(null)

  useEffect(() => {
    async function fetchVendedor() {
      if (user?.role === Role.SELLER && user?.id && token) {
        try {
          const res = await fetch(`${API_BASE_URL}/api/vendedores/${user.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            setVendedor(data)
            setFotoVendedor(data?.foto || null)
          }
        } catch (err) {
          console.error('Erro ao buscar dados do vendedor')
        }
      }
    }
    fetchVendedor()
  }, [user?.role, user?.id, token])
  
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name,
        email: user.email,
        telefone: user.telefone || '',
        endereco: user.endereco || '',
        cidade: user.cidade || '',
        estado: user.estado || '',
        cep: user.cep || ''
      }))
    }
  }, [user])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === 'telefone') {
      const masked = value
        .replace(/\D/g, '')
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15)

      setFormData(prev => ({
        ...prev,
        [name]: masked
      }))
    } else if (name === 'cep') {
      const masked = value
        .replace(/\D/g, '')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 9)

      setFormData(prev => ({
        ...prev,
        [name]: masked
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      // Upload automático
      setUploading(true)
      try {
        const formDataUpload = new FormData()
        formDataUpload.append('foto', file)

        let uploadUrl = `${API_BASE_URL}/api/users/${user?.id}/foto`
        if (user?.role === Role.SELLER && vendedor?.id) {
          uploadUrl = `${API_BASE_URL}/api/vendedores/${vendedor.id}/foto`
        }

        const response = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formDataUpload
        })
        if (!response.ok) {
          throw new Error('Erro ao fazer upload da foto')
        }
        setMessage('Foto atualizada com sucesso!')
        setSelectedFile(null)
        // Atualiza foto do vendedor no estado
        if (user?.role === Role.SELLER) {
          const data = await response.json()
          setFotoVendedor(data.foto)
        }
      } catch (error) {
        setError('Erro ao fazer upload da foto')
      } finally {
        setUploading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        telefone: formData.telefone,
        endereco: formData.endereco,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep
      }

      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('Nova senha e confirmação não coincidem')
          setLoading(false)
          return
        }
        updateData.password = formData.newPassword
      }

      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        throw new Error('Erro ao atualizar perfil')
      }

      setMessage('Perfil atualizado com sucesso!')
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }))
    } catch (error) {
      setError('Erro ao atualizar perfil')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute>
      <ProfileLayout>
        <div className="container-fluid py-4">
          <div className="row">
            <div className="col-md-8">
              <div className="card">
                <div className="card-header pb-0">
                  <div className="d-flex align-items-center">
                    <p className="mb-0">Editar Perfil</p>
                  </div>
                </div>
                <div className="card-body">
                  {message && (
                    <div className="alert alert-success" role="alert">
                      {message}
                    </div>
                  )}
                  {error && (
                    <div className="alert alert-danger" role="alert">
                      {error}
                    </div>
                  )}
                  <form onSubmit={handleSubmit}>
                    <div className="form-group text-center mb-4">
                      <div
                        className="border-2 border-dashed border-primary rounded-circle d-flex flex-column align-items-center justify-content-center mx-auto mb-3 cursor-pointer transition-all"
                        style={{
                          cursor: 'pointer',
                          minHeight: '120px',
                          width: '120px',
                          height: '120px',
                          background: (fotoPreview || fotoVendedor) ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: (fotoPreview || fotoVendedor) ? 'inherit' : 'white'
                        }}
                        onClick={() => document.getElementById('fotoInputCliente')?.click()}
                      >
                        {fotoPreview ? (
                          <img
                            src={fotoPreview}
                            alt="Preview"
                            className="rounded-circle shadow-sm"
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                        ) : fotoVendedor ? (
                          <img
                            src={fotoVendedor.startsWith('http') ? fotoVendedor : `${API_BASE_URL}/uploads/vendedores/${fotoVendedor}`}
                            alt="Foto atual"
                            className="rounded-circle shadow-sm"
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                        ) : (
                          <>
                            <i className="fas fa-cloud-upload-alt fa-2x mb-2"></i>
                            <div className="fw-bold">Clique para fazer upload</div>
                            <div className="small opacity-75">PNG, JPG até 2MB</div>
                          </>
                        )}
                      </div>
                      <input
                        id="fotoInputCliente"
                        type="file"
                        style={{ display: 'none' }}
                        accept="image/*"
                        onChange={handleFileChange}
                      />
                      {uploading && (
                        <div className="mt-2">
                          <small className="text-info">Enviando...</small>
                        </div>
                      )}
                      <small className="text-muted">JPG, PNG, GIF (máx. 2MB)</small>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">Nome</label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">Email</label>
                          <input 
                            className="form-control" 
                            type="email" 
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">Telefone</label>
                          <input 
                            className="form-control" 
                            type="tel" 
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleChange}
                            placeholder="(11) 99999-9999"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">CEP</label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="cep"
                            value={formData.cep}
                            onChange={handleChange}
                            placeholder="12345-678"
                          />
                        </div>
                      </div>
                      <div className="col-md-12">
                        <div className="form-group">
                          <label className="form-control-label">Endereço</label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="endereco"
                            value={formData.endereco}
                            onChange={handleChange}
                            placeholder="Rua, número, complemento"
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">Cidade</label>
                          <input 
                            className="form-control" 
                            type="text" 
                            name="cidade"
                            value={formData.cidade}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">Estado</label>
                          <select 
                            className="form-control" 
                            name="estado"
                            value={formData.estado}
                            onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                          >
                            <option value="">Selecione o estado</option>
                            <option value="SP">São Paulo</option>
                            <option value="RJ">Rio de Janeiro</option>
                            <option value="MG">Minas Gerais</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    <hr className="horizontal dark" />
                    <p className="text-uppercase text-sm">Alterar Senha</p>
                    <div className="row">
                      <div className="col-md-12">
                        <div className="form-group">
                          <label className="form-control-label">Senha Atual</label>
                          <input 
                            className="form-control" 
                            type="password" 
                            name="currentPassword"
                            value={formData.currentPassword}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">Nova Senha</label>
                          <input 
                            className="form-control" 
                            type="password" 
                            name="newPassword"
                            value={formData.newPassword}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label className="form-control-label">Confirmar Nova Senha</label>
                          <input 
                            className="form-control" 
                            type="password" 
                            name="confirmPassword"
                            value={formData.confirmPassword}
                            onChange={handleChange}
                          />
                        </div>
                      </div>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-sm ms-auto"
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card">
                <div className="card-header pb-0">
                  <p className="mb-0">Meus Dados</p>
                </div>
                <div className="card-body">
                  <div className="text-center mb-4">
                    <div
                      className="bg-gradient-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                      style={{ width: '100px', height: '100px' }}
                    >
                      <i className="fas fa-user text-white fa-3x"></i>
                    </div>
                    <h5 className="mb-0">{user?.name}</h5>
                    <p className="text-muted mb-0">{translateRole(user?.role)}</p>
                  </div>
                  <div className="row">
                    <div className="col-12 mb-2">
                      <strong>Email:</strong> {user?.email}
                    </div>
                    <div className="col-12 mb-2">
                      <strong>Função:</strong> {translateRole(user?.role)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ProfileLayout>
    </ProtectedRoute>
  )
}
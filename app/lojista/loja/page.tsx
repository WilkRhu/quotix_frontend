'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { API_BASE_URL } from '../../../lib/api'

interface Loja {
  id: string
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  logo?: string
  planoId?: string
  plano?: {
    id: string
    nome: string
    precoMensal?: number
    precoAnual?: number
  }
}

export default function MinhaLoja() {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [loja, setLoja] = useState<Loja | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: ''
  })
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const formatCNPJ = (value: string) => {
    const cnpj = value.replace(/\D/g, '')
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const formatCEP = (value: string) => {
    const cep = value.replace(/\D/g, '')
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const buscarEnderecoPorCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        if (response.data && !response.data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: response.data.logradouro || '',
            cidade: response.data.localidade || '',
            estado: response.data.uf || ''
          }))
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }

  const carregarLoja = async () => {
    if (!user?.id) {
      // Usuário não autenticado
      setLoja(null)
      setLoading(false)
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/api/lojas/usuario/${user.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLoja(response.data)
      setFormData({
        nome: response.data.nome,
        cnpj: response.data.cnpj,
        email: response.data.email,
        telefone: response.data.telefone,
        endereco: response.data.endereco,
        cidade: response.data.cidade,
        estado: response.data.estado,
        cep: response.data.cep
      })
      if (response.data.logo) {
        setLogoPreview(response.data.logo)
      }
    } catch (error: any) {
      console.error('Erro ao carregar loja:', error)
      // Se a loja não foi encontrada (404), trata como se não existisse
      if (error.response?.status === 404) {
        console.log('Loja não encontrada, mostrando formulário de criação')
        setLoja(null)
      } else {
        showToast('Erro ao carregar dados da loja', 'error')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setLogoFile(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (loja) {
        // Atualizar loja existente
        await axios.post(`${API_BASE_URL}/api/api/lojas/${loja.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        })

        // Upload da foto se foi selecionada
        if (logoFile) {
          const logoFormData = new FormData()
          logoFormData.append('logo', logoFile)
          await axios.post(`${API_BASE_URL}/api/api/lojas/${loja.id}/logo`, logoFormData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          })
        }

        setIsEditing(false)
        await carregarLoja()
        showToast('Loja atualizada com sucesso!', 'success')
      } else {
        // Criar nova loja
        const createData = {
          ...formData,
          ativo: true
        }

        const response = await axios.post(`${API_BASE_URL}/api/api/lojas`, createData, {
          headers: { Authorization: `Bearer ${token}` }
        })

        const novaLojaId = response.data.id

        // Upload da foto se foi selecionada
        if (logoFile) {
          const logoFormData = new FormData()
          logoFormData.append('logo', logoFile)
          await axios.post(`${API_BASE_URL}/api/api/lojas/${novaLojaId}/logo`, logoFormData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          })
        }

        showToast('Loja criada com sucesso!', 'success')
        
        // Pequeno delay para garantir que o backend processou tudo
        setTimeout(() => {
          window.location.reload()
        }, 1000)
      }
    } catch (error) {
      console.error('Erro ao salvar loja:', error)
      showToast('Erro ao salvar loja', 'error')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    if (loja) {
      setFormData({
        nome: loja.nome,
        cnpj: loja.cnpj,
        email: loja.email,
        telefone: loja.telefone,
        endereco: loja.endereco,
        cidade: loja.cidade,
        estado: loja.estado,
        cep: loja.cep
      })
      setLogoFile(null)
      setLogoPreview(loja.logo ? `${API_BASE_URL}/uploads/lojas/logomarcas/${loja.logo}` : null)
    }
    setIsEditing(false)
  }

  useEffect(() => {
    if (token && user) {
      carregarLoja()
    }
  }, [token, user])

  if (loading) {
    return (
      <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
        <DashboardLayout title="Minha Loja">
          <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Carregando...</span>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  if (!loja) {
    // Mostrar formulário de criação de loja
    return (
      <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
        <DashboardLayout title="Cadastrar Minha Loja">
          <div className="row">
            <div className="col-12">
              <div className="card">
                <div className="card-header pb-0 bg-gradient-primary text-white">
                  <div className="d-flex align-items-center">
                    <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                      <i className="fas fa-store fa-lg text-white"></i>
                    </div>
                    <div>
                      <h5 className="mb-1">Cadastro da Loja</h5>
                      <p className="mb-0 small opacity-75">Complete as informações da sua loja para começar</p>
                    </div>
                  </div>
                </div>
                <div className="card-body">
                  <div className="row">
                    <div className="col-md-4 mb-4">
                      <div className="text-center">
                        <label className="form-label fw-bold mb-3">Logo da Loja</label>
                        <div
                          className="border-2 border-dashed border-primary rounded-3 d-flex flex-column align-items-center justify-content-center p-4 mb-3 cursor-pointer transition-all"
                          style={{
                            cursor: 'pointer',
                            minHeight: '140px',
                            background: logoPreview ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: logoPreview ? 'inherit' : 'white'
                          }}
                          onClick={() => document.getElementById('logoInput')?.click()}
                        >
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo"
                              className="rounded-3 shadow-sm"
                              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
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
                          id="logoInput"
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                        <small className="text-muted">JPG, PNG, GIF (máx. 2MB)</small>
                      </div>
                    </div>
                    <div className="col-md-8">
                      <div className="row g-3">
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Nome da Loja *</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.nome}
                            onChange={(e) => setFormData({...formData, nome: e.target.value})}
                            placeholder="Digite o nome da loja"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">CNPJ *</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                            placeholder="00.000.000/0000-00"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Email *</label>
                          <input
                            type="email"
                            className="form-control form-control-lg"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            placeholder="contato@loja.com"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Telefone *</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.telefone}
                            onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                            placeholder="(00) 00000-0000"
                            required
                          />
                        </div>
                        <div className="col-md-4">
                          <label className="form-label fw-bold">CEP *</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.cep}
                            onChange={(e) => setFormData({...formData, cep: formatCEP(e.target.value)})}
                            onBlur={(e) => buscarEnderecoPorCEP(e.target.value)}
                            placeholder="00000-000"
                            required
                          />
                        </div>
                        <div className="col-md-8">
                          <label className="form-label fw-bold">Endereço *</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.endereco}
                            onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                            placeholder="Rua, número, bairro"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Cidade *</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.cidade}
                            onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                            placeholder="Cidade"
                            required
                          />
                        </div>
                        <div className="col-md-6">
                          <label className="form-label fw-bold">Estado *</label>
                          <input
                            type="text"
                            className="form-control form-control-lg"
                            value={formData.estado}
                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                            placeholder="UF"
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="row mt-4">
                    <div className="col-12 d-flex justify-content-end gap-2">
                    <div className="d-flex justify-content-end">
                      <button
                        type="button"
                        className="btn btn-primary btn-lg px-4"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Criando Loja...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-2"></i>
                            Criar Loja
                          </>
                        )}
                      </button>
                    </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
      <DashboardLayout title="Minha Loja">
        <div className="row">
          <div className="col-12">
            <div className="card shadow-lg border-0">
              <div className="card-header pb-0 d-flex justify-content-between align-items-center bg-gradient-primary text-white">
                <div className="d-flex align-items-center">
                  {logoPreview && !isEditing && (
                    <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3 d-flex align-items-center justify-content-center" style={{ width: '50px', height: '50px' }}>
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="rounded-circle"
                        style={{ width: '40px', height: '40px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                  {!logoPreview && (
                    <div className="bg-white bg-opacity-20 rounded-circle p-2 me-3">
                      <i className="fas fa-store fa-lg text-white"></i>
                    </div>
                  )}
                  <div>
                    <h5 className="mb-1">Configurações da Loja</h5>
                    <p className="mb-0 small opacity-75">Gerencie as informações da sua loja</p>
                  </div>
                </div>
                {!isEditing && (
                  <button
                    className="btn btn-light btn-lg px-4"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="fas fa-edit me-2"></i>
                    Editar
                  </button>
                )}
              </div>
              <div className="card-body">
                <div className="row">
                  {isEditing && (
                    <div className="col-md-4 mb-4">
                      <div className="text-center">
                        <label className="form-label fw-bold mb-3">Logo da Loja</label>
                        <div
                          className="border-2 border-dashed border-primary rounded-3 d-flex flex-column align-items-center justify-content-center p-4 mb-3 cursor-pointer transition-all"
                          style={{
                            cursor: 'pointer',
                            minHeight: '140px',
                            background: logoPreview ? 'transparent' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: logoPreview ? 'inherit' : 'white'
                          }}
                          onClick={() => document.getElementById('logoInput')?.click()}
                        >
                          {logoPreview ? (
                            <img
                              src={logoPreview}
                              alt="Logo"
                              className="rounded-3 shadow-sm"
                              style={{ width: '100px', height: '100px', objectFit: 'contain' }}
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
                          id="logoInput"
                          type="file"
                          style={{ display: 'none' }}
                          accept="image/*"
                          onChange={handleLogoChange}
                        />
                        <small className="text-muted">JPG, PNG, GIF (máx. 2MB)</small>
                      </div>
                    </div>
                  )}
                  <div className={isEditing ? "col-md-8" : "col-12"}>
                    <div className="row">
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Nome da Loja</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.nome}
                            onChange={(e) => setFormData({...formData, nome: e.target.value})}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark fw-bold" style={{ cursor: 'default' }}>{loja.nome}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">CNPJ</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.cnpj}
                            onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark" style={{ cursor: 'default' }}>{loja.cnpj}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Email</label>
                        {isEditing ? (
                          <input
                            type="email"
                            className="form-control"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark" style={{ cursor: 'default' }}>{loja.email}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Telefone</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.telefone}
                            onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark" style={{ cursor: 'default' }}>{loja.telefone}</div>
                        )}
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">CEP</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.cep}
                            onChange={(e) => setFormData({...formData, cep: formatCEP(e.target.value)})}
                            onBlur={(e) => buscarEnderecoPorCEP(e.target.value)}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark" style={{ cursor: 'default' }}>{loja.cep}</div>
                        )}
                      </div>
                      <div className="col-md-8 mb-3">
                        <label className="form-label">Endereço</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.endereco}
                            onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark" style={{ cursor: 'default' }}>{loja.endereco}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Cidade</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.cidade}
                            onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark" style={{ cursor: 'default' }}>{loja.cidade}</div>
                        )}
                      </div>
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Estado</label>
                        {isEditing ? (
                          <input
                            type="text"
                            className="form-control"
                            value={formData.estado}
                            onChange={(e) => setFormData({...formData, estado: e.target.value})}
                            required
                          />
                        ) : (
                          <div className="form-control bg-light text-dark" style={{ cursor: 'default' }}>{loja.estado}</div>
                        )}
                      </div>
                      {loja.plano && (
                        <div className="col-12 mb-3">
                          <label className="form-label">Plano Atual</label>
                          <div className="border rounded p-3 bg-light">
                            <h6 className="mb-1">{loja.plano.nome}</h6>
                            <p className="mb-0 text-muted">
                              {(() => {
                                const mensal = loja.plano?.precoMensal ?? (loja.plano?.precoAnual ? Number((loja.plano.precoAnual / 12).toFixed(2)) : 0)
                                return `Valor mensal: R$ ${Number(mensal || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                              })()}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="row mt-4">
                    <div className="col-12 d-flex justify-content-end gap-2">
                      <button
                        className="btn btn-secondary"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        Cancelar
                      </button>
                      <button
                        className="btn btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-save me-1"></i>
                            Salvar Alterações
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
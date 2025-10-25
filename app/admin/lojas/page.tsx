'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { Loja } from '@/types/loja'
import { PlanoVenda } from '@/types/planos-venda'
import { API_BASE_URL } from '../../../lib/api'

const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

type LojaFormData = {
  nome: string
  cnpj: string
  email: string
  telefone: string
  endereco: string
  cidade: string
  estado: string
  cep: string
  planoId: string
  lojistaUserId: string
  lojistaNome: string
  lojistaEmail: string
  lojistaSenha: string
}

type LojistaUser = {
  id: string
  name: string
  email: string
  role: Role
  lojaId?: string | null
}

type ResponsavelModo = 'existing' | 'new' | 'none'

const initialFormData: LojaFormData = {
  nome: '',
  cnpj: '',
  email: '',
  telefone: '',
  endereco: '',
  cidade: '',
  estado: '',
  cep: '',
  planoId: '',
  lojistaUserId: '',
  lojistaNome: '',
  lojistaEmail: '',
  lojistaSenha: '',
}

export default function GestaoLojas() {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const [lojas, setLojas] = useState<Loja[]>([])
  const [planos, setPlanos] = useState<PlanoVenda[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editandoLoja, setEditandoLoja] = useState<Loja | null>(null)
  const [formData, setFormData] = useState<LojaFormData>(initialFormData)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [lojistas, setLojistas] = useState<LojistaUser[]>([])
  const [responsavelModo, setResponsavelModo] = useState<ResponsavelModo>('none')
  const [carregandoLojistas, setCarregandoLojistas] = useState(false)

  const isUsuarioDisponivel = (usuario: LojistaUser) =>
    !usuario.lojaId || (editandoLoja && usuario.lojaId === editandoLoja.id)

  const responsavelAtual = editandoLoja?.userId
    ? lojistas.find(usuario => usuario.id === editandoLoja.userId)
    : undefined
  const podeSelecionarLojistaExistente = lojistas.some(isUsuarioDisponivel)

  const formatCNPJ = (value: string) => {
    const cnpj = value.replace(/\D/g, '')
    return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5')
  }

  const handleCNPJChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formattedCNPJ = formatCNPJ(value)
    setFormData(prev => ({ ...prev, cnpj: formattedCNPJ }))
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

  const carregarPlanos = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/planos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlanos(response.data)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      showToast('Erro ao carregar planos', 'error')
    }
  }

  const carregarLojistas = async () => {
    if (!token) return
    try {
      setCarregandoLojistas(true)
      const response = await axios.get(`${API_BASE_URL}/api/users/lojistas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLojistas(response.data)
    } catch (error) {
      console.error('Erro ao carregar usuários lojistas:', error)
      showToast('Erro ao carregar usuários lojistas', 'error')
    } finally {
      setCarregandoLojistas(false)
    }
  }

  useEffect(() => {
    // Só carrega dados se o usuário é admin
    if (token && user && user.role === Role.ADMIN) {
      carregarLojas()
      carregarPlanos()
      carregarLojistas()
    }
  }, [token, user])

  const carregarLojas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/lojas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLojas(response.data)
    } catch (error) {
      console.error('Erro ao carregar lojas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      showToast('Sessão expirada. Faça login novamente.', 'error')
      return
    }

    if (responsavelModo === 'existing' && !formData.lojistaUserId) {
      showToast('Selecione um usuário lojista responsável.', 'error')
      return
    }

    if (responsavelModo === 'new') {
      if (!formData.lojistaNome || !formData.lojistaEmail || !formData.lojistaSenha) {
        showToast('Preencha nome, email e senha do usuário lojista responsável.', 'error')
        return
      }
    }

    const payload: Record<string, any> = {
      nome: formData.nome,
      cnpj: formData.cnpj,
      email: formData.email,
      telefone: formData.telefone,
      endereco: formData.endereco,
      cidade: formData.cidade,
      estado: formData.estado,
      cep: formData.cep,
      planoId: formData.planoId || undefined,
    }

    if (!payload.planoId) {
      delete payload.planoId
    }

    if (responsavelModo === 'existing' && formData.lojistaUserId) {
      payload.lojistaUserId = formData.lojistaUserId
    }

    if (responsavelModo === 'new') {
      payload.criarUsuarioLojista = true
      payload.lojistaNome = formData.lojistaNome
      payload.lojistaEmail = formData.lojistaEmail
      payload.lojistaSenha = formData.lojistaSenha
    }

    if (editandoLoja && responsavelModo === 'none' && editandoLoja.userId) {
      payload.desvincularUsuario = true
    }

    try {
      let lojaId: string | undefined
      if (editandoLoja) {
        await axios.post(`${API_BASE_URL}/api/lojas/${editandoLoja.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        lojaId = editandoLoja.id
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/lojas`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        })
        lojaId = response.data.id
      }

      if (logoFile && lojaId) {
        const logoFormData = new FormData()
        logoFormData.append('logo', logoFile)
        await axios.post(`${API_BASE_URL}/api/lojas/${lojaId}/logo`, logoFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        })
      }

      setShowModal(false)
      setEditandoLoja(null)
      setLogoFile(null)
      setLogoPreview(null)
      setFormData(initialFormData)
      setResponsavelModo('none')
      await carregarLojas()
      await carregarLojistas()
      showToast(editandoLoja ? 'Loja atualizada com sucesso!' : 'Loja cadastrada com sucesso!', 'success')
    } catch (error: unknown) {
      console.error('Erro ao salvar loja:', error)
      if (axios.isAxiosError(error)) {
        const message = (error.response?.data as any)?.message
        const texto = Array.isArray(message) ? message[0] : message
        showToast(texto || 'Erro ao salvar loja', 'error')
      } else {
        showToast('Erro ao salvar loja', 'error')
      }
    }
  }

  const handleEditar = (loja: any) => {
    setEditandoLoja(loja)
    setLogoFile(null)
    setLogoPreview(loja.logo ? `${API_BASE_URL}/uploads/lojas/logomarcas/${loja.logo}` : null)
    setFormData({
      nome: loja.nome,
      cnpj: loja.cnpj,
      email: loja.email,
      telefone: loja.telefone,
      endereco: loja.endereco,
      cidade: loja.cidade,
      estado: loja.estado,
      cep: loja.cep,
      planoId: loja.planoId || '',
      lojistaUserId: loja.userId || '',
      lojistaNome: '',
      lojistaEmail: '',
      lojistaSenha: ''
    })
    setResponsavelModo(loja.userId ? 'existing' : 'none')
    setShowModal(true)
  }

  const handleDesativar = async (id: string) => {
    if (confirm('Deseja realmente desativar esta loja?')) {
      try {
        await axios.post(`${API_BASE_URL}/api/lojas/${id}/desativar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        await carregarLojas()
        showToast('Loja desativada com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao desativar loja:', error)
        showToast('Erro ao desativar loja', 'error')
      }
    }
  }

  const handleAtivar = async (id: string) => {
    if (confirm('Deseja realmente ativar esta loja?')) {
      try {
        await axios.post(`${API_BASE_URL}/api/lojas/${id}/ativar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        await carregarLojas()
        showToast('Loja ativada com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao ativar loja:', error)
        showToast('Erro ao ativar loja', 'error')
      }
    }
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setLogoFile(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setLogoPreview(null)
    }
  }

  const handleNovaLoja = () => {
    setEditandoLoja(null)
    setLogoFile(null)
    setLogoPreview(null)
    const lojistasSemVinculo = lojistas.filter(lojista => !lojista.lojaId)
    const modoInicial: ResponsavelModo = lojistasSemVinculo.length > 0 ? 'existing' : 'new'
    const defaultForm: LojaFormData = {
      ...initialFormData,
      lojistaUserId: modoInicial === 'existing' && lojistasSemVinculo[0] ? lojistasSemVinculo[0].id : '',
    }
    setFormData(defaultForm)
    setResponsavelModo(modoInicial)
    setShowModal(true)
  }

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <DashboardLayout title="Gestão de Lojas">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between">
                <h6>Lojas Cadastradas</h6>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleNovaLoja}
                >
                  <i className="fas fa-plus me-1"></i>
                  Nova Loja
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Logo</th>
                        <th>Loja</th>
                        <th>CNPJ</th>
                        <th>Cidade</th>
                        <th>Plano</th>
                        <th>Responsável</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {lojas.map((loja: Loja) => (
                        <tr key={loja.id}>
                          <td>
                            {loja.logo ? (
                              <img 
                                src={`${API_BASE_URL}/uploads/lojas/logomarcas/${loja.logo}`}
                                alt="Logo"
                                className="rounded"
                                style={{ width: '40px', height: '40px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div 
                                className="bg-gradient-secondary rounded d-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className="fas fa-image text-white"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <div>
                              <h6 className="mb-0">{loja.nome}</h6>
                              <small className="text-muted">{loja.email}</small>
                            </div>
                          </td>
                          <td>{loja.cnpj}</td>
                          <td>{loja.cidade}/{loja.estado}</td>
                          <td>
                            {loja.planoId ? (
                              (() => {
                                const plano = planos.find(p => p.id === loja.planoId)
                                return plano ? (
                                  <div>
                                    <strong className="d-block">{plano.nome}</strong>
                                    <small className="text-muted">
                                      {Number(plano.precoMensal) > 0 
                                        ? `${formatarMoeda(Number(plano.precoMensal))}/mês`
                                        : `${formatarMoeda(Number(plano.precoAnual))}/ano`
                                      }
                                    </small>
                                  </div>
                                ) : (
                                  <span className="text-warning">
                                    <i className="fas fa-exclamation-triangle me-1"></i>
                                    Plano não encontrado
                                  </span>
                                )
                              })()
                            ) : (
                              <span className="text-warning">
                                <i className="fas fa-exclamation-triangle me-1"></i>
                                Sem plano
                              </span>
                            )}
                          </td>
                          <td>
                            {loja.responsavel ? (
                              <div>
                                <strong className="d-block">{loja.responsavel.name}</strong>
                                <small className="text-muted">{loja.responsavel.email}</small>
                              </div>
                            ) : (
                              <span className="text-muted">
                                <i className="fas fa-user-slash me-1"></i>
                                Sem responsável
                              </span>
                            )}
                          </td>
                          <td>
                            <span className={`badge badge-sm ${loja.ativo ? 'bg-gradient-success' : 'bg-gradient-secondary'}`}>
                              {loja.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-link text-dark p-0 me-2"
                              onClick={() => handleEditar(loja)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {loja.ativo ? (
                              <button 
                                className="btn btn-link text-danger p-0"
                                onClick={() => handleDesativar(loja.id)}
                                title="Desativar"
                              >
                                <i className="fas fa-ban"></i>
                              </button>
                            ) : (
                              <button 
                                className="btn btn-link text-success p-0"
                                onClick={() => handleAtivar(loja.id)}
                                title="Ativar"
                              >
                                <i className="fas fa-check-circle"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editandoLoja ? 'Editar Loja' : 'Nova Loja'}</h5>
                  <button 
                    type="button" 
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="row">
                      <div className="col-md-4 mb-4">
                        <div className="text-center">
                          <label className="form-label">Logo da Loja</label>
                          <div 
                            className="position-relative mb-3"
                            style={{ cursor: 'pointer' }}
                            onClick={() => document.getElementById('logoInput')?.click()}
                          >
                            {logoPreview ? (
                              <div className="position-relative">
                                <img 
                                  src={logoPreview}
                                  alt="Preview"
                                  className="img-fluid rounded border"
                                  style={{ maxHeight: '150px', width: '100%', objectFit: 'contain' }}
                                />
                                <div 
                                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded"
                                  style={{ 
                                    backgroundColor: 'rgba(0,0,0,0.5)', 
                                    opacity: 0,
                                    transition: 'opacity 0.3s ease'
                                  }}
                                  onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
                                  onMouseLeave={(e) => e.currentTarget.style.opacity = '0'}
                                >
                                  <i className="fas fa-camera text-white fa-2x"></i>
                                </div>
                              </div>
                            ) : (
                              <div 
                                className="bg-light border rounded d-flex align-items-center justify-content-center position-relative"
                                style={{ height: '150px', transition: 'all 0.3s ease' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.backgroundColor = '#e9ecef'
                                  e.currentTarget.style.borderColor = '#007bff'
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.backgroundColor = '#f8f9fa'
                                  e.currentTarget.style.borderColor = '#dee2e6'
                                }}
                              >
                                <div className="text-center">
                                  <i className="fas fa-camera text-primary fa-3x mb-2"></i>
                                  <div className="text-muted">Clique para adicionar logo</div>
                                </div>
                              </div>
                            )}
                            <input 
                              id="logoInput"
                              type="file" 
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={handleLogoChange}
                            />
                          </div>
                          <small className="text-muted">JPG, PNG, GIF (máx. 2MB)</small>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="row">
                          <div className="col-12 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Nome da Loja"
                              value={formData.nome}
                              onChange={(e) => {
                                const value = e.target.value
                                setFormData(prev => ({
                                  ...prev,
                                  nome: value,
                                  lojistaNome: responsavelModo === 'new' && !prev.lojistaNome ? value : prev.lojistaNome
                                }))
                              }}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="CNPJ"
                              value={formData.cnpj}
                              onChange={handleCNPJChange}
                              maxLength={18}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Telefone"
                              value={formData.telefone}
                              onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <input 
                              type="email" 
                              className="form-control"
                              placeholder="Email"
                              value={formData.email}
                              onChange={(e) => {
                                const value = e.target.value
                                setFormData(prev => ({
                                  ...prev,
                                  email: value,
                                  lojistaEmail: responsavelModo === 'new' && !prev.lojistaEmail ? value : prev.lojistaEmail
                                }))
                              }}
                              required
                            />
                          </div>
                          <div className="col-md-8 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Cidade"
                              value={formData.cidade}
                              onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Estado"
                              value={formData.estado}
                              onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="row mt-3">
                      <div className="col-12">
                        <label className="form-label">Plano de Acesso</label>
                        <select 
                          className="form-control"
                          value={formData.planoId}
                          onChange={(e) => setFormData(prev => ({ ...prev, planoId: e.target.value }))}
                        >
                          <option value="">Selecione um plano</option>
                          {planos.map((plano) => (
                            <option key={plano.id} value={plano.id}>
                              {plano.nome} - {
                                Number(plano.precoMensal) > 0 
                                  ? `${formatarMoeda(Number(plano.precoMensal))}/mês`
                                  : `${formatarMoeda(Number(plano.precoAnual))}/ano`
                              }
                            </option>
                          ))}
                        </select>
                        <small className="text-muted">
                          Selecione o plano de acesso à plataforma para esta loja
                        </small>
                      </div>
                    </div>

                    <div className="row mt-4">
                      <div className="col-12">
                        <label className="form-label d-block">Responsável pela loja</label>
                        <div className="btn-group" role="group" aria-label="Opções de responsável">
                          <input
                            type="radio"
                            className="btn-check"
                            name="responsavelModo"
                            id="responsavel-existing"
                            value="existing"
                            checked={responsavelModo === 'existing'}
                            disabled={!carregandoLojistas && !podeSelecionarLojistaExistente}
                            onChange={() => {
                              if (carregandoLojistas) return
                              setResponsavelModo('existing')
                              setFormData(prev => {
                                const selecionadoAindaValido = prev.lojistaUserId && lojistas.some(usuario => usuario.id === prev.lojistaUserId && isUsuarioDisponivel(usuario))
                                let fallbackId = selecionadoAindaValido ? prev.lojistaUserId : ''

                                if (!fallbackId && editandoLoja?.userId) {
                                  const usuarioAtual = lojistas.find(usuario => usuario.id === editandoLoja.userId && isUsuarioDisponivel(usuario))
                                  if (usuarioAtual) {
                                    fallbackId = usuarioAtual.id
                                  }
                                }

                                if (!fallbackId) {
                                  const primeiroDisponivel = lojistas.find(isUsuarioDisponivel)
                                  fallbackId = primeiroDisponivel?.id ?? ''
                                }

                                return { ...prev, lojistaUserId: fallbackId }
                              })
                            }}
                          />
                          <label className={`btn btn-outline-primary ${responsavelModo === 'existing' ? 'active' : ''}`} htmlFor="responsavel-existing">
                            Selecionar existente
                          </label>
                          <input
                            type="radio"
                            className="btn-check"
                            name="responsavelModo"
                            id="responsavel-new"
                            value="new"
                            checked={responsavelModo === 'new'}
                            onChange={() => {
                              setResponsavelModo('new')
                              setFormData(prev => ({ ...prev, lojistaUserId: '' }))
                            }}
                          />
                          <label className={`btn btn-outline-primary ${responsavelModo === 'new' ? 'active' : ''}`} htmlFor="responsavel-new">
                            Criar novo
                          </label>
                          <input
                            type="radio"
                            className="btn-check"
                            name="responsavelModo"
                            id="responsavel-none"
                            value="none"
                            checked={responsavelModo === 'none'}
                            onChange={() => {
                              setResponsavelModo('none')
                              setFormData(prev => ({ ...prev, lojistaUserId: '' }))
                            }}
                          />
                          <label className={`btn btn-outline-secondary ${responsavelModo === 'none' ? 'active' : ''}`} htmlFor="responsavel-none">
                            {editandoLoja ? (editandoLoja.userId ? 'Remover vínculo' : 'Sem responsável') : 'Definir depois'}
                          </label>
                        </div>
                        <div className="d-flex flex-wrap align-items-center gap-2 mt-2">
                          <small className="text-muted mb-0">
                            Escolha um responsável para que ele tenha acesso ao painel da loja.
                          </small>
                          <Link href="/admin/usuarios" className="btn btn-link btn-sm px-0">
                            <i className="fas fa-users-cog me-1"></i>
                            Gerenciar usuários lojistas
                          </Link>
                        </div>
                        {editandoLoja && responsavelAtual && (
                          <div className="alert alert-info mt-3 py-2">
                            <i className="fas fa-user-check me-2"></i>
                            Responsável atual: <strong>{responsavelAtual.name}</strong> ({responsavelAtual.email})
                          </div>
                        )}
                      </div>

                      {responsavelModo === 'existing' && (
                        <div className="col-12 mt-3">
                          {carregandoLojistas ? (
                            <div className="text-muted">
                              <i className="fas fa-spinner fa-spin me-2"></i>
                              Carregando usuários disponíveis...
                            </div>
                          ) : (
                            <>
                              <select
                                className="form-control"
                                value={formData.lojistaUserId}
                                onChange={(e) => setFormData(prev => ({ ...prev, lojistaUserId: e.target.value }))}
                                required
                              >
                                <option value="">Selecione um usuário lojista</option>
                                {lojistas.map((usuario) => (
                                  <option
                                    key={usuario.id}
                                    value={usuario.id}
                                    disabled={Boolean(usuario.lojaId) && usuario.lojaId !== editandoLoja?.id}
                                  >
                                    {usuario.name} - {usuario.email}
                                    {usuario.lojaId
                                      ? usuario.lojaId === editandoLoja?.id
                                        ? ' (responsável atual)'
                                        : ' (já vinculado a outra loja)'
                                      : ''}
                                  </option>
                                ))}
                              </select>
                              <small className="text-muted d-block mt-1">
                                Usuários já vinculados a outra loja aparecem indisponíveis.
                              </small>
                              <button
                                type="button"
                                className="btn btn-link btn-sm px-0 mt-2"
                                onClick={() => {
                                  setResponsavelModo('new')
                                  setFormData(prev => ({ ...prev, lojistaUserId: '' }))
                                }}
                              >
                                <i className="fas fa-user-plus me-1"></i>
                                Criar novo usuário lojista
                              </button>
                            </>
                          )}
                        </div>
                      )}

                      {responsavelModo === 'new' && (
                        <>
                          <div className="col-md-4 mt-3">
                            <input
                              type="text"
                              className="form-control"
                              placeholder="Nome do responsável"
                              value={formData.lojistaNome}
                              onChange={(e) => setFormData(prev => ({ ...prev, lojistaNome: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="col-md-4 mt-3">
                            <input
                              type="email"
                              className="form-control"
                              placeholder="Email do responsável"
                              value={formData.lojistaEmail}
                              onChange={(e) => setFormData(prev => ({ ...prev, lojistaEmail: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="col-md-4 mt-3">
                            <input
                              type="password"
                              className="form-control"
                              placeholder="Senha provisória"
                              value={formData.lojistaSenha}
                              onChange={(e) => setFormData(prev => ({ ...prev, lojistaSenha: e.target.value }))}
                              required
                            />
                          </div>
                          <div className="col-12">
                            <small className="text-muted">
                              A senha provisória pode ser alterada pelo usuário após o primeiro acesso.
                            </small>
                          </div>
                        </>
                      )}

                      {responsavelModo === 'none' && (
                        <div className="col-12 mt-3">
                          <div className="alert alert-secondary mb-0 py-2">
                            {editandoLoja
                              ? editandoLoja.userId
                                ? 'O vínculo atual será removido e a loja ficará sem responsável.'
                                : 'A loja permanecerá sem responsável por enquanto. Você pode associar um responsável a qualquer momento.'
                              : 'Nenhum usuário será vinculado agora. Você pode associar um responsável posteriormente.'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="modal-footer">
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => setShowModal(false)}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      {editandoLoja ? 'Atualizar' : 'Cadastrar'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </ProtectedRoute>
  )
}
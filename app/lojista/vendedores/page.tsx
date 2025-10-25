'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { API_BASE_URL } from '../../../lib/api'

interface Vendedor {
  id: string
  nome: string
  email: string
  telefone: string
  ativo: boolean
  foto?: string
  createdAt: string
  cpf?: string
  nisPis?: string
  endereco?: string
  numero?: string
  complemento?: string
  cidade?: string
  estado?: string
  cep?: string
  salarioBase?: number
  lojaId?: string
}

export default function VendedoresLojista() {
  const { user, token } = useAuth()
  const { showToast } = useToast()
  const [vendedores, setVendedores] = useState<Vendedor[]>([])
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [buscandoCEP, setBuscandoCEP] = useState(false)
  const [editandoVendedor, setEditandoVendedor] = useState<Vendedor | null>(null)

  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    nisPis: '',
    endereco: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    cep: '',
    salarioBase: '',
    password: '',
    foto: null as File | null
  })

  useEffect(() => {
    loadVendedores()
  }, [token])

  const loadVendedores = async () => {
    if (!token) {
      showToast('Você precisa estar logado para acessar esta página', 'error')
      return
    }

    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedores`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      setVendedores(response.data || [])
    } catch (error: any) {
      console.error('Erro ao carregar vendedores:', error)
      // Só mostra erro se não for 404 (não encontrado) ou se for outro tipo de erro real
      if (error.response?.status !== 404) {
        showToast('Erro ao carregar vendedores', 'error')
      }
      setVendedores([])
    }
  }

  const formatCPF = (value: string) => {
    const cpf = value.replace(/\D/g, '')
    return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
  }

  const formatCEP = (value: string) => {
    const cep = value.replace(/\D/g, '')
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2')
  }

  const formatMoney = (value: string) => {
    const numericValue = value.replace(/\D/g, '')
    const floatValue = parseFloat(numericValue) / 100
    return floatValue.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const buscarEnderecoPorCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length === 8) {
      setBuscandoCEP(true)
      try {
        const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`)
        if (response.data && !response.data.erro) {
          setForm(prev => ({
            ...prev,
            endereco: response.data.logradouro || '',
            cidade: response.data.localidade || '',
            estado: response.data.uf || ''
          }))
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      } finally {
        setBuscandoCEP(false)
      }
    }
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setForm({...form, foto: file})
      const reader = new FileReader()
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    if (!token) {
      showToast('Você precisa estar logado para realizar esta ação', 'error')
      setLoading(false)
      return
    }

    try {
      // Validação dos campos obrigatórios
      if (!form.nome || !form.email || !form.telefone || !form.cpf || !form.endereco || !form.numero || !form.cidade || !form.estado || !form.cep) {
        showToast('Por favor, preencha todos os campos obrigatórios', 'error')
        setLoading(false)
        return
      }

      if (!editandoVendedor && !form.password) {
        showToast('Por favor, informe uma senha para o vendedor', 'error')
        setLoading(false)
        return
      }

      const dataToSend = {
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        cpf: form.cpf.replace(/\D/g, ''),
        nisPis: form.nisPis || null,
        endereco: form.endereco,
        numero: form.numero,
        complemento: form.complemento || null,
        cidade: form.cidade,
        estado: form.estado,
        cep: form.cep.replace(/\D/g, ''),
        salarioBase: form.salarioBase ? parseFloat(form.salarioBase) / 100 : null,
        ...(editandoVendedor ? {} : { password: form.password })
      }

      let vendedorId
      if (editandoVendedor) {
        await axios.post(`${API_BASE_URL}/api/vendedores/${editandoVendedor.id}`, dataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        vendedorId = editandoVendedor.id
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/vendedores`, dataToSend, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        vendedorId = response.data.id
      }

      if (form.foto && vendedorId) {
        const fotoFormData = new FormData()
        fotoFormData.append('foto', form.foto)
        await axios.post(`${API_BASE_URL}/api/vendedores/${vendedorId}/foto`, fotoFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        })
      }

      setShowModal(false)
      setEditandoVendedor(null)
      setForm({
        nome: '',
        email: '',
        telefone: '',
        cpf: '',
        nisPis: '',
        endereco: '',
        numero: '',
        complemento: '',
        cidade: '',
        estado: '',
        cep: '',
        salarioBase: '',
        password: '',
        foto: null
      })
      setFotoPreview(null)
      loadVendedores()
      showToast(editandoVendedor ? 'Vendedor atualizado com sucesso!' : 'Vendedor cadastrado com sucesso!', 'success')
    } catch (error: any) {
      showToast(`Erro ao salvar vendedor: ${error.response?.data?.message || error.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleEditar = (vendedor: any) => {
    setEditandoVendedor(vendedor)
    setFotoPreview(vendedor.foto ? `${API_BASE_URL}/api/uploads/vendedores/fotos/${vendedor.foto}` : null)
    setForm({
      nome: vendedor.nome,
      email: vendedor.email,
      telefone: vendedor.telefone,
      cpf: vendedor.cpf || '',
      nisPis: vendedor.nisPis || '',
      endereco: vendedor.endereco || '',
      numero: vendedor.numero || '',
      complemento: vendedor.complemento || '',
      cidade: vendedor.cidade || '',
      estado: vendedor.estado || '',
      cep: vendedor.cep || '',
      salarioBase: vendedor.salarioBase ? String(Math.round(vendedor.salarioBase * 100)) : '',
      password: '',
      foto: null
    })
    setShowModal(true)
  }

  const handleDesativar = async (id: string) => {
    if (confirm('Deseja realmente desativar este vendedor?')) {
      if (!token) {
        showToast('Você precisa estar logado para realizar esta ação', 'error')
        return
      }

      try {
        await axios.post(`${API_BASE_URL}/api/vendedores/${id}/desativar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        loadVendedores()
        showToast('Vendedor desativado com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao desativar vendedor:', error)
        showToast('Erro ao desativar vendedor', 'error')
      }
    }
  }

  const handleAtivar = async (id: string) => {
    if (confirm('Deseja realmente ativar este vendedor?')) {
      if (!token) {
        showToast('Você precisa estar logado para realizar esta ação', 'error')
        return
      }

      try {
        await axios.post(`${API_BASE_URL}/api/vendedores/${id}/ativar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        loadVendedores()
        showToast('Vendedor ativado com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao ativar vendedor:', error)
        showToast('Erro ao ativar vendedor', 'error')
      }
    }
  }

  return (
    <ProtectedRoute requiredRoles={[Role.LOJISTA, Role.LOGIST]}>
      <DashboardLayout title="Vendedores">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between">
                <h6>Gerenciar Vendedores</h6>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setEditandoVendedor(null)
                    setFotoPreview(null)
                    setForm({
                      nome: '',
                      email: '',
                      telefone: '',
                      cpf: '',
                      nisPis: '',
                      endereco: '',
                      numero: '',
                      complemento: '',
                      cidade: '',
                      estado: '',
                      cep: '',
                      salarioBase: '',
                      password: '',
                      foto: null
                    })
                    setShowModal(true)
                  }}
                >
                  <i className="fas fa-plus me-1"></i>
                  Novo Vendedor
                </button>
              </div>
              <div className="card-body">
                <div className="table-responsive">
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Foto</th>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Telefone</th>
                        <th>Status</th>
                        <th>Data Cadastro</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendedores.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center py-4">
                            <div className="text-muted">
                              <i className="fas fa-inbox fa-3x mb-3" style={{ display: 'block', opacity: 0.5 }}></i>
                              <p className="mb-0">Nenhum vendedor cadastrado ainda</p>
                              <small>Clique em "Novo Vendedor" para adicionar um</small>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        vendedores.map((vendedor) => (
                        <tr key={vendedor.id}>
                          <td>
                            {vendedor.foto ? (
                              <img 
                                src={`${API_BASE_URL}/api/uploads/vendedores/fotos/${vendedor.foto}`}
                                alt="Foto"
                                className="rounded-circle"
                                style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="bg-gradient-secondary rounded-circle d-flex align-items-center justify-content-center"
                                style={{ width: '40px', height: '40px' }}
                              >
                                <i className="fas fa-user text-white"></i>
                              </div>
                            )}
                          </td>
                          <td>
                            <h6 className="mb-0">{vendedor.nome}</h6>
                          </td>
                          <td>{vendedor.email}</td>
                          <td>{vendedor.telefone}</td>
                          <td>
                            <span className={`badge badge-sm ${vendedor.ativo ? 'bg-gradient-success' : 'bg-gradient-danger'}`}>
                              {vendedor.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            {new Date(vendedor.createdAt).toLocaleDateString('pt-BR')}
                          </td>
                          <td>
                            <button
                              className="btn btn-link text-dark p-0 me-2"
                              onClick={() => handleEditar(vendedor)}
                              title="Editar"
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            {vendedor.ativo ? (
                              <button
                                className="btn btn-link text-danger p-0"
                                onClick={() => handleDesativar(vendedor.id)}
                                title="Desativar"
                              >
                                <i className="fas fa-ban"></i>
                              </button>
                            ) : (
                              <button
                                className="btn btn-link text-success p-0"
                                onClick={() => handleAtivar(vendedor.id)}
                                title="Ativar"
                              >
                                <i className="fas fa-check-circle"></i>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Novo Vendedor */}
        {showModal && (
          <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">{editandoVendedor ? 'Editar Vendedor' : 'Novo Vendedor'}</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  ></button>
                </div>
                <form onSubmit={handleSubmit}>
                  <div className="modal-body">
                    <div className="container-fluid">
                      <div className="row mb-3">
                        <div className="col-md-4">
                          <div className="text-center">
                            <div
                              className="border rounded d-inline-block p-3 cursor-pointer"
                              style={{ cursor: 'pointer', minHeight: '120px', minWidth: '120px' }}
                              onClick={() => document.getElementById('fotoInput')?.click()}
                            >
                              {fotoPreview ? (
                                <img
                                  src={fotoPreview}
                                  alt="Preview"
                                  className="rounded"
                                  style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                                />
                              ) : (
                                <div className="text-center">
                                  <i className="fas fa-camera text-primary fa-3x mb-2"></i>
                                  <div className="text-muted small">Clique para adicionar foto</div>
                                </div>
                              )}
                            </div>
                            <input
                              id="fotoInput"
                              type="file"
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={handleFotoChange}
                            />
                            <div className="mt-2">
                              <small className="text-muted">JPG, PNG, GIF (máx. 2MB)</small>
                            </div>
                          </div>
                        </div>
                        <div className="col-md-8">
                          <div className="row">
                            <div className="col-md-6 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Nome do Vendedor"
                                value={form.nome}
                                onChange={(e) => setForm({...form, nome: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <input
                                type="email"
                                className="form-control"
                                placeholder="Email"
                                value={form.email}
                                onChange={(e) => setForm({...form, email: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <input
                                type="password"
                                className="form-control"
                                placeholder="Senha"
                                value={form.password}
                                onChange={(e) => setForm({...form, password: e.target.value})}
                                required={!editandoVendedor}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Telefone"
                                value={form.telefone}
                                onChange={(e) => setForm({...form, telefone: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="CPF"
                                value={form.cpf}
                                onChange={(e) => setForm({...form, cpf: formatCPF(e.target.value)})}
                                maxLength={14}
                                required
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="NIS/PIS (opcional)"
                                value={form.nisPis}
                                onChange={(e) => setForm({...form, nisPis: e.target.value})}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Salário Base (R$)"
                                value={form.salarioBase ? `R$ ${formatMoney(form.salarioBase)}` : ''}
                                onChange={(e) => {
                                  const value = e.target.value.replace(/[^\d]/g, '')
                                  setForm({...form, salarioBase: value})
                                }}
                              />
                            </div>
                            <div className="col-md-6 mb-3">
                              <div className="position-relative">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="CEP"
                                  value={form.cep}
                                  onChange={(e) => {
                                    const cepFormatado = formatCEP(e.target.value)
                                    setForm({...form, cep: cepFormatado})
                                    if (cepFormatado.replace(/\D/g, '').length === 8) {
                                      buscarEnderecoPorCEP(cepFormatado)
                                    }
                                  }}
                                  maxLength={9}
                                  required
                                />
                                {buscandoCEP && (
                                  <div className="position-absolute" style={{ right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                      <span className="visually-hidden">Carregando...</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              <small className="text-muted">Digite o CEP para preencher automaticamente</small>
                            </div>
                            <div className="col-md-8 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Endereço"
                                value={form.endereco}
                                onChange={(e) => setForm({...form, endereco: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-4 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Número"
                                value={form.numero}
                                onChange={(e) => setForm({...form, numero: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-12 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Complemento (opcional)"
                                value={form.complemento}
                                onChange={(e) => setForm({...form, complemento: e.target.value})}
                              />
                            </div>
                            <div className="col-md-8 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Cidade"
                                value={form.cidade}
                                onChange={(e) => setForm({...form, cidade: e.target.value})}
                                required
                              />
                            </div>
                            <div className="col-md-4 mb-3">
                              <input
                                type="text"
                                className="form-control"
                                placeholder="Estado"
                                value={form.estado}
                                onChange={(e) => setForm({...form, estado: e.target.value})}
                                required
                              />
                            </div>
                          </div>
                        </div>
                      </div>
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
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Salvando...' : 'Cadastrar Vendedor'}
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
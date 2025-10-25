'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { API_BASE_URL } from '../../../lib/api'

export default function GestaoVendedores() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [vendedores, setVendedores] = useState([])
  const [lojas, setLojas] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editandoVendedor, setEditandoVendedor] = useState<any>(null)
  const [formData, setFormData] = useState({
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
    lojaId: ''
  })
  const [fotoFile, setFotoFile] = useState<File | null>(null)
  const [fotoPreview, setFotoPreview] = useState<string | null>(null)
  const [filtroLoja, setFiltroLoja] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [buscandoCEP, setBuscandoCEP] = useState(false)

  const carregarVendedores = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/vendedores`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setVendedores(response.data)
    } catch (error) {
      console.error('Erro ao carregar vendedores:', error)
    }
  }

  const carregarLojas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/admin/lojas`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setLojas(response.data)
    } catch (error) {
      console.error('Erro ao carregar lojas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const dataToSend = {
        ...formData,
        salarioBase: formData.salarioBase ? parseFloat(formData.salarioBase) / 100 : null
      }
      
      let vendedorId
      if (editandoVendedor) {
        const response = await axios.post(`${API_BASE_URL}/api/vendedores/${editandoVendedor.id}`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
        vendedorId = editandoVendedor.id
      } else {
        const response = await axios.post(`${API_BASE_URL}/api/vendedores`, dataToSend, {
          headers: { Authorization: `Bearer ${token}` }
        })
        vendedorId = response.data.id
      }

      // Upload da foto se foi selecionada
      if (fotoFile && vendedorId) {
        const fotoFormData = new FormData()
        fotoFormData.append('foto', fotoFile)
        await axios.post(`${API_BASE_URL}/api/vendedores/${vendedorId}/foto`, fotoFormData, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          }
        })
      }

      setShowModal(false)
      setEditandoVendedor(null)
      setFotoFile(null)
      setFotoPreview(null)
      setFormData({
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
        lojaId: ''
      })
      await carregarVendedores()
      showToast(editandoVendedor ? 'Vendedor atualizado com sucesso!' : 'Vendedor cadastrado com sucesso!', 'success')
    } catch (error) {
      console.error('Erro ao salvar vendedor:', error)
      showToast('Erro ao salvar vendedor', 'error')
    }
  }

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setFotoFile(file)
    
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    } else {
      setFotoPreview(null)
    }
  }

  const handleEditar = (vendedor: any) => {
    setEditandoVendedor(vendedor)
    setFotoFile(null)
    setFotoPreview(vendedor.foto ? `${API_BASE_URL}/api/uploads/vendedores/fotos/${vendedor.foto}` : null)
    const lojaSelecionada = lojas.find((loja: any) => loja.id == vendedor.lojaId) as any
    setFiltroLoja(lojaSelecionada ? `${lojaSelecionada.nome} - ${lojaSelecionada.cidade}/${lojaSelecionada.estado}` : '')
    setShowDropdown(false)
    setFormData({
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
      lojaId: vendedor.lojaId
    })
    setShowModal(true)
  }

  const handleDesativar = async (id: string) => {
    if (confirm('Deseja realmente desativar este vendedor?')) {
      try {
        await axios.post(`${API_BASE_URL}/api/vendedores/${id}/desativar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        await carregarVendedores()
        showToast('Vendedor desativado com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao desativar vendedor:', error)
        showToast('Erro ao desativar vendedor', 'error')
      }
    }
  }

  const handleAtivar = async (id: string) => {
    if (confirm('Deseja realmente ativar este vendedor?')) {
      try {
        await axios.post(`${API_BASE_URL}/api/vendedores/${id}/ativar`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        })
        await carregarVendedores()
        showToast('Vendedor ativado com sucesso!', 'success')
      } catch (error) {
        console.error('Erro ao ativar vendedor:', error)
        showToast('Erro ao ativar vendedor', 'error')
      }
    }
  }

  const handleNovoVendedor = () => {
    setEditandoVendedor(null)
    setFotoFile(null)
    setFotoPreview(null)
    setFiltroLoja('')
    setShowDropdown(false)
    setBuscandoCEP(false)
    setFormData({
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
      lojaId: ''
    })
    setShowModal(true)
  }

  const lojasFiltradas = lojas.filter((loja: any) => 
    loja.nome.toLowerCase().includes(filtroLoja.toLowerCase()) ||
    loja.cidade.toLowerCase().includes(filtroLoja.toLowerCase())
  )

  const selecionarLoja = (loja: any) => {
    setFormData({...formData, lojaId: loja.id})
    setFiltroLoja(`${loja.nome} - ${loja.cidade}/${loja.estado}`)
    setShowDropdown(false)
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
          setFormData(prev => ({
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

  useEffect(() => {
    if (token) {
      carregarVendedores()
      carregarLojas()
    }
  }, [token])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.position-relative')) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <DashboardLayout title="Gestão de Vendedores">
        <div className="row">
          <div className="col-12">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between">
                <h6>Vendedores Cadastrados</h6>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={handleNovoVendedor}
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
                        <th>Vendedor</th>
                        <th>Loja</th>
                        <th>Contato</th>
                        <th>Status</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendedores.map((vendedor: any) => (
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
                            <div>
                              <h6 className="mb-0">{vendedor.nome}</h6>
                              <small className="text-muted">{vendedor.email}</small>
                            </div>
                          </td>
                          <td>{vendedor.loja?.nome}</td>
                          <td>{vendedor.telefone}</td>
                          <td>
                            <span className={`badge badge-sm ${vendedor.ativo ? 'bg-gradient-success' : 'bg-gradient-secondary'}`}>
                              {vendedor.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                          </td>
                          <td>
                            <button 
                              className="btn btn-link text-info p-0 me-2"
                              onClick={() => window.open(`/admin/vendedor/${vendedor.id}/perfil`, '_blank')}
                              title="Ver Perfil"
                            >
                              <i className="fas fa-user"></i>
                            </button>
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
                    <div className="row">
                      <div className="col-md-4 mb-4">
                        <div className="text-center">
                          <label className="form-label">Foto do Vendedor</label>
                          <div 
                            className="position-relative mb-3"
                            style={{ cursor: 'pointer' }}
                            onClick={() => document.getElementById('fotoInput')?.click()}
                          >
                            {fotoPreview ? (
                              <div className="position-relative">
                                <img 
                                  src={fotoPreview}
                                  alt="Preview"
                                  className="img-fluid rounded-circle border"
                                  style={{ width: '150px', height: '150px', objectFit: 'cover' }}
                                />
                                <div 
                                  className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center rounded-circle"
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
                                className="bg-light border rounded-circle d-flex align-items-center justify-content-center position-relative mx-auto"
                                style={{ width: '150px', height: '150px', transition: 'all 0.3s ease' }}
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
                                  <div className="text-muted small">Clique para adicionar foto</div>
                                </div>
                              </div>
                            )}
                            <input 
                              id="fotoInput"
                              type="file" 
                              style={{ display: 'none' }}
                              accept="image/*"
                              onChange={handleFotoChange}
                            />
                          </div>
                          <small className="text-muted">JPG, PNG, GIF (máx. 2MB)</small>
                        </div>
                      </div>
                      <div className="col-md-8">
                        <div className="mb-3 position-relative">
                          <input 
                            type="text"
                            className="form-control"
                            placeholder="Digite para buscar uma loja..."
                            value={filtroLoja}
                            onChange={(e) => {
                              setFiltroLoja(e.target.value)
                              setShowDropdown(true)
                              if (!e.target.value) {
                                setFormData({...formData, lojaId: ''})
                              }
                            }}
                            onFocus={() => setShowDropdown(true)}
                            required
                          />
                          {showDropdown && lojasFiltradas.length > 0 && (
                            <div 
                              className="position-absolute w-100 bg-white border rounded shadow-sm"
                              style={{ top: '100%', zIndex: 1000, maxHeight: '200px', overflowY: 'auto' }}
                            >
                              {lojasFiltradas.map((loja: any) => (
                                <div 
                                  key={loja.id}
                                  className="p-2 border-bottom cursor-pointer"
                                  style={{ cursor: 'pointer' }}
                                  onClick={() => selecionarLoja(loja)}
                                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8f9fa'}
                                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                >
                                  <div className="fw-bold">{loja.nome}</div>
                                  <small className="text-muted">{loja.cidade}/{loja.estado}</small>
                                </div>
                              ))}
                            </div>
                          )}
                          {showDropdown && filtroLoja && lojasFiltradas.length === 0 && (
                            <div 
                              className="position-absolute w-100 bg-white border rounded shadow-sm p-2 text-muted"
                              style={{ top: '100%', zIndex: 1000 }}
                            >
                              Nenhuma loja encontrada
                            </div>
                          )}
                        </div>
                        <div className="row">
                          <div className="col-md-6 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Nome do Vendedor"
                              value={formData.nome}
                              onChange={(e) => setFormData({...formData, nome: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <input 
                              type="email" 
                              className="form-control"
                              placeholder="Email"
                              value={formData.email}
                              onChange={(e) => setFormData({...formData, email: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Telefone"
                              value={formData.telefone}
                              onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="CPF"
                              value={formData.cpf}
                              onChange={(e) => setFormData({...formData, cpf: formatCPF(e.target.value)})}
                              maxLength={14}
                              required
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="NIS/PIS (opcional)"
                              value={formData.nisPis}
                              onChange={(e) => setFormData({...formData, nisPis: e.target.value})}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Salário Base (R$)"
                              value={formData.salarioBase ? `R$ ${formatMoney(formData.salarioBase)}` : ''}
                              onChange={(e) => {
                                const value = e.target.value.replace(/[^\d]/g, '')
                                setFormData({...formData, salarioBase: value})
                              }}
                            />
                          </div>
                          <div className="col-md-6 mb-3">
                            <div className="position-relative">
                              <input 
                                type="text" 
                                className="form-control"
                                placeholder="CEP"
                                value={formData.cep}
                                onChange={(e) => {
                                  const cepFormatado = formatCEP(e.target.value)
                                  setFormData({...formData, cep: cepFormatado})
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
                              value={formData.endereco}
                              onChange={(e) => setFormData({...formData, endereco: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Número"
                              value={formData.numero}
                              onChange={(e) => setFormData({...formData, numero: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-12 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Complemento (opcional)"
                              value={formData.complemento}
                              onChange={(e) => setFormData({...formData, complemento: e.target.value})}
                            />
                          </div>
                          <div className="col-md-8 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Cidade"
                              value={formData.cidade}
                              onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                              required
                            />
                          </div>
                          <div className="col-md-4 mb-3">
                            <input 
                              type="text" 
                              className="form-control"
                              placeholder="Estado"
                              value={formData.estado}
                              onChange={(e) => setFormData({...formData, estado: e.target.value})}
                              required
                            />
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
                    <button type="submit" className="btn btn-primary">
                      {editandoVendedor ? 'Atualizar' : 'Cadastrar'}
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
'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '../../stories/authStore'
import ProtectedRoute from '../../components/ProtectedRoute'
import ProfileLayout from '../../components/ProfileLayout'
import { API_BASE_URL } from '../../lib/api'
import { formatCurrency } from '../../lib/formatters'
import { resolveImageUrl } from '../../lib/images'
import { translateRole } from '../../lib/roles'
import { Role } from '../../types/auth'

interface ClienteVendaResumo {
  id: number
  valorSeguro: number
  valorComissao?: number
  valorTaxa?: number
  valorVeiculo?: number | null
  status: string
  createdAt: string
  metodoPagamento?: string | null
  tipoCotacaoLoja?: { nome?: string } | null
  vendedor?: { nome?: string } | null
}

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
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [vendedor, setVendedor] = useState<any | null>(null)
  const [vendedorLoading, setVendedorLoading] = useState(false)
  const [vendedorError, setVendedorError] = useState('')
  const [loja, setLoja] = useState<any | null>(null)
  const [lojaLoading, setLojaLoading] = useState(false)
  const [lojaError, setLojaError] = useState('')
  const [compras, setCompras] = useState<ClienteVendaResumo[]>([])
  const [comprasLoading, setComprasLoading] = useState(false)
  const [comprasError, setComprasError] = useState('')

  const userFoto = user?.foto

  const profileImageSrc = useMemo(() => {
    if (user?.role === Role.SELLER) {
      const vendedorFoto = resolveImageUrl(vendedor?.foto)
      if (vendedorFoto) {
        return vendedorFoto
      }
    }

    if (user?.role === Role.LOJISTA || user?.role === Role.LOGIST) {
      const logo = loja?.logo as string | undefined
      if (logo) {
        const logoUrl = `${API_BASE_URL}/uploads/lojas/logomarcas/${logo}`
        if (logoUrl) {
          return logoUrl
        }
      }
    }

    const fotoDireta = resolveImageUrl(userFoto)
    if (fotoDireta) {
      return fotoDireta
    }

    return '/assets/img/team-2.jpg'
  }, [user?.role, userFoto, vendedor?.foto, loja?.logo])

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

  useEffect(() => {
    if (!token || user?.role !== Role.SELLER) {
      setVendedor(null)
      setVendedorError('')
      setVendedorLoading(false)
      return
    }

    const fetchVendedor = async () => {
      setVendedorLoading(true)
      setVendedorError('')
      try {
        const response = await fetch(`${API_BASE_URL}/api/vendedor/perfil`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao obter dados do vendedor')
        }

        const data = await response.json()
        setVendedor(data)
      } catch (err) {
        console.error('Erro ao carregar dados do vendedor:', err)
        setVendedor(null)
        setVendedorError('Não foi possível carregar os dados do vendedor.')
      } finally {
        setVendedorLoading(false)
      }
    }

    fetchVendedor()
  }, [token, user?.role])

  useEffect(() => {
    if (!token || !user?.lojaId || (user.role !== Role.LOJISTA && user.role !== Role.LOGIST)) {
      setLoja(null)
      setLojaError('')
      setLojaLoading(false)
      return
    }

    const fetchLoja = async () => {
      setLojaLoading(true)
      setLojaError('')
      try {
        const response = await fetch(`${API_BASE_URL}/api/lojas/${user.lojaId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao obter dados da loja')
        }

        const data = await response.json()
        setLoja(data)
      } catch (err) {
        console.error('Erro ao carregar dados da loja:', err)
        setLoja(null)
        setLojaError('Não foi possível carregar os dados da loja.')
      } finally {
        setLojaLoading(false)
      }
    }

    fetchLoja()
  }, [token, user?.lojaId, user?.role])

  useEffect(() => {
    if (!token || user?.role !== Role.CLIENT || !user?.id) {
      setCompras([])
      setComprasError('')
      setComprasLoading(false)
      return
    }

    const fetchCompras = async () => {
      setComprasLoading(true)
      setComprasError('')
      try {
        const response = await fetch(`${API_BASE_URL}/api/vendas/cliente/${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('Erro ao carregar compras do cliente')
        }

        const data = await response.json()
        const lista = Array.isArray(data) ? data : []
        setCompras(lista)
      } catch (err) {
        console.error('Erro ao carregar compras do cliente:', err)
        setCompras([])
        setComprasError('Não foi possível carregar as suas compras.')
      } finally {
        setComprasLoading(false)
      }
    }

    fetchCompras()
  }, [token, user?.role, user?.id])

  const vendedorEmail = vendedor?.email || user?.email || ''
  const lojaEmail = loja?.email || ''
  const usuarioEmail = user?.email || ''

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
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }
  
  const handleUploadPhoto = async () => {
    if (!selectedFile) return
    
    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('foto', selectedFile)
      
      const response = await fetch(`${API_BASE_URL}/api/users/${user?.id}/foto`, {
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
      window.location.reload()
    } catch (error) {
      setError('Erro ao fazer upload da foto')
    } finally {
      setUploading(false)
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

      // Se está alterando senha, inclui no payload
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

        <div className="card shadow-lg mx-4 card-profile-bottom">
          <div className="card-body p-3">
            <div className="row gx-4">
              <div className="col-auto">
                <div className="avatar avatar-xl position-relative">
                  <img src={profileImageSrc} alt="profile_image" className="profile_image w-100 border-radius-lg shadow-sm" />
                </div>
              </div>
              <div className="col-auto my-auto">
                <div className="h-100">
                  <h5 className="mb-1">{user?.name}</h5>
                  <p className="mb-0 font-weight-bold text-sm">{translateRole(user?.role)}</p>
                  {(user?.role === Role.LOJISTA || user?.role === Role.LOGIST) && loja?.nome && (
                    <p className="text-sm text-muted mb-0">Loja: {loja.nome}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

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
                            <option value="AC">Acre</option>
                            <option value="AL">Alagoas</option>
                            <option value="AP">Amapá</option>
                            <option value="AM">Amazonas</option>
                            <option value="BA">Bahia</option>
                            <option value="CE">Ceará</option>
                            <option value="DF">Distrito Federal</option>
                            <option value="ES">Espírito Santo</option>
                            <option value="GO">Goiás</option>
                            <option value="MA">Maranhão</option>
                            <option value="MT">Mato Grosso</option>
                            <option value="MS">Mato Grosso do Sul</option>
                            <option value="MG">Minas Gerais</option>
                            <option value="PA">Pará</option>
                            <option value="PB">Paraíba</option>
                            <option value="PR">Paraná</option>
                            <option value="PE">Pernambuco</option>
                            <option value="PI">Piauí</option>
                            <option value="RJ">Rio de Janeiro</option>
                            <option value="RN">Rio Grande do Norte</option>
                            <option value="RS">Rio Grande do Sul</option>
                            <option value="RO">Rondônia</option>
                            <option value="RR">Roraima</option>
                            <option value="SC">Santa Catarina</option>
                            <option value="SP">São Paulo</option>
                            <option value="SE">Sergipe</option>
                            <option value="TO">Tocantins</option>
                          </select>
                        </div>
                      </div>
                    </div>
                    
                    {user?.role === Role.CLIENT && (
                      <>
                        <hr className="horizontal dark" />
                        <p className="text-uppercase text-sm">Foto do Perfil</p>
                        <div className="row">
                          <div className="col-md-12">
                            <div className="form-group">
                              <label className="form-control-label">Selecionar Foto</label>
                              <input 
                                className="form-control" 
                                type="file" 
                                accept="image/*"
                                onChange={handleFileChange}
                              />
                              {selectedFile && (
                                <div className="mt-2">
                                  <button 
                                    type="button" 
                                    className="btn btn-info btn-sm"
                                    onClick={handleUploadPhoto}
                                    disabled={uploading}
                                  >
                                    {uploading ? 'Enviando...' : 'Enviar Foto'}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
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
                    {user?.role === Role.SELLER && vendedor?.foto ? (
                      <img
                        src={`${API_BASE_URL}/api/uploads/vendedores/fotos/${vendedor.foto}`}
                        alt="Foto do vendedor"
                        className="rounded-circle mb-3"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="bg-gradient-secondary rounded-circle d-flex align-items-center justify-content-center mx-auto mb-3"
                        style={{ width: '100px', height: '100px' }}
                      >
                        <i className="fas fa-user text-white fa-3x"></i>
                      </div>
                    )}
                    <h5 className="mb-0">{user?.role === Role.SELLER ? (vendedor?.nome || user?.name) : user?.name}</h5>
                    <p className="text-muted mb-0">
                      {user?.role === Role.SELLER ? (vendedor?.loja?.nome || translateRole(user?.role)) : translateRole(user?.role)}
                    </p>
                  </div>

                  {user?.role === Role.SELLER ? (
                    <>
                      {vendedorLoading && (
                        <p className="text-sm text-muted text-center mb-3">Carregando dados...</p>
                      )}
                      {vendedorError && (
                        <div className="alert alert-danger" role="alert">
                          {vendedorError}
                        </div>
                      )}
                      {vendedor && (
                        <div className="row">
                          <div className="col-12 mb-2">
                            <strong>Email:</strong>{' '}
                            {vendedorEmail ? (
                              <a href={`mailto:${vendedorEmail}`} className="text-decoration-none">
                                {vendedorEmail}
                              </a>
                            ) : (
                              '—'
                            )}
                          </div>
                          <div className="col-12 mb-2">
                            <strong>Telefone:</strong> {vendedor.telefone || '—'}
                          </div>
                          <div className="col-12 mb-2">
                            <strong>CPF:</strong> {vendedor.cpf || '—'}
                          </div>
                          {vendedor.nisPis && (
                            <div className="col-12 mb-2">
                              <strong>NIS/PIS:</strong> {vendedor.nisPis}
                            </div>
                          )}
                          {vendedor.loja?.nome && (
                            <div className="col-12 mb-2">
                              <strong>Loja:</strong> {vendedor.loja.nome}
                            </div>
                          )}
                          <div className="col-12 mb-2">
                            <strong>Endereço:</strong> {vendedor.endereco || '—'}
                          </div>
                          <div className="col-12 mb-2">
                            <strong>Cidade:</strong> {vendedor.cidade && vendedor.estado ? `${vendedor.cidade}/${vendedor.estado}` : '—'}
                          </div>
                          <div className="col-12 mb-2">
                            <strong>CEP:</strong> {vendedor.cep || '—'}
                          </div>
                        </div>
                      )}
                      {!vendedorLoading && !vendedor && !vendedorError && (
                        <p className="text-sm text-muted text-center mb-0">Dados do vendedor não encontrados.</p>
                      )}
                    </>
                  ) : user?.role === Role.LOJISTA || user?.role === Role.LOGIST ? (
                    <>
                      {lojaLoading && (
                        <p className="text-sm text-muted text-center mb-3">Carregando dados da loja...</p>
                      )}
                      {lojaError && (
                        <div className="alert alert-danger" role="alert">
                          {lojaError}
                        </div>
                      )}
                      {loja && (
                        <>
                          <div className="d-flex flex-column align-items-center text-center mb-4">
                            {loja.logo ? (
                              <img
                                src={`${API_BASE_URL}/uploads/lojas/logomarcas/${loja.logo}`}
                                alt={`Logo da ${loja.nome}`}
                                className="rounded-circle mb-3"
                                style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="bg-gradient-primary rounded-circle d-flex align-items-center justify-content-center mb-3"
                                style={{ width: '100px', height: '100px' }}
                              >
                                <i className="fas fa-store text-white fa-2x"></i>
                              </div>
                            )}
                            <h5 className="mb-0">{loja.nome}</h5>
                            <p className="text-muted mb-1">CNPJ: {loja.cnpj || '—'}</p>
                            <p className="text-muted mb-0">
                              {loja.cidade && loja.estado ? `${loja.cidade} - ${loja.estado}` : loja.endereco || 'Endereço não informado'}
                            </p>
                          </div>
                          <div className="row">
                            <div className="col-12 mb-2">
                              <strong>Email da loja:</strong>{' '}
                              {lojaEmail ? (
                                <a href={`mailto:${lojaEmail}`} className="text-decoration-none">
                                  {lojaEmail}
                                </a>
                              ) : (
                                '—'
                              )}
                            </div>
                            <div className="col-12 mb-2">
                              <strong>Email do usuário:</strong>{' '}
                              {usuarioEmail ? (
                                <a href={`mailto:${usuarioEmail}`} className="text-decoration-none">
                                  {usuarioEmail}
                                </a>
                              ) : (
                                '—'
                              )}
                            </div>
                            <div className="col-12 mb-2">
                              <strong>Telefone:</strong> {loja.telefone || '—'}
                            </div>
                            <div className="col-12 mb-2">
                              <strong>Endereço:</strong> {loja.endereco || '—'}
                            </div>
                            <div className="col-12 mb-2">
                              <strong>Cidade/Estado:</strong> {loja.cidade && loja.estado ? `${loja.cidade}/${loja.estado}` : '—'}
                            </div>
                            <div className="col-12 mb-2">
                              <strong>CEP:</strong> {loja.cep || '—'}
                            </div>
                            {loja.plano?.nome && (
                              <div className="col-12 mb-2">
                                <strong>Plano Atual:</strong> {loja.plano.nome}
                              </div>
                            )}
                          </div>
                          <div className="d-flex justify-content-center mt-3">
                            <Link href="/lojista/loja" className="btn btn-outline-primary btn-sm">
                              <i className="fas fa-pen me-2"></i>
                              Gerenciar informações da loja
                            </Link>
                          </div>
                        </>
                      )}
                      {!lojaLoading && !loja && !lojaError && (
                        <p className="text-sm text-muted text-center mb-0">Dados da loja não encontrados.</p>
                      )}
                    </>
                  ) : (
                    <div className="row">
                      <div className="col-12 mb-2">
                        <strong>Email:</strong>{' '}
                        {usuarioEmail ? (
                          <a href={`mailto:${usuarioEmail}`} className="text-decoration-none">
                            {usuarioEmail}
                          </a>
                        ) : (
                          '—'
                        )}
                      </div>
                      {user?.telefone && (
                        <div className="col-12 mb-2">
                          <strong>Telefone:</strong> {user.telefone}
                        </div>
                      )}
                      {user?.endereco && (
                        <div className="col-12 mb-2">
                          <strong>Endereço:</strong> {user.endereco}
                        </div>
                      )}
                      {(user?.cidade || user?.estado) && (
                        <div className="col-12 mb-2">
                          <strong>Cidade/Estado:</strong> {user?.cidade && user?.estado ? `${user.cidade}/${user.estado}` : user?.cidade || user?.estado}
                        </div>
                      )}
                      {user?.cep && (
                        <div className="col-12 mb-2">
                          <strong>CEP:</strong> {user.cep}
                        </div>
                      )}
                      <div className="col-12 mb-2">
                        <strong>Função:</strong> {translateRole(user?.role)}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        {user?.role === Role.CLIENT && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card">
                <div className="card-header pb-0 d-flex align-items-center justify-content-between">
                  <p className="mb-0">Minhas Compras</p>
                  {!comprasLoading && compras.length > 0 && (
                    <span className="badge bg-light text-dark">{compras.length} {compras.length === 1 ? 'registro' : 'registros'}</span>
                  )}
                </div>
                <div className="card-body">
                  {comprasLoading ? (
                    <div className="text-center py-3">
                      <div className="spinner-border" role="status">
                        <span className="visually-hidden">Carregando compras...</span>
                      </div>
                    </div>
                  ) : comprasError ? (
                    <div className="alert alert-danger mb-0" role="alert">
                      {comprasError}
                    </div>
                  ) : compras.length === 0 ? (
                    <div className="alert alert-secondary mb-0" role="alert">
                      Você ainda não possui compras registradas.
                    </div>
                  ) : (
                    <div className="list-group">
                      {compras.map((venda) => (
                        <div key={venda.id} className="list-group-item list-group-item-action flex-column align-items-start">
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">Venda #{venda.id}</h6>
                            <small className="text-muted">{new Date(venda.createdAt).toLocaleString('pt-BR')}</small>
                          </div>
                          <p className="mb-1">
                            <strong>Valor do seguro:</strong> {formatCurrency(Number(venda.valorSeguro) || 0)}
                          </p>
                          <div className="d-flex flex-wrap gap-3 small text-muted">
                            <span><strong>Status:</strong> {venda.status}</span>
                            {typeof venda.valorComissao === 'number' ? (
                              <span><strong>Comissão:</strong> {formatCurrency(Number(venda.valorComissao) || 0)}</span>
                            ) : null}
                            {typeof venda.valorTaxa === 'number' && Number(venda.valorTaxa) > 0 ? (
                              <span><strong>Taxas:</strong> {formatCurrency(Number(venda.valorTaxa) || 0)}</span>
                            ) : null}
                            {typeof venda.valorVeiculo === 'number' && Number(venda.valorVeiculo) > 0 ? (
                              <span><strong>Valor do veículo:</strong> {formatCurrency(Number(venda.valorVeiculo) || 0)}</span>
                            ) : null}
                            {venda.metodoPagamento ? (
                              <span><strong>Pagamento:</strong> {venda.metodoPagamento}</span>
                            ) : null}
                            {venda.tipoCotacaoLoja?.nome ? (
                              <span><strong>Plano:</strong> {venda.tipoCotacaoLoja.nome}</span>
                            ) : null}
                            {venda.vendedor?.nome ? (
                              <span><strong>Vendedor:</strong> {venda.vendedor.nome}</span>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </ProfileLayout>
    </ProtectedRoute>
  )
}
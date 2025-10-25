'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { API_BASE_URL } from '../../../lib/api'

interface LojistaUser {
  id: string
  name: string
  email: string
  role: Role
  lojaId?: string | null
  createdAt?: string
}

interface NovoUsuarioForm {
  name: string
  email: string
  password: string
  role: Role
}

const initialForm: NovoUsuarioForm = {
  name: '',
  email: '',
  password: '',
  role: Role.LOJISTA,
}

export default function GestaoUsuariosLojistas() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [usuarios, setUsuarios] = useState<LojistaUser[]>([])
  const [form, setForm] = useState<NovoUsuarioForm>(initialForm)
  const [carregando, setCarregando] = useState(false)
  const [submetendo, setSubmetendo] = useState(false)

  const carregarUsuarios = async () => {
    if (!token) return
    try {
      setCarregando(true)
      const response = await axios.get(`${API_BASE_URL}/users/lojistas`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setUsuarios(response.data)
    } catch (error) {
      console.error('Erro ao carregar usuários lojistas:', error)
      showToast('Erro ao carregar usuários lojistas', 'error')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarUsuarios()
  }, [token])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!token) {
      showToast('Sessão expirada. Faça login novamente.', 'error')
      return
    }

    if (!form.name || !form.email || !form.password) {
      showToast('Preencha nome, email e senha do usuário.', 'error')
      return
    }

    try {
      setSubmetendo(true)
      await axios.post(`${API_BASE_URL}/users`, form, {
        headers: { Authorization: `Bearer ${token}` },
      })
      showToast('Usuário criado com sucesso!', 'success')
      setForm(initialForm)
      await carregarUsuarios()
    } catch (error) {
      console.error('Erro ao criar usuário lojista:', error)
      if (axios.isAxiosError(error)) {
        const mensagem = (error.response?.data as any)?.message
        const texto = Array.isArray(mensagem) ? mensagem[0] : mensagem
        showToast(texto || 'Erro ao criar usuário lojista', 'error')
      } else {
        showToast('Erro ao criar usuário lojista', 'error')
      }
    } finally {
      setSubmetendo(false)
    }
  }

  const usuariosDisponiveis = usuarios.filter(usuario => !usuario.lojaId)

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <DashboardLayout title="Usuários Lojistas">
        <div className="row">
          <div className="col-lg-4">
            <div className="card">
              <div className="card-header pb-0">
                <h6>Criar usuário lojista</h6>
              </div>
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label">Nome</label>
                    <input
                      type="text"
                      className="form-control"
                      value={form.name}
                      onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Nome completo"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Email</label>
                    <input
                      type="email"
                      className="form-control"
                      value={form.email}
                      onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@dominio.com"
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Senha provisória</label>
                    <input
                      type="password"
                      className="form-control"
                      value={form.password}
                      onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Senha temporária"
                      required
                    />
                    <small className="text-muted">O usuário poderá alterá-la no primeiro acesso.</small>
                  </div>
                  <div className="mb-4">
                    <label className="form-label">Perfil</label>
                    <select
                      className="form-select"
                      value={form.role}
                      onChange={(e) => setForm(prev => ({ ...prev, role: e.target.value as Role }))}
                      required
                    >
                      <option value={Role.LOJISTA}>Lojista</option>
                      <option value={Role.LOGIST}>Logist</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary w-100" disabled={submetendo}>
                    {submetendo ? (
                      <>
                        <i className="fas fa-spinner fa-spin me-2"></i>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <i className="fas fa-save me-2"></i>
                        Criar usuário
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-8 mt-4 mt-lg-0">
            <div className="card">
              <div className="card-header pb-0 d-flex justify-content-between align-items-center">
                <h6>Usuários lojistas cadastrados</h6>
                <button className="btn btn-outline-primary btn-sm" onClick={carregarUsuarios} disabled={carregando}>
                  {carregando ? (
                    <>
                      <i className="fas fa-spinner fa-spin me-1"></i>
                      Atualizando
                    </>
                  ) : (
                    <>
                      <i className="fas fa-sync me-1"></i>
                      Atualizar lista
                    </>
                  )}
                </button>
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-12 col-sm-6">
                    <div className="border rounded p-3 h-100">
                      <div className="text-muted text-sm">Total cadastrados</div>
                      <div className="h4 mb-0">{usuarios.length}</div>
                    </div>
                  </div>
                  <div className="col-12 col-sm-6 mt-3 mt-sm-0">
                    <div className="border rounded p-3 h-100">
                      <div className="text-muted text-sm">Disponíveis para vincular</div>
                      <div className="h4 mb-0">{usuariosDisponiveis.length}</div>
                    </div>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table align-items-center mb-0">
                    <thead>
                      <tr>
                        <th>Nome</th>
                        <th>Email</th>
                        <th>Perfil</th>
                        <th>Vinculado a loja?</th>
                        <th>Criado em</th>
                      </tr>
                    </thead>
                    <tbody>
                      {usuarios.length === 0 && !carregando ? (
                        <tr>
                          <td colSpan={5} className="text-center text-muted py-4">
                            Nenhum usuário lojista cadastrado.
                          </td>
                        </tr>
                      ) : (
                        usuarios.map(usuario => (
                          <tr key={usuario.id}>
                            <td>
                              <strong>{usuario.name}</strong>
                            </td>
                            <td>{usuario.email}</td>
                            <td className="text-capitalize">{usuario.role}</td>
                            <td>
                              {usuario.lojaId ? (
                                <span className="badge bg-gradient-success">Sim</span>
                              ) : (
                                <span className="badge bg-gradient-secondary">Não</span>
                              )}
                            </td>
                            <td>{usuario.createdAt ? new Date(usuario.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
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
      </DashboardLayout>
    </ProtectedRoute>
  )
}

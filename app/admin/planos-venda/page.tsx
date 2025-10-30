"use client"

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { Role } from '../../../types/auth'
import { PlanoVenda } from '@/types/planos-venda'
import { API_BASE_URL } from '@/lib/api'

const formatarMoeda = (valor: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

const parseMoeda = (valor: string): number => {
  return Number(valor.replace(/\D/g, '')) / 100
}

export default function PlanosVenda() {
  const { token } = useAuth()
  const { showToast } = useToast()
  const [planos, setPlanos] = useState<PlanoVenda[]>([])
  const [loading, setLoading] = useState(false)
  const [planoEmEdicao, setPlanoEmEdicao] = useState<PlanoVenda | null>(null)
  const [form, setForm] = useState({ nome: '', descricao: '', precoMensal: 0, precoAnual: 0, isTrial: false })

  const alternarStatusPlano = async (plano: PlanoVenda) => {
    try {
      const novoStatus = plano.status === 'ativo' ? 'inativo' : 'ativo'
      await axios.patch(`${API_BASE_URL}/api/planos/${plano.id}`, 
        { status: novoStatus },
        { headers: { Authorization: `Bearer ${token}` }}
      )
      showToast(`Plano ${novoStatus === 'ativo' ? 'ativado' : 'desativado'} com sucesso`, 'success')
      carregarPlanos()
    } catch (error) {
      console.error('Erro ao alterar status do plano:', error)
      showToast('Erro ao alterar status do plano', 'error')
    }
  }

  const editarPlano = (plano: PlanoVenda) => {
    setPlanoEmEdicao(plano)
    setForm({
      nome: plano.nome,
      descricao: plano.descricao || '',
      precoMensal: Number(plano.precoMensal),
      precoAnual: Number(plano.precoAnual),
      isTrial: false
    })
  }

  const salvarEdicao = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!planoEmEdicao) return

    try {
      await axios.patch(`${API_BASE_URL}/api/planos/${planoEmEdicao.id}`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Plano atualizado com sucesso', 'success')
      setPlanoEmEdicao(null)
      setForm({ nome: '', descricao: '', precoMensal: 0, precoAnual: 0, isTrial: false })
      carregarPlanos()
    } catch (error) {
      console.error('Erro ao atualizar plano:', error)
      showToast('Erro ao atualizar plano', 'error')
    }
  }

  const cancelarEdicao = () => {
    setPlanoEmEdicao(null)
    setForm({ nome: '', descricao: '', precoMensal: 0, precoAnual: 0, isTrial: false })
  }

  const carregarPlanos = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API_BASE_URL}/api/planos`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setPlanos(res.data)
    } catch (error) {
      console.error('Erro ao carregar planos:', error)
      showToast('Erro ao carregar planos', 'error')
    } finally {
      setLoading(false)
    }
  }

  const criarPlano = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await axios.post(`${API_BASE_URL}/api/planos`, form, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Plano criado com sucesso', 'success')
      setForm({ nome: '', descricao: '', precoMensal: 0, precoAnual: 0, isTrial: false })
      carregarPlanos()
    } catch (error) {
      console.error('Erro ao criar plano:', error)
      showToast('Erro ao criar plano', 'error')
    }
  }

  useEffect(() => {
    if (token) carregarPlanos()
  }, [token])

  return (
    <ProtectedRoute requiredRoles={[Role.ADMIN]}>
      <DashboardLayout title="Planos de Acesso à Plataforma">
        <div className="row">
          <div className="col-md-8">
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Planos Cadastrados</h5>
              </div>
              <div className="card-body">
                {loading ? (
                  <p>Carregando...</p>
                ) : planos.length === 0 ? (
                  <p>Nenhum plano cadastrado.</p>
                ) : (
                  <ul className="list-group">
                    {planos.map((pl) => (
                      <li key={pl.id} className="list-group-item">
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <div className="d-flex align-items-center">
                              <strong>{pl.nome}</strong>
                              <span className={`badge ms-2 ${pl.status === 'ativo' ? 'bg-success' : 'bg-danger'}`}>
                                {pl.status}
                              </span>
                            </div>
                            <div className="text-muted" dangerouslySetInnerHTML={{ __html: pl.descricao || '' }} />
                          </div>
                          <div className="d-flex align-items-center gap-3">
                            {!pl.isTrial ? (
                              <div className="text-end me-3">
                                <div>
                                  <small className="text-muted">Mensal: </small>
                                  <small>
                                    {formatarMoeda(
                                      (Number(pl.precoMensal) > 0
                                        ? Number(pl.precoMensal)
                                        : Number(pl.precoAnual) > 0
                                          ? Number(pl.precoAnual)
                                          : 0)
                                    )}
                                  </small>
                                </div>
                                <div>
                                  <small className="text-muted">Anual: </small>
                                  <small>{formatarMoeda(Number(pl.precoAnual))}</small>
                                </div>
                              </div>
                            ) : (
                              <div className="text-end me-3">
                                <span className="badge bg-success">
                                  <i className="fas fa-gift me-1"></i>Gratuito
                                </span>
                              </div>
                            )}
                            <div className="btn-group">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => editarPlano(pl)}
                                disabled={!!planoEmEdicao}
                              >
                                <i className="fas fa-edit"></i>
                              </button>
                              <button
                                className={`btn btn-outline-${pl.status === 'ativo' ? 'danger' : 'success'} btn-sm`}
                                onClick={() => alternarStatusPlano(pl)}
                                disabled={!!planoEmEdicao}
                              >
                                <i className={`fas fa-${pl.status === 'ativo' ? 'ban' : 'check'}`}></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card">
              <div className="card-header">
                <h6 className="mb-0">{planoEmEdicao ? 'Editar Plano' : 'Criar Novo Plano'}</h6>
              </div>
              <div className="card-body">
                <form onSubmit={planoEmEdicao ? salvarEdicao : criarPlano}>
                  <div className="mb-3">
                    <label className="form-label">Nome</label>
                    <input className="form-control" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Descrição</label>
                    <input className="form-control" value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Preço Mensal</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatarMoeda(form.precoMensal)}
                      onChange={(e) => {
                        const valor = parseMoeda(e.target.value)
                        if (!isNaN(valor)) {
                          setForm({ ...form, precoMensal: valor })
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Preço Anual</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatarMoeda(form.precoAnual)}
                      onChange={(e) => {
                        const valor = parseMoeda(e.target.value)
                        if (!isNaN(valor)) {
                          setForm({ ...form, precoAnual: valor })
                        }
                      }}
                      onFocus={(e) => e.target.select()}
                    />
                  </div>
                  <div className="mb-3">
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="isTrial"
                        checked={form.isTrial}
                        onChange={(e) => setForm({ ...form, isTrial: e.target.checked })}
                      />
                      <label className="form-check-label" htmlFor="isTrial">
                        <i className="fas fa-gift me-2"></i>Marcar como Plano Trial
                      </label>
                    </div>
                  </div>
                  <div className="d-flex gap-2">
                    <button type="submit" className={`btn btn-${planoEmEdicao ? 'success' : 'primary'}`}>
                      {planoEmEdicao ? 'Salvar Alterações' : 'Criar Plano'}
                    </button>
                    {planoEmEdicao && (
                      <button type="button" className="btn btn-secondary" onClick={cancelarEdicao}>
                        Cancelar
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
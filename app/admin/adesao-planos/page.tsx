'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import DashboardLayout from '@/components/DashboardLayout'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/stories/authStore'
import { useToast } from '@/stories/toastStore'
import { Role } from '@/types/auth'
import { formatarMoeda } from '@/lib/formatters'
import { API_BASE_URL } from '@/lib/api'


interface Loja {
    id: string
    nome: string
    email: string
    cidade: string
    estado: string
    logo?: string
    planoId?: string | null
    ativo: boolean
    createdAt: string
}

interface Plano {
    id: string
    nome: string
    precoMensal: string
    precoAnual: string
}

export default function AdesaoPlanos() {
    const { token } = useAuth()
    const { showToast } = useToast()

    const [loading, setLoading] = useState(false)
    const [lojas, setLojas] = useState<Loja[]>([])
    const [planos, setPlanos] = useState<Plano[]>([])
    const [filtro, setFiltro] = useState({ busca: '', planoId: '' })

    const [selectedLoja, setSelectedLoja] = useState('')
    const [formData, setFormData] = useState({ planoId: '' })

    const carregarPlanos = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/planos`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setPlanos(res.data)
        } catch (err) {
            console.error(err)
            showToast('Erro ao carregar planos', 'error')
        }
    }

    const carregarLojas = async () => {
        setLoading(true)
        try {
            const res = await axios.get(`${API_BASE_URL}/lojas`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            setLojas(res.data)
        } catch (err) {
            console.error(err)
            showToast('Erro ao carregar lojas', 'error')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (token) {
            carregarPlanos()
            carregarLojas()
        }
    }, [token])

    const lojasFiltradas = lojas.filter((loja) => {
        const q = filtro.busca.trim().toLowerCase()
        const matchBusca =
            !q ||
            loja.nome.toLowerCase().includes(q) ||
            loja.cidade.toLowerCase().includes(q) ||
            loja.estado.toLowerCase().includes(q)

        const matchPlano = !filtro.planoId || loja.planoId === filtro.planoId
        return matchBusca && matchPlano && !!loja.planoId
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedLoja || !formData.planoId) {
            showToast('Selecione loja e plano', 'warning')
            return
        }

        try {
            await axios.post(`${API_BASE_URL}/lojas/${selectedLoja}/plano`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            })
            showToast('Adesão ao plano realizada com sucesso!', 'success')
            setSelectedLoja('')
            setFormData({ planoId: '' })
            carregarLojas()
        } catch (err) {
            console.error(err)
            showToast('Erro ao realizar adesão ao plano', 'error')
        }
    }

    return (
        <ProtectedRoute requiredRoles={[Role.ADMIN]}>
            <DashboardLayout title="Adesão aos Planos">
                <div className="row mb-4">
                    <div className="col-md-8">
                        <div className="input-group">
                            <span className="input-group-text">
                                <i className="fas fa-search"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control"
                                placeholder="Buscar por nome da loja, cidade ou estado..."
                                value={filtro.busca}
                                onChange={(e) => setFiltro((p) => ({ ...p, busca: e.target.value }))}
                            />
                        </div>
                    </div>
                    <div className="col-md-4">
                        <select
                            className="form-select"
                            value={filtro.planoId}
                            onChange={(e) => setFiltro((p) => ({ ...p, planoId: e.target.value }))}
                        >
                            <option value="">Todos os Planos</option>
                            {planos.map((plano) => (
                                <option key={plano.id} value={plano.id}>
                                    {plano.nome}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h6 className="mb-0">Lojas com Planos Ativos</h6>
                    </div>
                    <div className="card-body">
                        {loading ? (
                            <div className="text-center py-4">
                                <div className="spinner-border text-primary" role="status">
                                    <span className="visually-hidden">Carregando...</span>
                                </div>
                            </div>
                        ) : lojasFiltradas.length === 0 ? (
                            <div className="text-center py-4 text-muted">
                                <i className="fas fa-store-slash fa-3x mb-3"></i>
                                <p>Nenhuma loja encontrada com os filtros selecionados.</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table align-middle">
                                    <thead>
                                        <tr>
                                            <th>Loja</th>
                                            <th>Localização</th>
                                            <th>Plano</th>
                                            <th>Valor</th>
                                            <th>Data de Adesão</th>
                                            <th>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {lojasFiltradas.slice(0, 5).map((loja) => {
                                            const plano = planos.find((p) => p.id === loja.planoId)
                                            return (
                                                <tr key={loja.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            {loja.logo ? (
                                                                <img
                                                                    src={`${API_BASE_URL}/uploads/lojas/logomarcas/${loja.logo}`}
                                                                    alt={`Logo ${loja.nome}`}
                                                                    className="rounded me-2"
                                                                    style={{ width: '32px', height: '32px', objectFit: 'cover' }}
                                                                />
                                                            ) : (
                                                                <div
                                                                    className="rounded bg-light d-flex align-items-center justify-content-center me-2"
                                                                    style={{ width: '32px', height: '32px' }}
                                                                >
                                                                    <i className="fas fa-store text-muted"></i>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <strong className="d-block">{loja.nome}</strong>
                                                                <small className="text-muted">{loja.email}</small>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        {loja.cidade}/{loja.estado}
                                                    </td>
                                                    <td>
                                                        {plano ? <span className="badge bg-primary">{plano.nome}</span> : <span className="badge bg-warning">Plano não encontrado</span>}
                                                    </td>
                                                    <td>
                                                        {plano && (
                                                            Number(plano.precoMensal) > 0 ? (
                                                                <>
                                                                    <strong>{formatarMoeda(Number(plano.precoMensal))}</strong>
                                                                    <small className="text-muted">/mês</small>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <strong>{formatarMoeda(Number(plano.precoAnual))}</strong>
                                                                    <small className="text-muted">/ano</small>
                                                                </>
                                                            )
                                                        )}
                                                    </td>
                                                    <td>
                                                        <small className="text-muted">{new Date(loja.createdAt).toLocaleDateString('pt-BR')}</small>
                                                    </td>
                                                    <td>
                                                        <span className={`badge bg-${loja.ativo ? 'success' : 'danger'}`}>{loja.ativo ? 'Ativo' : 'Inativo'}</span>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header">
                        <h6 className="mb-0">Configurar Adesão ao Plano</h6>
                    </div>
                    <form onSubmit={handleSubmit}>
                        <div className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Selecionar Loja</label>
                                <select className="form-control" value={selectedLoja} onChange={(e) => setSelectedLoja(e.target.value)}>
                                    <option value="">Selecione uma loja</option>
                                    {lojas.map((l) => (
                                        <option key={l.id} value={l.id}>
                                            {l.nome} - {l.cidade}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Selecionar Plano</label>
                                <select className="form-control" value={formData.planoId} onChange={(e) => setFormData({ planoId: e.target.value })}>
                                    <option value="">Selecione um plano</option>
                                    {planos.map((p) => (
                                        <option key={p.id} value={p.id}>
                                            {p.nome}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="alert alert-info">
                                Observação: aqui você associa a loja a um plano de acesso (mensalidade/recursos).
                                As regras de cálculo para adesão ao seguro pertencem às ofertas.
                            </div>
                        </div>
                        <div className="card-footer">
                            <button type="submit" className="btn btn-primary">Confirmar Adesão</button>
                        </div>
                    </form>
                </div>
            </DashboardLayout>
        </ProtectedRoute>
    )
}
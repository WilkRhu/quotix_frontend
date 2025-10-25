'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import { Role } from '../../../types/auth'
import { useAuth } from '../../../stories/authStore'
import { API_BASE_URL } from '../../../lib/api'
import { useToast } from '../../../stories/toastStore'

interface ClienteData {
  nome: string
  email: string
  cpf: string
  telefone: string
  senha: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  estado: string
  cep: string
}

export default function CadastrarCliente() {
  const { token, user } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClienteData>({
    nome: '',
    email: '',
    cpf: '',
    telefone: '',
    senha: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: '',
    estado: '',
    cep: ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const clienteData = {
        name: formData.nome,
        email: formData.email,
        password: formData.senha,
        lojaId: user?.lojaId,
        vendedorId: user?.vendedorId,
        rua: formData.rua,
        numero: formData.numero,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep
      }

      const response = await axios.post(
        `${API_BASE_URL}/api/users/cliente`,
        clienteData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      showToast('Cliente cadastrado com sucesso!', 'success')
      router.push('/vendedor/nova-venda')
    } catch (error: any) {
      console.error('Erro ao cadastrar cliente:', error)
      const errorMessage = error.response?.data?.message || 'Erro ao cadastrar cliente'
      showToast(errorMessage, 'error')
    } finally {
      setLoading(false)
    }
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
                    <i className="fas fa-user-plus me-2"></i>
                    Cadastrar Novo Cliente
                  </h4>
                </div>
                <div className="card-body">
                  <form onSubmit={handleSubmit}>
                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="nome">Nome Completo *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="nome"
                            name="nome"
                            value={formData.nome}
                            onChange={handleInputChange}
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="email">Email *</label>
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
                        <div className="form-group">
                          <label htmlFor="cpf">CPF *</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cpf"
                            name="cpf"
                            value={formData.cpf}
                            onChange={handleInputChange}
                            placeholder="000.000.000-00"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="telefone">Telefone *</label>
                          <input
                            type="tel"
                            className="form-control"
                            id="telefone"
                            name="telefone"
                            value={formData.telefone}
                            onChange={handleInputChange}
                            placeholder="(11) 99999-9999"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="senha">Senha *</label>
                          <input
                            type="password"
                            className="form-control"
                            id="senha"
                            name="senha"
                            value={formData.senha}
                            onChange={handleInputChange}
                            placeholder="Digite uma senha"
                            required
                          />
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="form-group">
                          <label htmlFor="cep">CEP</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cep"
                            name="cep"
                            value={formData.cep}
                            onChange={handleInputChange}
                            placeholder="00000-000"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-8">
                        <div className="form-group">
                          <label htmlFor="rua">Rua</label>
                          <input
                            type="text"
                            className="form-control"
                            id="rua"
                            name="rua"
                            value={formData.rua}
                            onChange={handleInputChange}
                            placeholder="Nome da rua"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="numero">Número</label>
                          <input
                            type="text"
                            className="form-control"
                            id="numero"
                            name="numero"
                            value={formData.numero}
                            onChange={handleInputChange}
                            placeholder="123"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row">
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="bairro">Bairro</label>
                          <input
                            type="text"
                            className="form-control"
                            id="bairro"
                            name="bairro"
                            value={formData.bairro}
                            onChange={handleInputChange}
                            placeholder="Nome do bairro"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="cidade">Cidade</label>
                          <input
                            type="text"
                            className="form-control"
                            id="cidade"
                            name="cidade"
                            value={formData.cidade}
                            onChange={handleInputChange}
                            placeholder="Nome da cidade"
                          />
                        </div>
                      </div>
                      <div className="col-md-4">
                        <div className="form-group">
                          <label htmlFor="estado">Estado</label>
                          <input
                            type="text"
                            className="form-control"
                            id="estado"
                            name="estado"
                            value={formData.estado}
                            onChange={handleInputChange}
                            placeholder="SP"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="row mt-4">
                      <div className="col-12">
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={loading}
                        >
                          {loading ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Cadastrando...
                            </>
                          ) : (
                            'Cadastrar Cliente'
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
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
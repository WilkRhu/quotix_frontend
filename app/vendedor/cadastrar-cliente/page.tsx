'use client'

import { useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import DashboardLayout from '../../../components/DashboardLayout'
import ProtectedRoute from '../../../components/ProtectedRoute'
import ClienteDocumentUpload from '../../../components/ClienteDocumentUpload'
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
  const [clienteId, setClienteId] = useState<string | null>(null)
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
  const [loadingCep, setLoadingCep] = useState(false)

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1')
  }

  const formatTelefone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 2) {
      return numbers
    } else if (numbers.length <= 7) {
      return numbers.replace(/(\d{2})(\d+)/, '($1) $2')
    } else if (numbers.length <= 10) {
      return numbers.replace(/(\d{2})(\d{4})(\d+)/, '($1) $2-$3')
    } else {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
    }
  }

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{3})\d+?$/, '$1')
  }

  const buscarCEP = async (cep: string) => {
    const cepLimpo = cep.replace(/\D/g, '')
    if (cepLimpo.length !== 8) return

    setLoadingCep(true)
    try {
      const response = await axios.get(`https://viacep.com.br/ws/${cepLimpo}/json/`)
      if (response.data && !response.data.erro) {
        setFormData(prev => ({
          ...prev,
          rua: response.data.logradouro || '',
          bairro: response.data.bairro || '',
          cidade: response.data.localidade || '',
          estado: response.data.uf || ''
        }))
        showToast('Endereço preenchido automaticamente!', 'success')
      } else {
        showToast('CEP não encontrado', 'warning')
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error)
      showToast('Erro ao buscar CEP', 'error')
    } finally {
      setLoadingCep(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    let formattedValue = value

    if (name === 'cpf') {
      formattedValue = formatCPF(value)
    } else if (name === 'telefone') {
      formattedValue = formatTelefone(value)
    } else if (name === 'cep') {
      formattedValue = formatCEP(value)
      if (formattedValue.replace(/\D/g, '').length === 8) {
        buscarCEP(formattedValue)
      }
    }

    setFormData(prev => ({
      ...prev,
      [name]: formattedValue
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

      setClienteId(response.data.id)
      showToast('Cliente cadastrado com sucesso! Agora você pode enviar os documentos.', 'success')
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
                            maxLength={14}
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
                            maxLength={15}
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
                          <div className="input-group">
                            <input
                              type="text"
                              className="form-control"
                              id="cep"
                              name="cep"
                              value={formData.cep}
                              onChange={handleInputChange}
                              placeholder="00000-000"
                              maxLength={9}
                            />
                            {loadingCep && (
                              <div className="input-group-text">
                                <div className="spinner-border spinner-border-sm" role="status">
                                  <span className="visually-hidden">Buscando...</span>
                                </div>
                              </div>
                            )}
                          </div>
                          <small className="form-text text-muted">Digite o CEP para preencher o endereço automaticamente</small>
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
                        {!clienteId ? (
                          <>
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
                          </>
                        ) : (
                          <div className="d-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-success"
                              onClick={() => router.push('/vendedor/nova-venda')}
                            >
                              Continuar para Nova Venda
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-primary"
                              onClick={() => router.push('/vendedor/clientes')}
                            >
                              Ver Clientes
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              
              {clienteId && (
                <ClienteDocumentUpload 
                  clienteId={clienteId}
                  onUploadComplete={() => {}}
                />
              )}
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  )
}
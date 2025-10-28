'use client'

import { useState } from 'react'

export default function VendedorSignup() {
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    cpf: '',
    endereco: '',
    numero: '',
    complemento: '',
    cidade: '',
    estado: '',
    cep: '',
    experiencia: ''
  })

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [emailError, setEmailError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/vendedores-public/cadastro-avulso', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          tipoVendedor: 'avulso'
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage(data.message || 'Cadastro realizado com sucesso!')
        setMessageType('success')
        setFormData({
          nome: '',
          email: '',
          telefone: '',
          cpf: '',
          endereco: '',
          numero: '',
          complemento: '',
          cidade: '',
          estado: '',
          cep: '',
          experiencia: ''
        })
      } else {
        setMessage(data.message || 'Erro ao realizar cadastro')
        setMessageType('error')
      }
    } catch (error) {
      setMessage('Erro ao conectar com o servidor')
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const applyMask = (value: string, type: 'cpf' | 'telefone' | 'cep') => {
    const numbers = value.replace(/\D/g, '')
    
    switch (type) {
      case 'cpf':
        return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
      case 'telefone':
        return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3')
      case 'cep':
        return numbers.replace(/(\d{5})(\d{3})/, '$1-$2')
      default:
        return value
    }
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const buscarCep = async (cep: string) => {
    const cepNumbers = cep.replace(/\D/g, '')
    if (cepNumbers.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cepNumbers}/json/`)
        const data = await response.json()
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: data.logradouro || '',
            cidade: data.localidade || '',
            estado: data.uf || ''
          }))
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error)
      }
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    let maskedValue = value

    if (name === 'cpf') {
      maskedValue = applyMask(value, 'cpf')
    } else if (name === 'telefone') {
      maskedValue = applyMask(value, 'telefone')
    } else if (name === 'cep') {
      maskedValue = applyMask(value, 'cep')
      if (maskedValue.replace(/\D/g, '').length === 8) {
        buscarCep(maskedValue)
      }
    } else if (name === 'email') {
      if (value && !validateEmail(value)) {
        setEmailError('Email inválido')
      } else {
        setEmailError('')
      }
    }

    setFormData({
      ...formData,
      [name]: maskedValue
    })
  }

  return (
    <section id="cadastro-vendedor" className="py-5 bg-light">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">
              Cadastre-se como <span className="text-primary">Vendedor</span>
            </h2>
            <p className="lead text-muted">
              Preencha seus dados e comece a vender hoje mesmo
            </p>
          </div>
        </div>

        <div className="row">
          <div className="col-lg-8 mx-auto">
            <div className="card border-0 shadow-lg">
              <div className="card-body p-5">
                {message && (
                  <div className={`alert alert-${messageType === 'success' ? 'success' : 'danger'} mb-4`}>
                    <i className={`fas fa-${messageType === 'success' ? 'check-circle' : 'exclamation-triangle'} me-2`}></i>
                    {message}
                  </div>
                )}
                
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Nome Completo *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="nome"
                        value={formData.nome}
                        onChange={handleChange}
                        required
                        placeholder="Seu nome completo"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">E-mail *</label>
                      <input
                        type="email"
                        className={`form-control form-control-lg ${emailError ? 'is-invalid' : ''}`}
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="seu@email.com"
                      />
                      {emailError && <div className="invalid-feedback">{emailError}</div>}
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Telefone *</label>
                      <input
                        type="tel"
                        className="form-control form-control-lg"
                        name="telefone"
                        value={formData.telefone}
                        onChange={handleChange}
                        required
                        placeholder="(11) 99999-9999"
                        maxLength={15}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">CPF *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        required
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                    </div>
                    <div className="col-md-8">
                      <label className="form-label">Endereço *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="endereco"
                        value={formData.endereco}
                        onChange={handleChange}
                        required
                        placeholder="Rua, Avenida, etc."
                      />
                    </div>
                    <div className="col-md-4">
                      <label className="form-label">Número *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="numero"
                        value={formData.numero}
                        onChange={handleChange}
                        required
                        placeholder="123"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Complemento</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="complemento"
                        value={formData.complemento}
                        onChange={handleChange}
                        placeholder="Apto, Bloco, etc."
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">CEP *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="cep"
                        value={formData.cep}
                        onChange={handleChange}
                        required
                        placeholder="00000-000"
                        maxLength={9}
                      />
                      <small className="text-muted">Endereço será preenchido automaticamente</small>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Cidade *</label>
                      <input
                        type="text"
                        className="form-control form-control-lg"
                        name="cidade"
                        value={formData.cidade}
                        onChange={handleChange}
                        required
                        placeholder="Sua cidade"
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Estado *</label>
                      <select
                        className="form-select form-select-lg"
                        name="estado"
                        value={formData.estado}
                        onChange={handleChange}
                        required
                      >
                        <option value="">Selecione...</option>
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
                    <div className="col-12">
                      <label className="form-label">Experiência em Vendas</label>
                      <select
                        className="form-select form-select-lg"
                        name="experiencia"
                        value={formData.experiencia}
                        onChange={handleChange}
                      >
                        <option value="">Selecione sua experiência...</option>
                        <option value="iniciante">Iniciante (0-1 ano) - Estou começando na área de vendas</option>
                        <option value="intermediario">Intermediário (1-3 anos) - Tenho experiência básica em vendas</option>
                        <option value="experiente">Experiente (3-5 anos) - Tenho boa experiência e resultados em vendas</option>
                        <option value="senior">Sênior (5+ anos) - Sou especialista em vendas com histórico sólido</option>
                        <option value="especialista">Especialista (10+ anos) - Sou referência em vendas e liderança</option>
                      </select>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="termos" required />
                      <label className="form-check-label" htmlFor="termos">
                        Aceito os <a href="#" className="text-primary">termos de uso</a> e 
                        <a href="#" className="text-primary"> política de privacidade</a>
                      </label>
                    </div>
                  </div>

                  <div className="d-grid mt-4">
                    <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Cadastrando...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-user-plus me-2"></i>
                          Criar Conta de Vendedor
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="text-center mt-4">
                  <p className="text-muted">
                    Já tem uma conta? <a href="/login" className="text-primary">Faça login</a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="row mt-5">
          <div className="col-lg-10 mx-auto">
            <div className="row g-4 text-center">
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-shield-alt text-primary me-2 fs-4"></i>
                  <span>Dados Seguros</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-clock text-primary me-2 fs-4"></i>
                  <span>Aprovação Rápida</span>
                </div>
              </div>
              <div className="col-md-4">
                <div className="d-flex align-items-center justify-content-center">
                  <i className="fas fa-headset text-primary me-2 fs-4"></i>
                  <span>Suporte 24/7</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
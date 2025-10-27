'use client'

import { useState } from 'react'
import { useToast } from '@/stories/toastStore'
import { API_BASE_URL } from '@/lib/api'

export default function ClientSignup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    telefone: '',
    password: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(false)
  const { showToast } = useToast()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'telefone') {
      // Aplicar máscara de telefone
      const masked = value
        .replace(/\D/g, '') // Remove tudo que não é dígito
        .replace(/(\d{2})(\d)/, '($1) $2') // Coloca parênteses em volta dos dois primeiros dígitos
        .replace(/(\d{5})(\d)/, '$1-$2') // Coloca hífen depois do quinto dígito
        .substring(0, 15) // Limita a 15 caracteres
      
      setFormData({
        ...formData,
        [name]: masked
      })
    } else {
      setFormData({
        ...formData,
        [name]: value
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.password !== formData.confirmPassword) {
      showToast('As senhas não coincidem', 'error')
      return
    }

    if (formData.password.length < 6) {
      showToast('A senha deve ter pelo menos 6 caracteres', 'error')
      return
    }
    
    if (!formData.telefone || formData.telefone.replace(/\D/g, '').length < 10) {
      showToast('Digite um telefone válido com DDD', 'error')
      return
    }

    setLoading(true)
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          telefone: formData.telefone,
          password: formData.password,
          role: 'CLIENT'
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'Erro ao criar conta')
      }

      showToast('Conta criada com sucesso! Faça login para continuar.', 'success')
      setFormData({ name: '', email: '', telefone: '', password: '', confirmPassword: '' })
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        window.location.href = '/login'
      }, 2000)
      
    } catch (error: any) {
      showToast(error.message || 'Erro ao criar conta', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="cadastro-cliente" className="py-5 bg-light position-relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="position-absolute" style={{ top: '8%', left: '5%', zIndex: 1, opacity: 0.04 }}>
        <i className="fas fa-user-shield" style={{ fontSize: '180px', color: '#667eea', transform: 'rotate(-10deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ bottom: '5%', right: '8%', zIndex: 1, opacity: 0.05 }}>
        <i className="fas fa-lock" style={{ fontSize: '120px', color: '#764ba2', transform: 'rotate(25deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ top: '40%', right: '2%', zIndex: 1, opacity: 0.03 }}>
        <i className="fas fa-key" style={{ fontSize: '100px', color: '#667eea', transform: 'rotate(-35deg)' }}></i>
      </div>
      {/* Floating security indicators */}
      <div className="position-absolute" style={{ top: '15%', right: '12%', zIndex: 1 }}>
        <div style={{ 
          width: '70px', 
          height: '70px', 
          background: 'linear-gradient(135deg, rgba(40, 167, 69, 0.1), rgba(102, 126, 234, 0.08))', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'float 5s ease-in-out infinite'
        }}>
          <i className="fas fa-check-circle" style={{ color: '#28a745', fontSize: '18px' }}></i>
        </div>
      </div>
      
      <div className="position-absolute" style={{ bottom: '20%', left: '10%', zIndex: 1 }}>
        <div style={{ 
          width: '50px', 
          height: '50px', 
          background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.12), rgba(102, 126, 234, 0.06))', 
          borderRadius: '30%',
          animation: 'float 4s ease-in-out infinite 1.5s'
        }}></div>
      </div>
      
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row">
          <div className="col-lg-8 mx-auto text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Crie sua Conta</h2>
            <p className="lead text-muted">
              Cadastre-se gratuitamente e comece a comparar seguros agora mesmo
            </p>
          </div>
        </div>
        
        <div className="row">
          <div className="col-lg-6">
            <div className="signup-benefits">
              <h4 className="mb-4">O que você ganha:</h4>
              <div className="benefit-list">
                <div className="benefit-item d-flex align-items-center mb-3">
                  <div className="benefit-check bg-success text-white rounded-circle me-3">
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Acesso a cotações de múltiplas seguradoras</span>
                </div>
                <div className="benefit-item d-flex align-items-center mb-3">
                  <div className="benefit-check bg-success text-white rounded-circle me-3">
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Comparação de preços em tempo real</span>
                </div>
                <div className="benefit-item d-flex align-items-center mb-3">
                  <div className="benefit-check bg-success text-white rounded-circle me-3">
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Gestão completa das suas apólices</span>
                </div>
                <div className="benefit-item d-flex align-items-center mb-3">
                  <div className="benefit-check bg-success text-white rounded-circle me-3">
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Suporte especializado 24/7</span>
                </div>
                <div className="benefit-item d-flex align-items-center mb-3">
                  <div className="benefit-check bg-success text-white rounded-circle me-3">
                    <i className="fas fa-check"></i>
                  </div>
                  <span>Renovação automática com melhor preço</span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="col-lg-6">
            <div className="signup-form bg-white rounded-4 shadow-lg p-4">
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Nome Completo</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Digite seu nome completo"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">E-mail</label>
                  <input
                    type="email"
                    className="form-control form-control-lg"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Digite seu e-mail"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="telefone" className="form-label">Telefone Celular</label>
                  <input
                    type="tel"
                    className="form-control form-control-lg"
                    id="telefone"
                    name="telefone"
                    value={formData.telefone}
                    onChange={handleChange}
                    required
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Senha</label>
                  <input
                    type="password"
                    className="form-control form-control-lg"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>
                
                <div className="mb-4">
                  <label htmlFor="confirmPassword" className="form-label">Confirmar Senha</label>
                  <input
                    type="password"
                    className={`form-control form-control-lg ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword 
                        ? 'is-invalid' 
                        : formData.confirmPassword && formData.password === formData.confirmPassword 
                        ? 'is-valid' 
                        : ''
                    }`}
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Digite a senha novamente"
                  />
                  {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <div className="invalid-feedback">
                      As senhas não coincidem
                    </div>
                  )}
                  {formData.confirmPassword && formData.password === formData.confirmPassword && (
                    <div className="valid-feedback">
                      Senhas coincidem
                    </div>
                  )}
                </div>
                
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100 py-3"
                  disabled={loading || Boolean(formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword)}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                      Criando conta...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus me-2"></i>
                      Criar Minha Conta
                    </>
                  )}
                </button>
                
                <div className="text-center mt-3">
                  <small className="text-muted">
                    Já tem uma conta? <a href="/login" className="text-primary">Faça login</a>
                  </small>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        .benefit-check {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
        }
        
        .signup-form {
          border: 1px solid #e9ecef;
        }
        
        .form-control-lg {
          border-radius: 8px;
          border: 2px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .form-control-lg:focus {
          border-color: #667eea;
          box-shadow: 0 0 0 0.2rem rgba(102, 126, 234, 0.25);
        }
        
        .is-valid {
          border-color: #28a745 !important;
        }
        
        .is-invalid {
          border-color: #dc3545 !important;
        }
        
        .valid-feedback {
          display: block;
          color: #28a745;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .invalid-feedback {
          display: block;
          color: #dc3545;
          font-size: 0.875rem;
          margin-top: 0.25rem;
        }
        
        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          border-radius: 8px;
          font-weight: 600;
          transition: all 0.3s ease;
        }
        
        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
        }
        
        .signup-form {
          position: relative;
          z-index: 3;
        }
      `}</style>
    </section>
  )
}
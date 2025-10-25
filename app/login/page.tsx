'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '../../stories/authStore'
import { useToast } from '../../stories/toastStore'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const { login } = useAuth()
  const { showToast } = useToast()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    try {
      await login(email, password)
      showToast('Login realizado com sucesso!', 'success')
      
      // Aguardar um pouco para garantir que o localStorage foi atualizado
      setTimeout(() => {
        // Ler do store do Zustand em localStorage
        const authStoreData = JSON.parse(localStorage.getItem('auth-store') || '{}')
        const userData = authStoreData.state?.user || {}
        const role = userData.role?.toLowerCase()
        
        console.log('Debug - userData:', userData)
        console.log('Debug - role:', role)
        
        // Redirecionar baseado no role do usuário
        if (role === 'client' || role === 'cliente') {
          router.push('/cliente/painel')
        } else if (role === 'seller') {
          router.push('/vendedor')
        } else if (role === 'logist') {
          router.push('/lojista')
        } else if (role === 'admin') {
          router.push('/admin/lojas')
        } else {
          console.log('Role não reconhecido, redirecionando para /')
          router.push('/')
        }
      }, 100)
    } catch (error) {
      showToast('Email ou senha inválidos', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <style>{`
        .left-content-section {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        
        .form-content-section {
          background-color: #f8f9fa;
        }

        .card-login {
          box-shadow: 0 0 30px rgba(0, 0, 0, 0.1);
          border: none;
          border-radius: 12px;
        }

        .navbar-brand {
          color: #667eea !important;
          font-size: 1.5rem;
        }
      `}</style>

      <nav className="navbar navbar-expand-lg blur border-radius-lg top-0 z-index-3 shadow position-absolute mt-4 py-2 start-0 end-0 mx-4" style={{ zIndex: 1000 }}>
        <div className="container-fluid">
          <Link className="navbar-brand font-weight-bolder ms-lg-0 ms-3" href="/">
            Sistema Seguros
          </Link>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <Link className="nav-link me-2" href="/">
                  <i className="fa fa-home opacity-6 text-dark me-1"></i>
                  Início
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link me-2 active" href="/login">
                  <i className="fas fa-key opacity-6 text-dark me-1"></i>
                  Login
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link me-2" href="/cadastro">
                  <i className="fas fa-user-plus opacity-6 text-dark me-1"></i>
                  Cadastro
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      <main>
        <div className="container-fluid">
          <div className="row g-0 align-items-center" style={{ minHeight: '100vh', height: '100vh' }}>
            {/* COLUNA ESQUERDA - FORMULÁRIO */}
            <div className="col-lg-6 d-flex align-items-center justify-content-center p-4 form-content-section" style={{ position: 'relative', zIndex: 1, height: '100%', minHeight: '100vh' }}>
              <div className="card-login" style={{ width: '100%', maxWidth: '450px' }}>
                <div style={{ padding: '40px' }}>
                  <div style={{ marginBottom: '30px' }}>
                    <h2 style={{
                      fontSize: '2rem',
                      fontWeight: '700',
                      color: '#333333',
                      marginBottom: '10px'
                    }}>
                      Bem-vindo de volta!
                    </h2>
                    <p style={{
                      fontSize: '0.95rem',
                      color: '#666666',
                      marginBottom: 0
                    }}>
                      Entre com seus dados para acessar sua conta
                    </p>
                  </div>

                  <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                      <label style={{ marginBottom: '8px', color: '#333333', fontWeight: '500' }} className="form-label">
                        Email
                      </label>
                      <input 
                        type="email" 
                        className="form-control" 
                        placeholder="seu@email.com"
                        style={{
                          borderRadius: '8px',
                          border: '1px solid #e0e0e0',
                          padding: '12px 16px',
                          fontSize: '0.95rem'
                        }}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                      />
                    </div>

                    <div className="mb-3">
                      <label style={{ marginBottom: '8px', color: '#333333', fontWeight: '500' }} className="form-label">
                        Senha
                      </label>
                      <div style={{ position: 'relative' }}>
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          className="form-control"
                          placeholder="••••••••"
                          style={{
                            borderRadius: '8px',
                            border: '1px solid #e0e0e0',
                            padding: '12px 40px 12px 16px',
                            fontSize: '0.95rem'
                          }}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                        />
                        <button
                          type="button"
                          style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            border: 'none',
                            background: 'transparent',
                            color: '#999',
                            cursor: 'pointer',
                            padding: 0
                          }}
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                      </div>
                    </div>

                    <div className="form-check" style={{ marginBottom: '20px' }}>
                      <input 
                        className="form-check-input" 
                        type="checkbox" 
                        id="rememberMe"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <label className="form-check-label" htmlFor="rememberMe" style={{ color: '#666666' }}>
                        Lembrar de mim
                      </label>
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary w-100"
                      style={{
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 24px',
                        fontSize: '1rem',
                        fontWeight: '600',
                        marginBottom: '20px'
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Entrando...
                        </>
                      ) : (
                        'Entrar'
                      )}
                    </button>
                  </form>

                  <div style={{ borderTop: '1px solid #e0e0e0', paddingTop: '20px' }}>
                    <p style={{ fontSize: '0.9rem', color: '#666666', marginBottom: 0, textAlign: 'center' }}>
                      Não tem uma conta?{' '}
                      <Link href="/cadastro" style={{
                        color: '#667eea',
                        textDecoration: 'none',
                        fontWeight: '600'
                      }}>
                        Cadastre-se aqui
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* COLUNA DIREITA - CONTEÚDO ROXO */}
            <div className="col-lg-6 d-none d-lg-flex align-items-center justify-content-center p-5 left-content-section" style={{ position: 'relative', zIndex: 1, height: '100%', minHeight: '100vh' }}>
              <div style={{ maxWidth: '500px' }}>
                <div style={{ marginBottom: '40px' }}>
                  <div style={{
                    fontSize: '3.5rem',
                    fontWeight: '700',
                    color: '#ffffff',
                    marginBottom: '20px'
                  }}>
                    Bem-vindo!
                  </div>
                  <p style={{
                    fontSize: '1.1rem',
                    color: '#ffffff',
                    lineHeight: '1.8',
                    marginBottom: '30px',
                    opacity: 0.9
                  }}>
                    Junte-se a milhares de lojistas que estão aumentando suas vendas de seguros com nossa plataforma inteligente.
                  </p>
                </div>

                {/* Benefícios */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      <i className="fas fa-rocket"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: '600' }}>Acesso rápido</h4>
                      <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', opacity: 0.9 }}>Login simples e seguro, protegido por autenticação JWT</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      <i className="fas fa-chart-line"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: '600' }}>Painel de controle</h4>
                      <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', opacity: 0.9 }}>Visualize todas as suas vendas e desempenho em tempo real</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '15px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: '1.5rem',
                      flexShrink: 0
                    }}>
                      <i className="fas fa-shield-alt"></i>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 8px 0', color: '#ffffff', fontWeight: '600' }}>Segurança garantida</h4>
                      <p style={{ margin: 0, color: '#ffffff', fontSize: '0.9rem', opacity: 0.9 }}>Seus dados protegidos com as melhores práticas de segurança</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
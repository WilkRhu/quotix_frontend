import React from 'react'
import Link from 'next/link'

export default function Hero() {
  return (
    <section 
      className="hero-section position-relative text-white"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        minHeight: '750px',
        display: 'flex',
        alignItems: 'center',
        overflow: 'hidden',
        paddingTop: '80px',
        paddingBottom: '60px'
      }}
    >
      {/* Background Animation com efeito premium */}
      <div className="position-absolute w-100 h-100" style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.15) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.08) 0%, transparent 50%),
          radial-gradient(circle at 50% 0%, rgba(0,0,0,0.1) 0%, transparent 60%)
        `,
        pointerEvents: 'none'
      }}></div>

      <div className="container position-relative z-2">
        <div className="row align-items-center g-5">
          <div className="col-lg-6">
            {/* Badge */}
            <div className="mb-4">
              <span className="badge bg-white bg-opacity-20 text-white px-4 py-2 rounded-pill fw-6" style={{ fontSize: '0.95rem' }}>
                <i className="fas fa-star me-2"></i>Plataforma #1 em Seguros com QUOTIX
              </span>
            </div>

            {/* Título */}
            <h1 
              className="display-2 fw-bold mb-4" 
              style={{ 
                lineHeight: '1.15',
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                letterSpacing: '-0.5px'
              }}
            >
              Venda Mais Seguros com <span style={{ background: 'linear-gradient(120deg, #ffd89b 0%, #19547b 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Menos Esforço</span>
            </h1>
            
            {/* Descrição */}
            <p className="lead mb-5 opacity-90" style={{ fontSize: '1.1rem', lineHeight: '1.7' }}>
              Plataforma completa que conecta lojistas, vendedores e clientes. 
              Simplifique suas vendas de seguros de veículos e aumente suas comissões em até 300%.
            </p>

            {/* CTAs */}
            <div className="d-flex flex-wrap gap-3 mb-5">
              <Link href="/cadastro" className="btn btn-light btn-lg px-5 py-3 fw-bold" style={{ 
                fontSize: '1.05rem',
                boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                transition: 'all 0.3s ease'
              }}>
                <i className="fas fa-rocket me-2"></i>
                Começar Agora
              </Link>
              <a href="#services" className="btn btn-outline-light btn-lg px-5 py-3 fw-bold" style={{ 
                fontSize: '1.05rem',
                transition: 'all 0.3s ease',
                borderWidth: '2px'
              }}>
                <i className="fas fa-play-circle me-2"></i>
                Conheça os Recursos
              </a>
            </div>

            {/* Benefícios com ícones premium */}
            <div className="row g-4 mt-2">
              <div className="col-sm-6">
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-lg p-3 me-3 flex-shrink-0" 
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-shield-alt text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="mb-1 fw-bold" style={{ fontSize: '0.95rem' }}>100% Seguro</p>
                    <small className="opacity-75">Dados criptografados</small>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-lg p-3 me-3 flex-shrink-0" 
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-bolt text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="mb-1 fw-bold" style={{ fontSize: '0.95rem' }}>Sem Setup</p>
                    <small className="opacity-75">Comece em 5 minutos</small>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-lg p-3 me-3 flex-shrink-0" 
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-headset text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="mb-1 fw-bold" style={{ fontSize: '0.95rem' }}>Suporte 24/7</p>
                    <small className="opacity-75">Sempre disponível</small>
                  </div>
                </div>
              </div>
              <div className="col-sm-6">
                <div className="d-flex align-items-start">
                  <div 
                    className="rounded-lg p-3 me-3 flex-shrink-0" 
                    style={{
                      background: 'rgba(255, 255, 255, 0.15)',
                      backdropFilter: 'blur(10px)',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      width: '50px',
                      height: '50px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className="fas fa-chart-line text-white" style={{ fontSize: '1.5rem' }}></i>
                  </div>
                  <div>
                    <p className="mb-1 fw-bold" style={{ fontSize: '0.95rem' }}>Relatórios</p>
                    <small className="opacity-75">Analytics em tempo real</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Imagem com design premium */}
          <div className="col-lg-6 text-center">
            <div className="position-relative d-inline-block w-100" style={{ maxWidth: '550px' }}>
              {/* Efeito de glow blur background */}
              <div 
                style={{
                  position: 'absolute',
                  width: '100%',
                  height: '100%',
                  background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(255,255,255,0.2), transparent)',
                  filter: 'blur(40px)',
                  zIndex: 0,
                  borderRadius: '20px'
                }}
              ></div>

              {/* Container com borda e sombra */}
              <div
                style={{
                  position: 'relative',
                  zIndex: 1,
                  borderRadius: '20px',
                  overflow: 'hidden',
                  boxShadow: '0 30px 60px rgba(0, 0, 0, 0.3), 0 0 120px rgba(255, 255, 255, 0.1)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  animation: 'float 4s ease-in-out infinite',
                  transform: 'perspective(1000px) rotateX(2deg)'
                }}
              >
                <img 
                  src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=400&fit=crop" 
                  alt="Equipe de Vendas de Seguros" 
                  className="img-fluid w-100"
                  onError={(e: any) => {
                    e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22600%22 height=%22400%22%3E%3Crect fill=%22%23667eea%22 width=%22600%22 height=%22400%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 font-size=%2224%22 fill=%22white%22 text-anchor=%22middle%22 dominant-baseline=%22middle%22%3EEquipe de Vendas%3C/text%3E%3C/svg%3E'
                  }}
                  style={{
                    display: 'block',
                    borderRadius: '20px',
                    filter: 'brightness(0.95) contrast(1.05)',
                    backgroundColor: '#667eea',
                    objectFit: 'cover'
                  }}
                />
              </div>

              {/* Decorativo badge floating */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '-20px',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: '#667eea',
                  padding: '15px 25px',
                  borderRadius: '50px',
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                  fontWeight: 'bold',
                  zIndex: 2,
                  animation: 'pulse 2s ease-in-out infinite'
                }}
              >
                <i className="fas fa-check me-2"></i>
                <span style={{ fontSize: '0.9rem' }}>Pronto para usar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) perspective(1000px) rotateX(2deg);
          }
          50% { 
            transform: translateY(-30px) perspective(1000px) rotateX(-1deg);
          }
        }

        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }

        .btn-light:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0,0,0,0.25) !important;
        }

        .btn-outline-light:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          transform: translateY(-3px);
        }
      `}</style>
    </section>
  )
}

'use client'

export default function ClientHero() {
  return (
    <section className="hero-section position-relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="position-absolute" style={{ top: '10%', left: '5%', zIndex: 1, opacity: 0.08 }}>
        <i className="fas fa-car" style={{ fontSize: '120px', color: '#667eea', transform: 'rotate(-15deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ bottom: '15%', right: '8%', zIndex: 1, opacity: 0.06 }}>
        <i className="fas fa-shield-alt" style={{ fontSize: '150px', color: '#764ba2', transform: 'rotate(25deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ top: '60%', left: '2%', zIndex: 1, opacity: 0.05 }}>
        <i className="fas fa-chart-line" style={{ fontSize: '80px', color: '#667eea', transform: 'rotate(-45deg)' }}></i>
      </div>
      <div className="container py-5">
        <div className="row align-items-center min-vh-100">
          <div className="col-lg-6">
            <div className="hero-content">
              <h1 className="display-4 fw-bold mb-4">
                <span className="text-gradient">Proteja seu veículo</span><br />
                com o melhor seguro
              </h1>
              <p className="lead mb-4 text-muted">
                Compare cotações, encontre o melhor preço e contrate seu seguro auto 
                de forma rápida e segura. Tudo online, sem complicação.
              </p>
              <div className="d-flex flex-column flex-sm-row gap-3 mb-4">
                <a href="#cadastro-cliente" className="btn btn-primary btn-lg px-4 py-3">
                  <i className="fas fa-user-plus me-2"></i>
                  Criar Minha Conta
                </a>
                <a href="#como-funciona" className="btn btn-outline-primary btn-lg px-4 py-3">
                  <i className="fas fa-play me-2"></i>
                  Como Funciona
                </a>
              </div>
              <div className="row text-center">
                <div className="col-4">
                  <div className="stat-item">
                    <h3 className="fw-bold text-primary">100%</h3>
                    <small className="text-muted">Online</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-item">
                    <h3 className="fw-bold text-primary">24h</h3>
                    <small className="text-muted">Suporte</small>
                  </div>
                </div>
                <div className="col-4">
                  <div className="stat-item">
                    <h3 className="fw-bold text-primary">Grátis</h3>
                    <small className="text-muted">Cotação</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-image text-center">
              <div className="position-relative">
                <div className="hero-mockup mx-auto" style={{ maxWidth: '500px' }}>
                  <div className="mockup-container position-relative">
                    {/* Smartphone mockup */}
                    <div className="phone-mockup bg-dark rounded-4 p-3 mx-auto" style={{ width: '280px', height: '560px' }}>
                      <div className="screen bg-white rounded-3 h-100 p-3 position-relative overflow-hidden">
                        {/* Status bar */}
                        <div className="d-flex justify-content-between align-items-center mb-3" style={{ fontSize: '12px' }}>
                          <span className="fw-bold">9:41</span>
                          <div className="d-flex gap-1">
                            <div className="bg-dark rounded" style={{ width: '15px', height: '8px' }}></div>
                            <div className="bg-dark rounded" style={{ width: '15px', height: '8px' }}></div>
                            <div className="bg-success rounded" style={{ width: '20px', height: '8px' }}></div>
                          </div>
                        </div>
                        
                        {/* App header */}
                        <div className="text-center mb-3">
                          <h6 className="fw-bold text-primary mb-1">QUOTIX</h6>
                          <small className="text-muted">Seu Seguro Auto</small>
                        </div>
                        
                        {/* Car illustration */}
                        <div className="text-center mb-3">
                          <div className="car-icon bg-primary rounded-circle mx-auto mb-2" style={{ width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="fas fa-car text-white" style={{ fontSize: '24px' }}></i>
                          </div>
                          <small className="text-muted">Honda Civic 2020</small>
                        </div>
                        
                        {/* Insurance cards */}
                        <div className="insurance-cards">
                          <div className="card border-0 shadow-sm mb-2" style={{ fontSize: '11px' }}>
                            <div className="card-body p-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-bold text-success">R$ 89/mês</div>
                                  <small className="text-muted">Seguradora A</small>
                                </div>
                                <div className="bg-success text-white rounded px-2 py-1" style={{ fontSize: '10px' }}>Melhor</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="card border-0 shadow-sm mb-2" style={{ fontSize: '11px' }}>
                            <div className="card-body p-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-bold">R$ 125/mês</div>
                                  <small className="text-muted">Seguradora B</small>
                                </div>
                                <div className="bg-warning text-white rounded px-2 py-1" style={{ fontSize: '10px' }}>Popular</div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="card border-0 shadow-sm mb-3" style={{ fontSize: '11px' }}>
                            <div className="card-body p-2">
                              <div className="d-flex justify-content-between align-items-center">
                                <div>
                                  <div className="fw-bold">R$ 156/mês</div>
                                  <small className="text-muted">Seguradora C</small>
                                </div>
                                <div className="bg-info text-white rounded px-2 py-1" style={{ fontSize: '10px' }}>Premium</div>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* CTA Button */}
                        <button className="btn btn-primary w-100 py-2" style={{ fontSize: '12px' }}>
                          <i className="fas fa-shield-check me-1"></i>
                          Contratar Agora
                        </button>
                      </div>
                    </div>
                    
                    {/* Floating elements */}
                    <div className="floating-element position-absolute" style={{ top: '10%', right: '10%', animation: 'float 3s ease-in-out infinite' }}>
                      <div className="bg-success text-white rounded-circle p-2" style={{ width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-check" style={{ fontSize: '16px' }}></i>
                      </div>
                    </div>
                    
                    <div className="floating-element position-absolute" style={{ bottom: '20%', left: '5%', animation: 'float 3s ease-in-out infinite 1s' }}>
                      <div className="bg-warning text-white rounded-circle p-2" style={{ width: '35px', height: '35px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-dollar-sign" style={{ fontSize: '14px' }}></i>
                      </div>
                    </div>
                    
                    <div className="floating-element position-absolute" style={{ top: '30%', left: '0%', animation: 'float 3s ease-in-out infinite 2s' }}>
                      <div className="bg-info text-white rounded-circle p-2" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="fas fa-clock" style={{ fontSize: '12px' }}></i>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .hero-section {
          background: linear-gradient(135deg, #f8f9ff 0%, #e8f2ff 100%);
          min-height: 100vh;
          position: relative;
          overflow: hidden;
        }
        
        .hero-section::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(118, 75, 162, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(102, 126, 234, 0.05) 0%, transparent 50%);
          z-index: 1;
        }
        
        .hero-section::after {
          content: '';
          position: absolute;
          top: -10%;
          right: -10%;
          width: 400px;
          height: 400px;
          background: linear-gradient(45deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03));
          border-radius: 50%;
          z-index: 1;
          animation: rotate 20s linear infinite;
        }
        
        .hero-section .container {
          position: relative;
          z-index: 2;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .phone-mockup {
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          animation: float 6s ease-in-out infinite;
        }
        
        .floating-element {
          z-index: 10;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-10px) rotate(1deg); }
          66% { transform: translateY(-5px) rotate(-1deg); }
        }
        
        .stat-item {
          padding: 1rem 0;
        }
      `}</style>
      
      {/* Floating geometric shapes */}
      <div className="position-absolute" style={{ top: '25%', left: '10%', zIndex: 1 }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          background: 'linear-gradient(45deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))', 
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite'
        }}></div>
      </div>
      
      <div className="position-absolute" style={{ bottom: '30%', right: '12%', zIndex: 1 }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: 'linear-gradient(45deg, rgba(118, 75, 162, 0.15), rgba(102, 126, 234, 0.1))', 
          transform: 'rotate(45deg)',
          animation: 'float 5s ease-in-out infinite 1s'
        }}></div>
      </div>
    </section>
  )
}
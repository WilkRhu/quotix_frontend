'use client'

export default function VendedorHero() {
  return (
    <section className="hero-vendedor position-relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="position-absolute" style={{ top: '10%', left: '5%', zIndex: 1, opacity: 0.08 }}>
        <i className="fas fa-handshake" style={{ fontSize: '120px', color: '#667eea', transform: 'rotate(-15deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ bottom: '15%', right: '8%', zIndex: 1, opacity: 0.06 }}>
        <i className="fas fa-chart-line" style={{ fontSize: '150px', color: '#764ba2', transform: 'rotate(25deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ top: '60%', left: '2%', zIndex: 1, opacity: 0.05 }}>
        <i className="fas fa-coins" style={{ fontSize: '80px', color: '#667eea', transform: 'rotate(-45deg)' }}></i>
      </div>
      <div className="container">
        <div className="row align-items-center min-vh-100 py-5">
          <div className="col-lg-6">
            <div className="hero-content">
              <h1 className="display-4 fw-bold mb-4">
                Maximize suas vendas
                <br />
                como Vendedor
              </h1>
              <p className="lead mb-4" style={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                Conecte-se com múltiplas lojas, venda seguros com liberdade e 
                ganhe comissões competitivas. Seja um vendedor independente ou 
                expanda suas oportunidades.
              </p>
              <div className="d-flex flex-wrap gap-3 mb-4">
                <div className="d-flex align-items-center">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <span>Venda para múltiplas lojas</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <span>Comissões competitivas</span>
                </div>
                <div className="d-flex align-items-center">
                  <i className="fas fa-check-circle text-success me-2"></i>
                  <span>Dashboard completo</span>
                </div>
              </div>
              <div className="d-flex flex-wrap gap-3">
                <a href="#cadastro-vendedor" className="btn btn-primary btn-lg px-4 py-3">
                  <i className="fas fa-user-plus me-2"></i>
                  Cadastre-se Grátis
                </a>
                <a href="#como-funciona" className="btn btn-outline-primary btn-lg px-4 py-3">
                  <i className="fas fa-play me-2"></i>
                  Como Funciona
                </a>
              </div>
            </div>
          </div>
          <div className="col-lg-6">
            <div className="hero-image text-center">
              <div className="floating-card">
                <div className="card shadow-lg border-0">
                  <div className="card-body p-4">
                    <div className="d-flex align-items-center mb-3">
                      <div className="avatar bg-gradient-success rounded-circle me-3">
                        <i className="fas fa-user-tie text-white"></i>
                      </div>
                      <div>
                        <h6 className="mb-0">João Silva</h6>
                        <small className="text-muted">Vendedor Independente</small>
                      </div>
                    </div>
                    <div className="row text-center">
                      <div className="col-4">
                        <h5 className="text-success mb-0">R$ 15.420</h5>
                        <small className="text-muted">Este mês</small>
                      </div>
                      <div className="col-4">
                        <h5 className="text-primary mb-0">23</h5>
                        <small className="text-muted">Vendas</small>
                      </div>
                      <div className="col-4">
                        <h5 className="text-warning mb-0">5</h5>
                        <small className="text-muted">Lojas</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating geometric shapes */}
      <div className="position-absolute" style={{ top: '25%', left: '10%', zIndex: 1 }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '50%',
          animation: 'float 4s ease-in-out infinite'
        }}></div>
      </div>
      
      <div className="position-absolute" style={{ bottom: '30%', right: '12%', zIndex: 1 }}>
        <div style={{ 
          width: '40px', 
          height: '40px', 
          background: 'rgba(255, 255, 255, 0.15)', 
          transform: 'rotate(45deg)',
          animation: 'float 5s ease-in-out infinite 1s'
        }}></div>
      </div>

      <style jsx>{`
        .hero-vendedor {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          position: relative;
          overflow: hidden;
        }
        
        .hero-vendedor::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: 
            radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 40% 40%, rgba(255, 255, 255, 0.05) 0%, transparent 50%);
          z-index: 1;
        }
        
        .hero-vendedor::after {
          content: '';
          position: absolute;
          top: -10%;
          right: -10%;
          width: 400px;
          height: 400px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 50%;
          z-index: 1;
          animation: rotate 20s linear infinite;
        }
        
        .hero-vendedor .container {
          position: relative;
          z-index: 2;
        }
        
        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }



        .floating-card {
          animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        .avatar {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border: none;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
          color: white;
        }

        .btn-outline-primary {
          border: 2px solid white;
          color: white;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .btn-outline-primary:hover {
          background: white;
          color: #667eea;
          transform: translateY(-2px);
        }
      `}</style>
    </section>
  )
}
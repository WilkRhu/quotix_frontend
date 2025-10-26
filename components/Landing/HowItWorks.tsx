'use client'

export default function HowItWorks() {
  const steps = [
    {
      icon: 'fas fa-user-plus',
      title: 'Crie sua conta',
      description: 'Cadastre-se gratuitamente em nossa plataforma com seus dados básicos.',
      color: 'primary'
    },
    {
      icon: 'fas fa-car',
      title: 'Informe seu veículo',
      description: 'Adicione os dados do seu carro para receber cotações personalizadas.',
      color: 'success'
    },
    {
      icon: 'fas fa-search',
      title: 'Compare opções',
      description: 'Veja diferentes seguradoras e escolha a melhor opção para você.',
      color: 'warning'
    },
    {
      icon: 'fas fa-shield-check',
      title: 'Contrate online',
      description: 'Finalize a contratação de forma segura e receba sua apólice.',
      color: 'info'
    }
  ]

  return (
    <section id="como-funciona" className="py-5 bg-light position-relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="position-absolute" style={{ top: '5%', right: '3%', zIndex: 1, opacity: 0.04 }}>
        <i className="fas fa-cogs" style={{ fontSize: '200px', color: '#667eea', transform: 'rotate(15deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ bottom: '10%', left: '2%', zIndex: 1, opacity: 0.05 }}>
        <i className="fas fa-route" style={{ fontSize: '150px', color: '#764ba2', transform: 'rotate(-20deg)' }}></i>
      </div>
      <div className="position-absolute" style={{ top: '50%', right: '15%', zIndex: 1, opacity: 0.03 }}>
        <i className="fas fa-clipboard-check" style={{ fontSize: '120px', color: '#667eea', transform: 'rotate(45deg)' }}></i>
      </div>
      
      {/* Floating process indicators */}
      <div className="position-absolute" style={{ top: '20%', left: '8%', zIndex: 1 }}>
        <div style={{ 
          width: '80px', 
          height: '80px', 
          background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.06))', 
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'float 6s ease-in-out infinite'
        }}>
          <i className="fas fa-arrow-right" style={{ color: '#667eea', fontSize: '20px' }}></i>
        </div>
      </div>
      
      <div className="position-absolute" style={{ bottom: '25%', right: '5%', zIndex: 1 }}>
        <div style={{ 
          width: '60px', 
          height: '60px', 
          background: 'linear-gradient(135deg, rgba(118, 75, 162, 0.1), rgba(102, 126, 234, 0.05))', 
          borderRadius: '20%',
          animation: 'float 4s ease-in-out infinite 2s'
        }}></div>
      </div>
      
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row">
          <div className="col-lg-8 mx-auto text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Como Funciona</h2>
            <p className="lead text-muted">
              Em apenas 4 passos simples você pode contratar seu seguro auto
            </p>
          </div>
        </div>
        
        <div className="row">
          {steps.map((step, index) => (
            <div key={index} className="col-lg-3 col-md-6 mb-4">
              <div className="card h-100 border-0 shadow-sm hover-card">
                <div className="card-body text-center p-4">
                  <div className={`step-icon bg-${step.color} text-white rounded-circle mx-auto mb-3 d-flex align-items-center justify-content-center`}>
                    <i className={step.icon}></i>
                  </div>
                  <div className="step-number text-muted mb-2">
                    Passo {index + 1}
                  </div>
                  <h5 className="card-title mb-3">{step.title}</h5>
                  <p className="card-text text-muted">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className="step-arrow d-none d-lg-block">
                    <i className="fas fa-arrow-right text-primary"></i>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="row mt-5">
          <div className="col-lg-6 mx-auto text-center">
            <a href="#cadastro-cliente" className="btn btn-primary btn-lg px-5 py-3">
              <i className="fas fa-rocket me-2"></i>
              Começar Agora
            </a>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .step-icon {
          width: 80px;
          height: 80px;
          font-size: 1.5rem;
          position: relative;
        }
        
        .step-arrow {
          position: absolute;
          top: 50%;
          right: -20px;
          transform: translateY(-50%);
          font-size: 1.2rem;
        }
        
        .hover-card {
          transition: all 0.3s ease;
          position: relative;
        }
        
        .hover-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1) !important;
        }
        
        .step-number {
          font-size: 0.9rem;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `}</style>
    </section>
  )
}
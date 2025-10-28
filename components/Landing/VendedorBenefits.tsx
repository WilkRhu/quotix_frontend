'use client'

export default function VendedorBenefits() {
  const benefits = [
    {
      icon: 'fas fa-store',
      title: 'Múltiplas Lojas',
      description: 'Venda para várias lojas simultaneamente e maximize suas oportunidades de negócio.'
    },
    {
      icon: 'fas fa-coins',
      title: 'Comissões Competitivas',
      description: 'Negocie comissões diretamente com as lojas e tenha transparência total nos ganhos.'
    },
    {
      icon: 'fas fa-chart-line',
      title: 'Dashboard Completo',
      description: 'Acompanhe suas vendas, comissões e performance em tempo real.'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Plataforma Mobile',
      description: 'Acesse de qualquer lugar, faça cotações e gerencie vendas pelo celular.'
    },
    {
      icon: 'fas fa-handshake',
      title: 'Suporte Dedicado',
      description: 'Conte com nossa equipe para resolver dúvidas e otimizar suas vendas.'
    },
    {
      icon: 'fas fa-clock',
      title: 'Flexibilidade Total',
      description: 'Trabalhe no seu ritmo, escolha suas lojas e defina seus horários.'
    }
  ]

  return (
    <section id="beneficios" className="py-5 bg-light position-relative" style={{
      backgroundImage: 'url(/img/benefits-bg.jpg)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed'
    }}>
      <div className="position-absolute w-100 h-100" style={{
        background: 'rgba(248, 249, 255, 0.9)',
        top: 0,
        left: 0,
        zIndex: 1
      }}></div>
      <div className="container position-relative" style={{ zIndex: 2 }}>
        <div className="row">
          <div className="col-lg-8 mx-auto text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">
              Por que escolher nossa <span className="text-primary">plataforma?</span>
            </h2>
            <p className="lead text-muted">
              Oferecemos as melhores condições para vendedores que querem crescer e ter liberdade
            </p>
          </div>
        </div>
        
        <div className="row g-4">
          {benefits.map((benefit, index) => (
            <div key={index} className="col-lg-4 col-md-6">
              <div className="card h-100 border-0 shadow-sm hover-card">
                <div className="card-body p-4 text-center">
                  <div className="icon-box mb-3">
                    <i className={`${benefit.icon} text-primary`}></i>
                  </div>
                  <h5 className="card-title mb-3">{benefit.title}</h5>
                  <p className="card-text text-muted">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="row mt-5">
          <div className="col-lg-10 mx-auto">
            <div className="card bg-gradient-primary text-white border-0 shadow-lg">
              <div className="card-body p-5 text-center">
                <h3 className="mb-3">Pronto para começar?</h3>
                <p className="mb-4 opacity-90">
                  Junte-se a centenas de vendedores que já estão maximizando seus ganhos
                </p>
                <a href="#cadastro-vendedor" className="btn btn-light btn-lg px-4">
                  <i className="fas fa-rocket me-2"></i>
                  Começar Agora
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .icon-box {
          width: 80px;
          height: 80px;
          background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .icon-box i {
          font-size: 2rem;
        }

        .hover-card {
          transition: all 0.3s ease;
        }

        .hover-card:hover {
          transform: translateY(-10px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1) !important;
        }

        .bg-gradient-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
      `}</style>
    </section>
  )
}
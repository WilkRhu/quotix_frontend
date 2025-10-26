'use client'

export default function ClientBenefits() {
  const benefits = [
    {
      icon: 'fas fa-money-bill-wave',
      title: 'Melhor Preço',
      description: 'Compare cotações de diferentes seguradoras e encontre o melhor preço para seu perfil.',
      color: 'success'
    },
    {
      icon: 'fas fa-clock',
      title: 'Rapidez',
      description: 'Processo 100% online. Contrate seu seguro em minutos, sem burocracia.',
      color: 'primary'
    },
    {
      icon: 'fas fa-shield-alt',
      title: 'Segurança',
      description: 'Plataforma segura e confiável. Seus dados estão protegidos conosco.',
      color: 'info'
    },
    {
      icon: 'fas fa-headset',
      title: 'Suporte 24h',
      description: 'Atendimento especializado disponível 24 horas por dia, 7 dias por semana.',
      color: 'warning'
    },
    {
      icon: 'fas fa-mobile-alt',
      title: 'Acesso Mobile',
      description: 'Gerencie seu seguro pelo celular. Aplicativo intuitivo e fácil de usar.',
      color: 'danger'
    },
    {
      icon: 'fas fa-certificate',
      title: 'Seguradoras Credenciadas',
      description: 'Trabalhamos apenas com seguradoras reconhecidas e autorizadas pela SUSEP.',
      color: 'dark'
    }
  ]

  return (
    <section id="beneficios" className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">Por que escolher a QUOTIX?</h2>
            <p className="lead text-muted">
              Oferecemos a melhor experiência em seguros automotivos
            </p>
          </div>
        </div>
        
        <div className="row">
          {benefits.map((benefit, index) => (
            <div key={index} className="col-lg-4 col-md-6 mb-4">
              <div className="benefit-card h-100 p-4">
                <div className="d-flex align-items-start">
                  <div className={`benefit-icon bg-${benefit.color} text-white rounded-3 me-3 flex-shrink-0`}>
                    <i className={benefit.icon}></i>
                  </div>
                  <div>
                    <h5 className="mb-2">{benefit.title}</h5>
                    <p className="text-muted mb-0">{benefit.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="row mt-5">
          <div className="col-lg-8 mx-auto">
            <div className="cta-card bg-primary text-white rounded-4 p-5 text-center">
              <h3 className="mb-3">Pronto para proteger seu veículo?</h3>
              <p className="mb-4 opacity-75">
                Junte-se a milhares de clientes satisfeitos que já protegem seus veículos conosco.
              </p>
              <a href="#cadastro-cliente" className="btn btn-light btn-lg px-5 py-3">
                <i className="fas fa-user-plus me-2"></i>
                Criar Conta Gratuita
              </a>
            </div>
          </div>
        </div>
      </div>
      
      <style jsx>{`
        .benefit-card {
          background: white;
          border-radius: 12px;
          border: 1px solid #e9ecef;
          transition: all 0.3s ease;
        }
        
        .benefit-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          border-color: #667eea;
        }
        
        .benefit-icon {
          width: 50px;
          height: 50px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        
        .cta-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%) !important;
          box-shadow: 0 15px 35px rgba(102, 126, 234, 0.3);
        }
      `}</style>
    </section>
  )
}
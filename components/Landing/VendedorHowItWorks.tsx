'use client'

export default function VendedorHowItWorks() {
  const steps = [
    {
      number: '01',
      title: 'Cadastre-se',
      description: 'Crie sua conta gratuita e complete seu perfil profissional',
      icon: 'fas fa-user-plus'
    },
    {
      number: '02',
      title: 'Conecte-se às Lojas',
      description: 'Solicite acesso às lojas ou seja convidado por lojistas',
      icon: 'fas fa-handshake'
    },
    {
      number: '03',
      title: 'Faça Cotações',
      description: 'Use nossa plataforma para cotar seguros e atender clientes',
      icon: 'fas fa-calculator'
    },
    {
      number: '04',
      title: 'Receba Comissões',
      description: 'Acompanhe suas vendas e receba suas comissões automaticamente',
      icon: 'fas fa-money-bill-wave'
    }
  ]

  return (
    <section id="como-funciona" className="py-5">
      <div className="container">
        <div className="row">
          <div className="col-lg-8 mx-auto text-center mb-5">
            <h2 className="display-5 fw-bold mb-3">
              Como <span className="text-primary">funciona?</span>
            </h2>
            <p className="lead text-muted">
              Em 4 passos simples você já estará vendendo e ganhando comissões
            </p>
          </div>
        </div>

        <div className="row g-4">
          {steps.map((step, index) => (
            <div key={index} className="col-lg-3 col-md-6">
              <div className="text-center">
                <div className="step-number mb-3">
                  {step.number}
                </div>
                <div className="step-icon mb-3">
                  <i className={step.icon}></i>
                </div>
                <h5 className="mb-3">{step.title}</h5>
                <p className="text-muted">{step.description}</p>

              </div>
            </div>
          ))}
        </div>

        <div className="row mt-5">
          <div className="col-lg-8 mx-auto">
            <div className="card border-0 shadow-sm">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="mb-2">Tem dúvidas sobre o processo?</h5>
                    <p className="text-muted mb-0">
                      Nossa equipe está pronta para te ajudar a começar
                    </p>
                  </div>
                  <div className="col-md-4 text-md-end">
                    <a href="#cadastro-vendedor" className="btn btn-primary">
                      <i className="fas fa-comments me-2"></i>
                      Falar Conosco
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .step-number {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: bold;
          margin: 0 auto;
          position: relative;
        }

        .step-icon {
          width: 80px;
          height: 80px;
          background: rgba(102, 126, 234, 0.1);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto;
        }

        .step-icon i {
          font-size: 2rem;
          color: #667eea;
        }


      `}</style>
    </section>
  )
}
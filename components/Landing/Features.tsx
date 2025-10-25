import React from 'react'

const features = [
  {
    icon: 'fas fa-chart-line',
    title: 'Dashboard Avançado',
    description: 'Acompanhe suas vendas com gráficos em tempo real e análises detalhadas de desempenho'
  },
  {
    icon: 'fas fa-users',
    title: 'Gestão de Vendedores',
    description: 'Organize sua equipe, acompanhe o desempenho individual e comissões'
  },
  {
    icon: 'fas fa-calculator',
    title: 'Cotações Automáticas',
    description: 'Sistema inteligente que calcula cotações baseado em dados do veículo'
  },
  {
    icon: 'fas fa-wallet',
    title: 'Comissões Automáticas',
    description: 'Cálculo automático de comissões com relatórios detalhados'
  },
  {
    icon: 'fas fa-mobile-alt',
    title: 'Acesso Mobile',
    description: 'Gerencie suas vendas de qualquer lugar, a qualquer momento'
  },
  {
    icon: 'fas fa-shield-alt',
    title: 'Segurança Garantida',
    description: 'Seus dados protegidos com criptografia de ponta e conformidade LGPD'
  }
]

export default function Features() {
  return (
    <section id="services" className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row mb-5 text-center">
          <div className="col-lg-12">
            <h2 className="display-5 font-weight-bold mb-3">
              Recursos Poderosos
            </h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Tudo que você precisa para administrar sua operação com a plataforma QUOTIX de forma eficiente e segura
            </p>
          </div>
        </div>

        <div className="row g-4">
          {features.map((feature, index) => (
            <div key={index} className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-sm border-0 transition-all"
                style={{
                  borderTop: '4px solid #667eea',
                  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-10px)'
                  e.currentTarget.style.boxShadow = '0 12px 25px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.12)'
                }}
              >
                <div className="card-body p-4">
                  <div className="mb-4 text-center">
                    <div 
                      className="d-inline-flex align-items-center justify-content-center rounded-circle"
                      style={{
                        width: '60px',
                        height: '60px',
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      }}
                    >
                      <i className={`${feature.icon} text-white`} style={{ fontSize: '1.5rem' }}></i>
                    </div>
                  </div>
                  <h5 className="card-title font-weight-bold text-center mb-3">{feature.title}</h5>
                  <p className="card-text text-muted text-center mb-0">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

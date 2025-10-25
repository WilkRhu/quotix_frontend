import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { API_BASE_URL } from '../../lib/api'

interface Plano {
  id: string
  nome: string
  descricao: string
  precoMensal: number
  precoAnual: number
  limite_vendedores?: number
  features?: string[]
  isTrial?: boolean
}

export default function PricingCards() {
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchPlanos = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/planos/public/active`)
        if (response.ok) {
          const data = await response.json()
          console.log('Planos recebidos:', data)
          setPlanos(data)
        }
      } catch (error) {
        console.error('Erro ao carregar planos:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchPlanos()
  }, [])

  if (loading) {
    return (
      <section className="py-5">
        <div className="container">
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="sr-only">Carregando...</span>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section id="pricing" className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div className="row mb-5 text-center">
          <div className="col-lg-12">
            <h2 className="display-5 font-weight-bold mb-3">
              Planos de Assinatura
            </h2>
            <p className="lead text-muted mx-auto" style={{ maxWidth: '600px' }}>
              Escolha o plano ideal para seu negócio e comece a vender mais hoje mesmo
            </p>
          </div>
        </div>

        <div className="row g-4">
          {planos.map((plano, index) => {
            console.log(`Plano: ${plano.nome}, isTrial: ${plano.isTrial}`)
            return (
            <div key={plano.id} className="col-lg-4 col-md-6">
              <div 
                className="card h-100 shadow-sm border-0"
                style={{
                  borderTop: index === 1 ? '4px solid #667eea' : '4px solid #e9ecef',
                  transform: index === 1 ? 'translateY(-20px)' : 'none',
                  transition: 'all 0.3s ease'
                }}
              >
                {index === 1 && (
                  <div className="position-absolute top-0 start-50 translate-middle-x">
                    <span className="badge bg-gradient" style={{
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      padding: '0.5rem 1rem'
                    }}>
                      <i className="fas fa-star me-2"></i>Mais Popular
                    </span>
                  </div>
                )}
                
                <div className="card-body d-flex flex-column p-4">
                  <h5 className="card-title font-weight-bold mb-2">{plano.nome}</h5>
                  <p className="text-muted text-sm mb-4">{plano.descricao}</p>
                  
                  {!plano.isTrial ? (
                    <div className="mb-4">
                      <div className="price-container">
                        <span 
                          className="display-6 font-weight-bold"
                          style={{ color: '#667eea' }}
                        >
                          R$ {Number(plano.precoMensal).toFixed(2).replace('.', ',')}
                        </span>
                        <span className="text-muted">/mês</span>
                      </div>
                      <small className="text-muted d-block mt-2">
                        ou R$ {Number(plano.precoAnual).toFixed(2).replace('.', ',')} /ano (economize 20%)
                      </small>
                    </div>
                  ) : (
                    <div className="mb-4">
                      <span className="badge bg-success" style={{ fontSize: '0.875rem', padding: '0.5rem 0.75rem' }}>
                        Gratuito
                      </span>
                    </div>
                  )}

                  <ul className="list-unstyled mb-4 flex-grow-1">
                    {plano.limite_vendedores && (
                      <li className="mb-3 d-flex align-items-start">
                        <i className="fas fa-check text-success me-3 mt-1"></i>
                        <span>Até {plano.limite_vendedores} vendedor(es)</span>
                      </li>
                    )}
                    <li className="mb-3 d-flex align-items-start">
                      <i className="fas fa-check text-success me-3 mt-1"></i>
                      <span>Dashboard avançado</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="fas fa-check text-success me-3 mt-1"></i>
                      <span>Relatórios detalhados</span>
                    </li>
                    <li className="mb-3 d-flex align-items-start">
                      <i className="fas fa-check text-success me-3 mt-1"></i>
                      <span>Suporte via email</span>
                    </li>
                  </ul>

                  <Link 
                    href="/cadastro" 
                    className="btn w-100"
                    style={{
                      background: index === 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#f0f0f0',
                      color: index === 1 ? 'white' : '#333',
                      border: 'none'
                    }}
                  >
                    {index === 1 ? 'Comece Agora' : 'Saiba Mais'}
                  </Link>
                </div>
              </div>
            </div>
            )
          })}
        </div>

        <div className="row mt-5 text-center">
          <div className="col-lg-12">
            <p className="text-muted mb-2">Não tem certeza? <strong>Comece com uma avaliação gratuita de 7 dias</strong></p>
            <p className="text-muted small">Sem necessidade de cartão de crédito</p>
          </div>
        </div>
      </div>
    </section>
  )
}

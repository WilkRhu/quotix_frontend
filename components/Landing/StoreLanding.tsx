import React from 'react'
import { API_BASE_URL } from '../../lib/api'

interface LandingData {
  id: string
  nome: string
  slug: string
  descricao: string
  telefone: string
  email: string
  website?: string
  logo?: string
  backgroundUrl?: string
  cidade: string
  estado: string
  plano?: {
    id: string
    nome: string
  }
}

interface StoreLandingProps {
  data: LandingData
}

export default function StoreLanding({ data }: StoreLandingProps) {
  const logoUrl = data.logo 
    ? `${API_BASE_URL}/uploads/lojas/logomarcas/${data.logo}`
    : '/assets/img/team-2.jpg'

  const backgroundUrl = data.backgroundUrl 
    ? `${API_BASE_URL}/${data.backgroundUrl}`
    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'

  return (
    <div>
      {/* Hero Section */}
      <section 
        className="text-white py-5 position-relative"
        style={{
          backgroundImage: typeof backgroundUrl === 'string' && backgroundUrl.startsWith('http') 
            ? `url(${backgroundUrl})`
            : backgroundUrl,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <div className="position-absolute w-100 h-100 bg-dark" style={{ opacity: 0.5, top: 0, left: 0 }}></div>
        
        <div className="container position-relative z-2">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <img 
                src={logoUrl}
                alt={data.nome}
                className="rounded-lg shadow-lg mb-4"
                style={{ maxWidth: '300px', width: '100%' }}
              />
            </div>
            <div className="col-lg-6">
              <h1 className="display-4 font-weight-bold mb-3">{data.nome}</h1>
              <p className="lead mb-3">{data.descricao}</p>
              <div className="mb-4">
                <p className="mb-2">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  {data.cidade}, {data.estado}
                </p>
                <p className="mb-2">
                  <i className="fas fa-phone me-2"></i>
                  <a href={`tel:${data.telefone}`} className="text-white text-decoration-none">
                    {data.telefone}
                  </a>
                </p>
                <p className="mb-2">
                  <i className="fas fa-envelope me-2"></i>
                  <a href={`mailto:${data.email}`} className="text-white text-decoration-none">
                    {data.email}
                  </a>
                </p>
                {data.website && (
                  <p>
                    <i className="fas fa-globe me-2"></i>
                    <a href={data.website} target="_blank" rel="noopener noreferrer" className="text-white text-decoration-none">
                      {data.website}
                    </a>
                  </p>
                )}
              </div>
              <a href="#contato" className="btn btn-primary btn-lg me-2">
                Solicitar Cotação
              </a>
              {data.plano && (
                <span className="badge bg-success ms-2 p-2">
                  Plano: {data.plano.nome}
                </span>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contato" className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto">
              <div className="card shadow-sm">
                <div className="card-body p-5">
                  <h3 className="font-weight-bold mb-4">Solicitar Cotação</h3>
                  <p className="text-muted mb-4">
                    Preencha o formulário abaixo e nossa equipe entrará em contato com você em breve.
                  </p>
                  
                  <form>
                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="name" className="form-label">Nome *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="name" 
                          placeholder="Seu nome"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="email" className="form-label">Email *</label>
                        <input 
                          type="email" 
                          className="form-control" 
                          id="email" 
                          placeholder="seu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="row mb-3">
                      <div className="col-md-6">
                        <label htmlFor="phone" className="form-label">Telefone *</label>
                        <input 
                          type="tel" 
                          className="form-control" 
                          id="phone" 
                          placeholder="(11) 99999-9999"
                          required
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="vehicle" className="form-label">Modelo do Veículo *</label>
                        <input 
                          type="text" 
                          className="form-control" 
                          id="vehicle" 
                          placeholder="Ex: Honda Civic 2022"
                          required
                        />
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="message" className="form-label">Mensagem</label>
                      <textarea 
                        className="form-control" 
                        id="message" 
                        rows={4}
                        placeholder="Deixe-nos uma mensagem..."
                      ></textarea>
                    </div>

                    <button type="submit" className="btn btn-primary btn-lg w-100">
                      Enviar Cotação
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

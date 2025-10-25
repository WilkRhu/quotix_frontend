import React from 'react'
import Link from 'next/link'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer 
      className="text-white py-5 mt-5"
      style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Background Animation */}
      <div className="position-absolute w-100 h-100" style={{
        background: `
          radial-gradient(circle at 20% 50%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 80%, rgba(255,255,255,0.05) 0%, transparent 50%)
        `,
        pointerEvents: 'none',
        top: 0,
        left: 0,
        zIndex: 0
      }}></div>

      <div className="container position-relative z-1">
        <div className="row mb-5 g-4">
          <div className="col-lg-3 col-md-6">
            <div style={{ marginBottom: '1rem' }}>
              <img 
                src="/img/logomarcafull.png" 
                alt="QUOTIX" 
                style={{ height: '40px' }}
              />
            </div>
            <p className="mb-3 opacity-90">
              A plataforma moderna para simplificar e ampliar suas vendas de seguros de veículos com tecnologia avançada.
            </p>
            <div className="d-flex gap-2">
              <a href="#" className="btn btn-light btn-sm rounded-circle p-2" style={{ opacity: 0.8 }}>
                <i className="fab fa-facebook-f text-primary"></i>
              </a>
              <a href="#" className="btn btn-light btn-sm rounded-circle p-2" style={{ opacity: 0.8 }}>
                <i className="fab fa-twitter text-info"></i>
              </a>
              <a href="#" className="btn btn-light btn-sm rounded-circle p-2" style={{ opacity: 0.8 }}>
                <i className="fab fa-linkedin-in text-primary"></i>
              </a>
            </div>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5 className="font-weight-bold mb-3">Produto</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#services" className="text-white text-decoration-none hover-text-light">Recursos</a>
              </li>
              <li className="mb-2">
                <a href="#pricing" className="text-white text-decoration-none hover-text-light">Preços</a>
              </li>
              <li className="mb-2">
                <a href="/" className="text-white text-decoration-none hover-text-light">Home</a>
              </li>
              <li className="mb-2">
                <a href="/login" className="text-white text-decoration-none hover-text-light">Login</a>
              </li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5 className="font-weight-bold mb-3">Empresa</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">Sobre Nós</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">Blog</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">Carreira</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">Contato</a>
              </li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h5 className="font-weight-bold mb-3">Legal</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">Privacidade</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">Termos de Serviço</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">LGPD</a>
              </li>
              <li className="mb-2">
                <a href="#" className="text-white text-decoration-none hover-text-light">Cookies</a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="bg-white opacity-20" />

        <div className="row align-items-center mt-4">
          <div className="col-md-6 text-center text-md-start">
            <p className="mb-0 opacity-90">
              © {currentYear} QUOTIX - Plataforma de Seguros. Todos os direitos reservados.
            </p>
          </div>
          <div className="col-md-6 text-center text-md-end">
            <p className="mb-0 opacity-90">
              Desenvolvido com <i className="fas fa-heart text-light"></i> por nossa equipe
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .hover-text-light:hover {
          color: rgba(255, 255, 255, 0.8) !important;
          transition: color 0.3s ease;
        }

        footer a {
          transition: all 0.3s ease;
        }

        footer a:hover {
          opacity: 0.8;
        }
      `}</style>
    </footer>
  )
}

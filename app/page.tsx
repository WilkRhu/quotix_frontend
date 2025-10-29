'use client'

import Hero from '../components/Landing/Hero'
import Features from '../components/Landing/Features'
import PricingCards from '../components/Landing/PricingCards'
import Footer from '../components/Landing/Footer'

export default function Home() {
  return (
    <div>
      <style>{`
        .navbar-premium {
          background: rgba(255, 255, 255, 0.98) !important;
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(102, 126, 234, 0.1);
          box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
        }

        .nav-link-premium {
          position: relative;
          color: #4a5568 !important;
          font-weight: 500;
          font-size: 0.95rem;
          transition: all 0.3s ease;
        }

        .nav-link-premium::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #667eea, #764ba2);
          transition: width 0.3s ease;
        }

        .nav-link-premium:hover {
          color: #667eea !important;
        }

        .nav-link-premium:hover::after {
          width: 100%;
        }

        .btn-login-premium {
          color: #667eea !important;
          border: 2px solid #667eea;
          font-weight: 600;
          transition: all 0.3s ease;
          background: transparent;
        }

        .btn-login-premium:hover {
          background: #667eea;
          color: white !important;
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
        }

        .btn-signup-premium {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white !important;
          border: none;
          font-weight: 600;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }

        .btn-signup-premium:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }

        .brand-premium {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          font-size: 1.3rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          transition: all 0.3s ease;
        }

        .brand-premium:hover {
          transform: scale(1.05);
        }

        .brand-icon {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.8rem;
        }
      `}</style>

      <nav className="navbar navbar-expand-lg navbar-premium sticky-top">
        <div className="container">
          <a className="navbar-brand brand-premium" href="/">
            <img 
              src="/img/logomarcafull.png" 
              alt="QUOTIX" 
              style={{ height: '50px' }}
            />
          </a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" style={{ borderColor: '#667eea' }}>
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto align-items-lg-center gap-1">
              <li className="nav-item">
                <a className="nav-link nav-link-premium" href="#services">
                  <i className="fas fa-sparkles me-2" style={{ color: '#667eea' }}></i>Recursos
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link nav-link-premium" href="#pricing">
                  <i className="fas fa-tag me-2" style={{ color: '#667eea' }}></i>Preços
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link nav-link-premium" href="/vendedores">
                  <i className="fas fa-user-tie me-2" style={{ color: '#667eea' }}></i>Para Vendedores
                </a>
              </li>

              <li className="nav-item ms-lg-3">
                <a className="nav-link btn btn-login-premium px-3 py-2 rounded-lg" href="/login">
                  Login
                </a>
              </li>
              <li className="nav-item ms-lg-2">
                <a className="nav-link btn btn-signup-premium px-4 py-2 rounded-lg" href="/cadastro">
                  <i className="fas fa-rocket me-2"></i>Começar Grátis
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
      
      <Hero />
      <Features />
      <PricingCards />
      <Footer />
    </div>
  )
}